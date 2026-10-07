// Copies every legacy child's book into the deployment admin's own workspace
// (see src/child-books.ts): manuscript files, reading progress, last-opened chapter and the
// full tutor conversation are carried over; the source accounts and their data are left
// untouched. Child sign-in was never restored on this deployment, so this is how those books
// become openable again.
//
// Usage:
//   node scripts/child-books-migrate.mjs <base-url> plan   # dry run: lists books + targets
//   node scripts/child-books-migrate.mjs <base-url> run    # performs the copy (idempotent)
//
//   <base-url> is the deployment's origin, e.g. https://workshop.example.com
//
// Authentication (pick one, via environment):
//   CF_ACCESS_JWT     a Cloudflare Access JWT, sent as cf-access-token -- for production
//                     behind Access. Get one with cloudflared:
//                       cloudflared access login https://family-os.kazu-san.workers.dev
//                       export CF_ACCESS_JWT="$(cloudflared access token \
//                         -app=https://family-os.kazu-san.workers.dev)"
//   WORKSHOP_TOKEN    an existing session token
//   WORKSHOP_USERNAME + WORKSHOP_PASSWORD   logs in with username/password (local dev)
//
// The account must be a deployment admin (env ADMINS), or getAdminApi() returns null.
// The report (one entry per source book: child, source gadget, destination, outcome,
// file/message counts) prints as JSON.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const [baseUrl, mode] = process.argv.slice(2);
if (!baseUrl || !['plan', 'run'].includes(mode ?? '')) {
  throw new Error('Usage: child-books-migrate.mjs <base-url> plan|run');
}
const require = createRequire(resolve(import.meta.dirname, '../package.json'));
const {newHttpBatchRpcSession} = require('capnweb');

const apiUrl = new URL('/api', baseUrl);
const headers = {'Origin': apiUrl.origin};
if (process.env.CF_ACCESS_JWT) {
  // cf-access-token is what the Access edge validates; once it passes, the edge itself injects
  // cf-access-jwt-assertion downstream. The assertion header below is belt-and-suspenders for
  // setups where the Worker sees it directly.
  headers['cf-access-token'] = process.env.CF_ACCESS_JWT;
  headers['cf-access-jwt-assertion'] = process.env.CF_ACCESS_JWT;
}

// Probe before opening sessions: an unauthenticated request to an Access-protected origin never
// reaches the Worker -- the edge bounces it to the hosted login page (a redirect, or an HTML
// response). The real /api answers GET with a plain 400, so either shape here means Access
// turned us away; fail with the fix, not a JSON parse error from capnweb.
const probe = await fetch(apiUrl, {method: 'GET', headers, redirect: 'manual'});
if ((probe.status >= 300 && probe.status < 400)
    || (probe.headers.get('content-type') ?? '').includes('text/html')) {
  throw new Error(`Cloudflare Access did not authenticate this request (the edge answered `
      + `with a login redirect/page, not the API). Get a fresh token:\n`
      + `  cloudflared access login ${apiUrl.origin}\n`
      + `  export CF_ACCESS_JWT="$(cloudflared access token -app=${apiUrl.origin})"\n`
      + `and run this script again.`);
}

const root = newHttpBatchRpcSession(
    new Request(apiUrl, {method: 'POST', headers, redirect: 'manual'}));

// An HTTP batch session is exactly ONE request: every call has to be pipelined before the
// first await lets the batch flush, and stubs handed back by an awaited call are dead (the
// request already ended). capnweb lets methods be invoked on unresolved RpcPromise proxies,
// so authenticate() -> getAdminApi() -> migrateChildBooks() goes out in the single batch,
// alongside amIAdmin() for a friendly non-admin error.
let token = process.env.WORKSHOP_TOKEN;
if (!process.env.CF_ACCESS_JWT && !token) {
  if (!process.env.WORKSHOP_USERNAME || !process.env.WORKSHOP_PASSWORD) {
    throw new Error('Set CF_ACCESS_JWT, WORKSHOP_TOKEN, or WORKSHOP_USERNAME+WORKSHOP_PASSWORD.');
  }
  // The frontend's hashing scheme (argon2id, username-salted); bundled on the fly the same
  // way the book code upgrade script does it. login() is its own session (its own batch).
  const hashBundle = await require('esbuild').build({
    entryPoints: [resolve(import.meta.dirname, '../../workshop-frontend/src/passwordHash.ts')],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  const {hashPassword} = await import('data:text/javascript;base64,'
      + Buffer.from(hashBundle.outputFiles[0].contents).toString('base64'));
  const hash = await hashPassword(process.env.WORKSHOP_USERNAME, process.env.WORKSHOP_PASSWORD);
  const loginRoot = newHttpBatchRpcSession(
      new Request(apiUrl, {method: 'POST', headers, redirect: 'manual'}));
  token = await loginRoot.login(process.env.WORKSHOP_USERNAME, hash);
  if (!token) throw new Error('Login failed (unknown username or wrong password).');
}

const api = process.env.CF_ACCESS_JWT ? root.authenticateFromCfAccess() : root.authenticate(token);
const admin = api.getAdminApi();
const [isAdmin, outcome] = await Promise.all([
  api.amIAdmin(),
  (mode === 'plan' ? admin.planChildBookMigration() : admin.migrateChildBooks())
      .then(report => ({report}), error => ({error})),
]);
if (!isAdmin) throw new Error('This account is not a deployment admin (see env ADMINS).');
if (outcome.error) throw outcome.error;
console.log(JSON.stringify(outcome.report, null, 2));
