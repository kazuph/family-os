import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import capnwebValidate from 'capnweb-validate/vite';
import { defineConfig } from 'vitest/config';

// This is a captured real old-runtime database, never a synthetic replacement for one.
const fixturePath = process.env.LEGACY_BOOK_FIXTURE;
if (!fixturePath) throw new Error('LEGACY_BOOK_FIXTURE must name the old-runtime capture');
const connectedFixturePath = process.env.LEGACY_CONNECTED_BOOK_FIXTURE;
export default defineConfig({
  plugins: [capnwebValidate(), cloudflareTest({
    main: './__book_tests__/book-test-worker.ts',
    remoteBindings: false,
    wrangler: { configPath: './wrangler.jsonc' },
    miniflare: {
      durableObjects: {
        TEST_BOOK_COPY: {className: 'BookOfflineCopyFacet', useSQLite: true},
        // A local Worker replacement retains namespace identity; the pool's default name does not.
      },
      additionalUnboundDurableObjects: [
        {className: 'UserDurableObject', useSQLite: true, unsafeUniqueKey: 'workshop-backend-UserDurableObject'},
        {className: 'OverseerDurableObject', useSQLite: true, unsafeUniqueKey: 'workshop-backend-OverseerDurableObject'},
      ],
      bindings: {
        LEGACY_BOOK_SNAPSHOT: readFileSync(fixturePath, 'utf8'),
        ...(connectedFixturePath ? { LEGACY_CONNECTED_BOOK_SNAPSHOT: readFileSync(connectedFixturePath, 'utf8') } : {}),
      },
    },
  })],
  test: {
    include: ['__book_tests__/book-migration.test.ts'],
    setupFiles: ['@gadgets/scripts/assert-workerd'],
    testTimeout: 60_000,
  },
});
