# Existing Family OS deployment cutover

The production build targets the existing `family-os` and `family-os-context`
Workers. It retains all eight backend and four Context SQLite class names, their
existing KV/R2 bindings and the deployment-managed Go secret. The only additional
namespace is upstream's user directory. Production configuration is generated
from `scripts/production-config.ts`; package Wrangler configurations remain the
standard upstream development configuration.

```sh
pnpm install --frozen-lockfile
node scripts/deploy-production.ts              # both Workers, dry-run by default
node scripts/deploy-production.ts --config-only
# Deployment operator only, after reviewing the dry-run and preserving a PITR point:
node scripts/deploy-production.ts --execute
```

The execute path deploys Context before the Workshop and uses the same public
origin, including `/gatekeeper/context/*`. It never calls `secret put`. Existing
Access and deployment-admin configuration remains the authentication boundary.
Dry-run validates local artifacts; it does not apply or verify a live namespace
reconciliation.

| Decision / claim | Invariant | Gate |
| --- | --- | --- |
| DEC-1: distinguish fork version 2 from Git version 2 | Existing gadget commit heads or chat code bases suppress reconversion; legacy Yjs rows and complete snapshot parts remain on disk | Real Worker restart test and same-storage old/new runtime |
| DEC-2: read retained Yjs snapshots | Missing snapshot parts, unavailable pinned chat/blueprint history stop before Git writes | Snapshot reconstruction and migration tests |
| DEC-3: retain original child owners | Standard authenticated deployment admin may build a registered child's book workspace; UUID/User DO owner and capability graph are unchanged | Old runtime creates child; new runtime and normal login open its book |
| DEC-4: retain obsolete namespaces | Family registry is read only; browser semaphore class retains its data; model/spawner classes remain exported | Production lifecycle map and both Wrangler dry-runs |
| DEC-5: do not invent move routing | Legacy moved/pending workspace construction stops, identifying workspace, count and gadget IDs without exposing lease tokens | Real SQLite guard leaves rows unchanged |

The old Family authentication endpoints are not restored. Admin access is a
workspace build capability for a child's workspace containing a book; it does
not confer ownership, sharing administration, or workspace deletion. Other users
retain upstream's collaborator checks. The child's own standard-login identity
is not created or reassigned. Admin listings include child-owned books and avoid
duplicating already shared entries.

Moved gadgets keep their executable code, SQLite facet and connection capabilities
in the original source workspace. A target registry alone is insufficient to run
such a book. Both move proxies and pending/leased source records are therefore
preserved and explicitly refused; no empty replacement facet, automatic detach,
owner transfer or lease reissue is performed. A historical chat or unpublished
blueprint pinned before the oldest retained snapshot is likewise refused rather
than silently reconstructed from a different version. Inspection of actual
production occurrences and any targeted recovery remain deployment operations.

## Reproduce the isolated cutover

The fixture uses the actual pinned f41f7db4 source and ordinary account/book APIs.
Its diagnostic entrypoint is confined to that newly extracted source and checks
the normal session token, owner and (for child creation) admin. The live gate needs
an explicitly authorized Go token through the process environment; credentials
are never loaded by the committed tools or passed on argv.

```sh
node packages/workshop-backend/scripts/book-tests/prepare-cutover.mjs /tmp/new-cutover-legacy
cd /tmp/new-cutover-legacy
pnpm install --frozen-lockfile
pnpm --filter @gadgets/typed-storage build
pnpm --filter @gadgets/workshop-backend build:integration-worker
cd /absolute/path/to/cutover-worktree
pnpm --filter @gadgets/workshop-backend build:worker
# Build the standard password frontend into a separate local directory.
VITE_CF_ACCESS_MODE=false pnpm --filter @gadgets/workshop-frontend exec vite build --outDir /tmp/cutover-frontend
# Authorized existing OPENCODE_GO_API_TOKEN supplied only to this explicit invocation:
node packages/workshop-backend/scripts/book-tests/cutover-live.mjs \
  /tmp/new-cutover-legacy /tmp/cutover-frontend /tmp/cutover-ui.json
# In another terminal; existing installed Chrome / Playwright only:
taskpolicy -b node tests/e2e/productionCutover.mjs /tmp/cutover-ui.json /tmp/cutover-ui-evidence
# A new tutor turn through the retained book AI binding, then browser reload:
taskpolicy -b node tests/e2e/cutoverTutor.mjs /tmp/cutover-ui.json /tmp/cutover-tutor-evidence
pnpm --filter @gadgets/workshop-backend exec vitest run --config vitest.cutover.config.ts
pnpm lint
```

The harness updates code in one running Miniflare session while preserving Worker
and namespace identities. It performs no export/import or facet recreation.
`createTestHarness` uses transient SQLite storage: this demonstrates code cutover
and browser reload, not a disk-backed process shutdown/restart or a production
PITR restoration. The fixture keeps running until the operator terminates it;
its local password output is mode 600. Evidence belongs outside committed source.

## Stored shapes and deployment lifecycle

The fork's User profile, Argon2 password hash, login-session rows and connected
account capabilities use the same keys consumed by upstream's user storage.
The real password login after cutover checks these original credentials; the
old book's retained AI binding exercises its original model capability.
AdminSettings retains its `adminConfig` singleton and blueprint collections;
upstream merges missing soft-setting fields with its own defaults. KV blueprint
records still contain metadata plus the existing R2-compressed Yjs archive;
upstream's blueprint initializer reads that archive into Git without replacing
its KV/R2 objects. ContextCollection, UserLibrary and LibraryRegistry storage
implementations are unchanged between the pinned fork and the merged baseline;
ContextAccount retains its account/domain props and GatekeeperVendor export.
The old PendingLogin result/waiters were in memory, not persisted: an OAuth attempt
in flight must be restarted after replacement, while existing User sessions
remain valid. No migration of an unconfirmed authentication attempt is added.

Cloudflare's [class lifecycle reference](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
states that subsequent deployment of the same live class entry leaves its
namespace unchanged. Deletion/rename/transfer use explicit lifecycle tombstones.
Omitting a provisioned entry is not assumed safe: the production map explicitly
retains every existing live class. The locked Wrangler 4.138.0 likewise treats
an omitted `state` as a live SQLite class when configuring local namespaces.
The production lifecycle contract checks the complete original class set, absence
of migrations/tombstones, storage bindings, service entrypoint and secret-free
vars. `node scripts/production-http.mjs` additionally checks exact-prefix routing
with both real local Workers. Its unused remote Browser/Workers AI bindings are
omitted only in that local routing gate; the deployment configuration retains them.
