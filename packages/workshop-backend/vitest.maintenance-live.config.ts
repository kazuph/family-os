import{defineConfig}from'vitest/config';
import{cloudflareTest}from'@cloudflare/vitest-pool-workers';
import{readFileSync}from'node:fs';
import{resolve}from'node:path';
import{COMPATIBILITY_DATE}from'@gadgets/scripts/worker-config';
if(!process.env.MAINTENANCE_JWKS||!process.env.MAINTENANCE_LIVE_ARTIFACT||!process.env.MAINTENANCE_LIVE_FIXTURE)throw new Error('Use the signed local launcher and protected built artifacts');
const root=process.env.MAINTENANCE_LIVE_ARTIFACT;
const bindings={CF_ACCESS_ISS:process.env.MAINTENANCE_JWKS,CF_ACCESS_AUD:'maintenance-local',ADMINS:['Admin@local.test']};
export default defineConfig({
 plugins:[cloudflareTest({main:resolve(root,'family-os/worker.js'),miniflare:{
  compatibilityDate:COMPATIBILITY_DATE,compatibilityFlags:['experimental','nodejs_compat','allow_irrevocable_stub_storage'],workerLoaders:{LOADER:{}},
  bindings:{...bindings,MAINTENANCE_JWKS:process.env.MAINTENANCE_JWKS,MAINTENANCE_LIVE_FIXTURE:readFileSync(process.env.MAINTENANCE_LIVE_FIXTURE,'utf8')},
  durableObjects:{LIVE_OVERSEER:{className:'OverseerDurableObject',useSQLite:true}},
  additionalUnboundDurableObjects:['UserDurableObject','PendingLogin','FamilyDurableObject','AdminSettings','LanguageModelGatekeeper','AgentSpawnerGatekeeper','BrowserVerificationLimiterDurableObject'].map(className=>({className,useSQLite:true})),
  kvNamespaces:['AVATARS','BLUEPRINTS'],r2Buckets:['BLUEPRINT_CONTENT'],
 }})],
 test:{include:['scripts/production-maintenance/live-inspect.test.ts'],setupFiles:['@gadgets/scripts/assert-workerd']},
});
