# Temporary deployment maintenance

These entrypoints are deployment preparation, not application features. Build artifacts and
production source/data must stay outside Git in a protected directory. Commit only the preparation
implementation after its review. The normal application's authentication, owner IDs and connected
account authorities are not replaced.

## Current production preparation

The stopped entrypoints below are **not ready for production**. An absent alarm handler does not
freeze alarm delivery, and stopped Context classes do not preserve its Vendor entrypoint.
Use `build-live-inspect.mjs` to add signed root inspection to the recognized deployed source.
It inherits every original constructor and alarm and re-exports the original Worker entrypoints.
The existing `/api/*` asset routing reaches `/api/maintenance/inspect` and
`/api/maintenance/context/inspect`; a separate internal default Context service is used for the
latter. Both Workers enforce the existing verified human admin configuration. Context's existing
Vendor RPC remains unchanged. Original application requests continue to the original handler.

Live facet substitution is refused: inspect root agent/move/alarm state first. Root inspection
does not run the old stop/migration classes. Existing constructor/agent effects and concurrent
activity remain normal runtime behavior; the result is an observation, not a globally frozen DB.

Publication preparation uses reviewed multipart metadata with `keep_assets: true` and retained
secret bindings. Do not deploy its local Wrangler config: a local asset directory cannot establish
the original deployed bytes. `publish-live-inspect.mjs PROTECTED_ARTIFACT` validates without HTTP;
only the authorized parent may add `--execute`. No routes or workers.dev setting is changed.

`prepare-rollback.mjs SNAPSHOTS NEW_OUTPUT` hash-checks and preserves the original source/settings
and creates `rollback.mjs`. Its default is dry validation; parent-only `--execute` redeploys the
exact saved version of each Worker, reusing its attached assets/version settings. It does not
restore DO data, routes, or other non-versioned settings. Namespace lifecycle changes and deleted
resources must not precede this recovery path. After data conversion, restore the recorded native
PITR before returning to old application code.

Official contracts: [asset retention](https://developers.cloudflare.com/workers/static-assets/direct-upload/),
[version rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/),
[deployment API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/methods/create/).

Real live-runtime checks use the signed launcher with `--live` for the actual alarm handler and
`--harness` for both Workers, normal account/workspace/code APIs, Vendor/account/UI capabilities,
and signed Context inspection. Both require `MAINTENANCE_LIVE_ARTIFACT`; the alarm suite also
requires `MAINTENANCE_LIVE_FIXTURE`. No external credentials are used by these local tests.

`worker.ts` and `context-worker.ts` stop normal traffic. They require a verified Cloudflare Access
human email in the existing exact `ADMINS` list. Only GET inspection/bookmark routes are exposed.
No user registration or Family login is run. SQL application tables and typed KV values are read;
opaque values are explicitly marked as retained in the original namespace, not serialized as an
external backup. The original gadget constructor is never loaded. A loader-only reader opens the
same persisted gadget facet name; it does not introduce a root namespace.

`migration-worker.ts` is a **separate write stage**, for an operator-controlled maintenance window.
It takes an explicit namespace object ID, stored owner ID and recognized source digest. It gets a
native PITR bookmark before converting. The source digest pins the inspected deployed schema;
unknown versions, active agents, pending gadget lifecycles, moved gadgets and partition-pruned
history stop before publication. The recognized converter reuses the upstream Git converter in a
storage transaction, backfills indexes and workpiece types, keeps old Yjs rows, and records an
idempotent receipt. It never copies credentials, changes an owner or restarts a binding.

`same-origin.ts` keeps the existing backend origin and forwards only `/gatekeeper/context` to a
separate HTTP service binding. The Context vendor RPC binding remains separate. Archive classes
keep the two removed namespaces addressable without restoring Family authentication.

## Verification

Generate a fixture from the protected actual deployed source with `prepare-live-fixture.mjs`,
then `capture-live-fixture.mjs`. The latter uses the old application's standard account and
workspace APIs on a new isolated emulator. It does not read production DBs.

Run from the backend package:

```
MAINTENANCE_LIVE_FIXTURE=/absolute/protected/generated-workspace.json node scripts/production-maintenance/run.mjs
```

The launcher creates a real local signed JWKS service and runs only
`vitest.maintenance.config.ts`. It performs no external authentication or inference. The tests use
real workerd storage, a real dynamic Worker, and a real stored service authority.

Build protected local stages from reviewed configurations:

```
node scripts/production-maintenance/build-stage.mjs /absolute/backend-draft.jsonc /absolute/new-stage backend
node scripts/production-maintenance/build-stage.mjs /absolute/context-draft.jsonc /absolute/new-stage context
node scripts/production-maintenance/build-stage.mjs /absolute/backend-draft.jsonc /absolute/new-stage conversion
node scripts/production-maintenance/build-stage.mjs /absolute/backend-draft.jsonc /absolute/new-stage same-origin
```

No command here uploads or deploys. The caller must review resource identities, unchanged lifecycle
exports and the stop window before any production operation. Native Cloudflare PITR restoration is
not established by the all-zero bookmark returned by the local emulator. Do not represent that
placeholder as a production recovery point. Record real bookmarks before production writes and
keep the original source/settings version for recovery. Alarm handling and active operations must
be considered when stopping the deployment; GET invariance does not establish that background
alarm delivery is frozen. Resolve those from real inspection rather than clearing their state.

## Contract and limits

- DEC: keep namespace/owner/capability identity; portable complete duplication is not required.
- CLAIM/INV: signed human admin only; GET does not mutate root/facet or call retained authorities.
- CLAIM/INV: known Yjs conversion keeps accepted content and unaccepted changes, with transactional
  failure rollback and no-op reapplication. Unknown or unsupported states are not guessed.
- GATE/EVIDENCE: scoped real JWKS/workerd tests and protected live-source-generated fixture;
  local types/lint/artifact build. Production PITR, actual moved/pruned workspace handling and the
  final application switch require the operator's inspection of the deployed objects.
