import base from './vitest.config';
import {COMPATIBILITY_DATE} from '@gadgets/scripts/worker-config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import capnwebValidate from 'capnweb-validate/vite';
if (!process.env.GO_TEST_BASE_URL) throw new Error('Start the local HTTP catalog server with scripts/go-tests/run-contract.mjs');
export default {
  ...base,
  plugins: [base.plugins![0], capnwebValidate(), cloudflareTest({
    main: './__tests__/go-contract-worker.ts',
    miniflare: {
      compatibilityDate: COMPATIBILITY_DATE,
      compatibilityFlags: ['experimental','nodejs_compat','allow_irrevocable_stub_storage'],
      bindings: {GO_TEST_BASE_URL:process.env.GO_TEST_BASE_URL, OPENCODE_GO_API_TOKEN:'local-existence-check'},
      durableObjects: {TEST_USER:{className:'UserDurableObject',useSQLite:true}},
    },
  })],
  test: {...base.test, include:['__go_tests__/go-contract.test.ts','__tests__/opencode-go.test.ts','__tests__/chat-attachment-validation.test.ts'],testTimeout:60_000},
};
