import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import capnwebValidate from "capnweb-validate/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [
    capnwebValidate(),
    cloudflareTest({
      main: "./__book_tests__/book-test-worker.ts",
      remoteBindings: false,
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
      miniflare: {
        durableObjects: {
          // The seeding/inspection facet the test swaps into a book's facet slot to write
          // tutor messages and fingerprint the book's own SQLite.
          TEST_BOOK_SEED: { className: "BookSeedFacet", useSQLite: true },
        },
        additionalUnboundDurableObjects: [
          {className: 'UserDurableObject', useSQLite: true, unsafeUniqueKey: 'workshop-backend-UserDurableObject'},
          {className: 'OverseerDurableObject', useSQLite: true, unsafeUniqueKey: 'workshop-backend-OverseerDurableObject'},
        ],
        bindings: {
          // The deployment admin the upgrade test mints its capability for.
          ADMINS: JSON.stringify(["admin"]),
        },
      },
    }),
  ],
  test: {
    include: ["__book_tests__/book-code-upgrade.test.ts"],
    // Asserts the pool actually started, rather than trusting a green run to mean workerd.
    setupFiles: ["@gadgets/scripts/assert-workerd"],
    // Whichever test runs first pays for workerd booting and instantiating the whole backend
    // bundle -- ~6s on a dev machine and roughly 3x that on a CI runner, while every subsequent
    // test in the file finishes in tens of milliseconds. The timeout has to clear that cold
    // start, not the steady-state cost, or the first test fails wherever the runner is slow.
    testTimeout: 60_000,
  },
});
