# Production deployment

The production build targets the existing `family-os` and `family-os-context`
Workers. It retains all backend and Context SQLite class names, their existing
KV/R2 bindings and the deployment-managed Go secret. Production configuration is
generated from `scripts/production-config.ts`; package Wrangler configurations
remain the standard development configuration.

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

## Durable Object class lifecycle

Cloudflare's [class lifecycle reference](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
states that subsequent deployment of the same live class entry leaves its
namespace unchanged. Deletion/rename/transfer use explicit lifecycle tombstones.
Omitting a provisioned entry is not assumed safe: the production map explicitly
retains every existing live class. The locked Wrangler likewise treats an omitted
`state` as a live SQLite class when configuring local namespaces. The production
lifecycle contract checks the complete original class set, absence of
migrations/tombstones, storage bindings, service entrypoint and secret-free
vars. `node scripts/production-http.mjs` additionally checks exact-prefix routing
with both real local Workers. Its unused remote Browser/Workers AI bindings are
omitted only in that local routing gate; the deployment configuration retains
them.

`FamilyDurableObject`, `BrowserVerificationLimiterDurableObject` and
`BookDataFacet` remain as empty classes in `src/legacy-family.ts` for this same
reason: their namespaces were provisioned by earlier deployments, and removing a
live class entry is irreversible. They carry no code paths; they exist only so
the declared class set keeps matching the deployed namespaces.
