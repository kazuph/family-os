// Upgrades the code of every book the deployment admin owns to the currently installed book
// template (see src/book-code-upgrade.ts). Books keep a copy of their gadget code from the
// template they were created with, so template fixes never reach existing books without this.
//
// Usage:
//   node scripts/book-code-upgrade.mjs <base-url> plan   # dry run: lists books + changes
//   node scripts/book-code-upgrade.mjs <base-url> run    # writes one code commit per book
//
//   <base-url> is the deployment's origin, e.g. https://workshop.example.com
//
// Authentication (pick one, via environment):
//   CF_ACCESS_JWT     a Cloudflare Access JWT (`cloudflared access token -app=<aud>`), sent as
//                     cf-access-jwt-assertion -- for production behind Access
//   WORKSHOP_TOKEN    an existing session token
//   WORKSHOP_USERNAME + WORKSHOP_PASSWORD   logs in with username/password (local dev)
//
// The account must be a deployment admin (env ADMINS), or getAdminApi() returns null.
// The report (one entry per book: workspace, code kind, changes/outcome) prints as JSON.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const [baseUrl, mode] = process.argv.slice(2);
if (!baseUrl || !['plan', 'run'].includes(mode ?? '')) {
  throw new Error('Usage: book-code-upgrade.mjs <base-url> plan|run');
}
const require = createRequire(resolve(import.meta.dirname, '../package.json'));
const {newHttpBatchRpcSession} = require('capnweb');

const apiUrl = new URL('/api', baseUrl);
const headers = {'Origin': apiUrl.origin};
if (process.env.CF_ACCESS_JWT) {
  headers['cf-access-jwt-assertion'] = process.env.CF_ACCESS_JWT;
}
const root = newHttpBatchRpcSession(new Request(apiUrl, {method: 'POST', headers}));

// An HTTP batch session is exactly ONE request: every call has to be pipelined before the
// first await lets the batch flush, and stubs handed back by an awaited call are dead (the
// request already ended). capnweb lets methods be invoked on unresolved RpcPromise proxies,
// so authenticate() -> getAdminApi() -> planBookCodeUpgrade() goes out in the single batch,
// alongside amIAdmin() for a friendly non-admin error.
let token = process.env.WORKSHOP_TOKEN;
if (!process.env.CF_ACCESS_JWT && !token) {
  if (!process.env.WORKSHOP_USERNAME || !process.env.WORKSHOP_PASSWORD) {
    throw new Error('Set CF_ACCESS_JWT, WORKSHOP_TOKEN, or WORKSHOP_USERNAME+WORKSHOP_PASSWORD.');
  }
  // The frontend's hashing scheme (argon2id, username-salted); bundled on the fly the same
  // way the book cutover script does it. login() is its own session (its own batch).
  const hashBundle = await require('esbuild').build({
    entryPoints: [resolve(import.meta.dirname, '../../workshop-frontend/src/passwordHash.ts')],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  const {hashPassword} = await import('data:text/javascript;base64,'
      + Buffer.from(hashBundle.outputFiles[0].contents).toString('base64'));
  const hash = await hashPassword(process.env.WORKSHOP_USERNAME, process.env.WORKSHOP_PASSWORD);
  const loginRoot = newHttpBatchRpcSession(new Request(apiUrl, {method: 'POST', headers}));
  token = await loginRoot.login(process.env.WORKSHOP_USERNAME, hash);
  if (!token) throw new Error('Login failed (unknown username or wrong password).');
}

const api = process.env.CF_ACCESS_JWT ? root.authenticateFromCfAccess() : root.authenticate(token);
const admin = api.getAdminApi();
const [isAdmin, outcome] = await Promise.all([
  api.amIAdmin(),
  (mode === 'plan' ? admin.planBookCodeUpgrade() : admin.upgradeBookCode())
      .then(report => ({report}), error => ({error})),
]);
if (!isAdmin) throw new Error('This account is not a deployment admin (see env ADMINS).');
if (outcome.error) throw outcome.error;
console.log(JSON.stringify(outcome.report, null, 2));
