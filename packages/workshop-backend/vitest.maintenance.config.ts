import {readFileSync} from 'node:fs';
import {defineConfig} from 'vitest/config';
import {cloudflareTest} from '@cloudflare/vitest-pool-workers';
import {COMPATIBILITY_DATE} from '@gadgets/scripts/worker-config';
if(!process.env.MAINTENANCE_JWKS)throw new Error('Use the real local JWKS launcher');
export default defineConfig({
  plugins:[cloudflareTest({
    main:'./scripts/production-maintenance/test-worker.ts',
    miniflare:{
      compatibilityDate:COMPATIBILITY_DATE,
      compatibilityFlags:['experimental','nodejs_compat','allow_irrevocable_stub_storage'],
      workerLoaders:{LOADER:{}},
      bindings:{CF_ACCESS_ISS:process.env.MAINTENANCE_JWKS,CF_ACCESS_AUD:'maintenance-local',ADMINS:['Admin@local.test'],MAINTENANCE_JWKS:process.env.MAINTENANCE_JWKS,...(process.env.MAINTENANCE_LIVE_FIXTURE?{MAINTENANCE_LIVE_FIXTURE:readFileSync(process.env.MAINTENANCE_LIVE_FIXTURE,'utf8')}:{})},
      durableObjects:{MAINTENANCE_TEST:{className:'OverseerDurableObject',useSQLite:true},CONVERSION_TEST:{className:'ConversionFixture',useSQLite:true}},
      additionalUnboundDurableObjects:['StoredAuthority','ApplicationFacet'].map(className=>({className,useSQLite:true})),
    },
  })],
  test:{include:['scripts/production-maintenance/read-only.test.ts'],setupFiles:['@gadgets/scripts/assert-workerd']},
});
