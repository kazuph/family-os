import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import capnwebValidate from 'capnweb-validate/vite';
import { defineConfig } from 'vitest/config';
if (!process.env.OPENCODE_GO_API_TOKEN) throw new Error('Explicit Go token required for the default tutor model binding; no inference is performed');
if (!process.env.BOOK_TEST_ACCESS_ISS) throw new Error('Start the real local JWKS signer first');
export default defineConfig({
  plugins: [capnwebValidate(), cloudflareTest({
    main: './__book_tests__/book-test-worker.ts', remoteBindings: false,
    wrangler: {configPath: './wrangler.jsonc'},
    miniflare: {durableObjects: {TEST_LANGUAGE_MODEL: {className: 'LanguageModelGatekeeper', useSQLite: true}}, bindings: {
      CF_ACCESS_ISS: process.env.BOOK_TEST_ACCESS_ISS,
      CF_ACCESS_AUD: 'book-local-audience',
      OPENCODE_GO_API_TOKEN: process.env.OPENCODE_GO_API_TOKEN,
    }},
  })],
  test: {include: ['__book_tests__/book-mcp.test.ts'], setupFiles: ['@gadgets/scripts/assert-workerd'], testTimeout: 60_000},
});
