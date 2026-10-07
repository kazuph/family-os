import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { COMPATIBILITY_DATE } from '@gadgets/scripts/worker-config'
import capnwebValidate from 'capnweb-validate/vite'

// Same *.txt-as-Text mirror of wrangler's module rules as vitest.config.ts, which this file's
// bindings comment explains alongside its own. Duplicated rather than shared because each vitest
// config is standalone.
const textModules: Plugin = {
  name: 'text-modules',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source.endsWith('.txt') && importer !== undefined) {
      return path.resolve(path.dirname(importer), source)
    }
  },
  load(id) {
    if (id.endsWith('.txt')) {
      return `export default ${JSON.stringify(readFileSync(id, 'utf-8'))};`
    }
  },
}

/**
 * The legacy child-book migration test (__book_tests__/child-book-migration.test.ts) needs a
 * fuller deployment than the unit suite: the AdminSettings singleton it orchestrates through,
 * the Family registry it scans, the BLUEPRINTS KV / BLUEPRINT_CONTENT R2 the destination
 * template is installed from, and the facet classes its storage reads are bound over. Binding
 * those in the shared vitest.config.ts would change every other test's environment (some
 * depend on BLUEPRINTS failing fast when unbound), so they live here, like the other book-only
 * configs.
 */
export default defineConfig({
  plugins: [
    textModules,
    capnwebValidate(),
    cloudflareTest({
      // The production Worker plus test-only entrypoints (see __tests__/test-worker.ts).
      main: './__tests__/test-worker.ts',
      miniflare: {
        compatibilityDate: COMPATIBILITY_DATE,
        // `allow_irrevocable_stub_storage` as in cloudflare.config.ts: the user DO persists account stubs.
        compatibilityFlags: ['experimental', 'nodejs_compat', 'allow_irrevocable_stub_storage'],
        bindings: {
          PUBLIC_BASE_URL: 'https://workshop.example/',
          // The deployment admin the migration test mints its capability for.
          ADMINS: JSON.stringify(['admin']),
          ...(process.env.OPENCODE_GO_API_TOKEN
            ? { OPENCODE_GO_API_TOKEN: process.env.OPENCODE_GO_API_TOKEN } : {}),
        },
        // Bundled-blueprint installs (and the child-book migration, which stamps destinations
        // from format.book) read the blueprint record from KV and its archive from R2.
        kvNamespaces: ['BLUEPRINTS'],
        r2Buckets: ['BLUEPRINT_CONTENT'],
        // The overseer loads gadget code through this, so a test can run a real gadget facet.
        workerLoaders: { LOADER: {} },
        durableObjects: {
          TEST_OVERSEER: { className: 'OverseerDurableObject', useSQLite: true },
          TEST_USER: { className: 'UserDurableObject', useSQLite: true },
          TEST_PENDING_LOGIN: { className: 'PendingLogin', useSQLite: true },
          // Never addressed by name: a binding is what puts the class in `ctx.exports`, from
          // which the overseer instantiates it (with props) as one of its own facets.
          TEST_AGENT_SPAWNER: { className: 'AgentSpawnerGatekeeper', useSQLite: true },
          TEST_USER_DIRECTORY: { className: 'UserDirectoryDurableObject', useSQLite: true },
          // The deployment settings singleton the child-book migration runs through.
          TEST_ADMIN_SETTINGS: { className: 'AdminSettings', useSQLite: true },
          // The legacy child registry the migration reads.
          TEST_FAMILY: { className: 'FamilyDurableObject', useSQLite: true },
          // The old-runtime book gadget, runnable as a facet to read a migrated book.
          TEST_LEGACY_BOOK: { className: 'LegacyBookGadget', useSQLite: true },
          // The current template's book gadget, likewise for the migrated destination.
          TEST_NEW_BOOK: { className: 'NewBookGadget', useSQLite: true },
          // The migration's book-storage facet class, bound over a gadget's facet name.
          TEST_BOOK_DATA: { className: 'BookDataFacet', useSQLite: true },
          // The raw-SQL test facet (test-worker.ts) used to seed and fingerprint book tables.
          TEST_SQL: { className: 'TestSqlFacet', useSQLite: true },
        },
      },
    }),
  ],
  test: {
    include: ['__book_tests__/child-book-migration.test.ts'],
    // Asserts the pool actually started, rather than trusting a green run to mean workerd.
    setupFiles: ['@gadgets/scripts/assert-workerd'],
  },
})
