# Book test environments

`pnpm test` / backend `test:run` / `test:integration` keep the upstream unit and
integration configs. `__integration__/*.test.ts` uses the production entrypoint.
Book-only tests and their restore/offline-copy Workers live in `__book_tests__`,
outside that glob. None is deleted or skipped. The four existing upstream skips
in open-gadget-rpc are unchanged. Dedicated commands are explicit and not part of
CI's default `test` task.

From the repository root, after `pnpm install --frozen-lockfile` and `pnpm build`:

```sh
pnpm --filter @gadgets/workshop-backend test:integration
pnpm --filter @gadgets/workshop-backend test:book:storage
# Authorized OPENCODE_GO_API_TOKEN in the process environment, not argv.
pnpm --filter @gadgets/workshop-backend test:book:mcp
LEGACY_BOOK_FIXTURE=/absolute/path/to/legacy-generated-book.json \
  pnpm --filter @gadgets/workshop-backend test:book:migration
```

MCP's launcher creates real ephemeral RSA keys and a loopback HTTP JWKS issuer,
serves signed owner/service and invalid assertions, starts the dedicated workerd
suite with `BOOK_TEST_ACCESS_ISS`, and closes the issuer after the suite. The default book.create tutor binding requires an explicitly supplied existing Go
credential. This suite makes no inference request,
but is kept outside normal CI and never loads credentials automatically. This proves local JWT boundaries, not passage
through a production Access deployment. Storage uses a dedicated restore bridge;
migration uses actual old-runtime capture, native namespace IDs, and the dedicated
copy facet. Missing migration input is an error, never a skip or synthetic fixture.

## Generate a real old-runtime capture (explicit paid live gate)

The capture calls the real old tutor once at the official Go endpoint. Run only
with authorization to use an existing Go token; it is never invoked by CI or a
normal test command. The token must be provided through the process environment,
not argv, a persisted env file, or logs. The tool does not read credential files.
The pinned git object must be available locally. The destination must be new.

```sh
node packages/workshop-backend/scripts/book-tests/prepare-legacy.mjs /tmp/isolated-legacy-book
cd /tmp/isolated-legacy-book
pnpm install --frozen-lockfile
pnpm --filter @gadgets/typed-storage build
pnpm --filter @gadgets/workshop-backend build:integration-worker
cd /absolute/path/to/upstream-worktree
# OPENCODE_GO_API_TOKEN supplied by an authorized local launcher/environment.
node packages/workshop-backend/scripts/book-tests/capture-legacy-live.mjs \
  /tmp/isolated-legacy-book /tmp/legacy-generated-book.json
LEGACY_BOOK_FIXTURE=/tmp/legacy-generated-book.json \
  pnpm --filter @gadgets/workshop-backend test:book:migration
```

`prepare-legacy` archives exactly f41f7db45e6a2ecf593241288b6ba5f02c405c71 and
adds only the owner/session-checked local diagnostic entrypoint. It changes no
checkout, branch, production entrypoint or secret. `capture-legacy-live` uses a
fresh createTestHarness without persistent production storage, normal signup and
owner APIs to write manuscript, complete a chapter, ask the real tutor, detach AI,
create an unaccepted code draft and move the book. It refuses to overwrite the
output. The existing source remains intact. This fixture is binding-free and uses
source/target gadget ID 0; it does not prove connected books, child authentication,
different moved IDs, multiple sibling gadgets or pruned target migration.

`--with-siblings` additionally creates accepted sibling gadgets on both sides,
so the moved book has different source/destination gadget IDs. `--with-connections`
captures the connected state as `OUTPUT.connected.json`, reconnects the same
owner's public session after the move, and explicitly unbinds AI through the
destination gadget before capturing `OUTPUT`. It never clones a capability.
Pass the connected capture as `LEGACY_CONNECTED_BOOK_FIXTURE` alongside
`LEGACY_BOOK_FIXTURE` to verify that the connected plan refuses changes while
the explicitly detached capture migrates. The migration suite also discards the
converted proposal through the owner's API and compares every accepted file
after a Worker restart. Browser accept/discard checks must use separate disposable
copies; keep the captured source unchanged.

Standalone real Go inference is likewise explicit:

```sh
# Requires an authorized OPENCODE_GO_API_TOKEN environment; no automatic credential lookup.
pnpm --filter @gadgets/workshop-backend test:go:live
```

`--with-chat-history` additionally generates accepted, reverted and still-proposed conversations
through the old runtime's normal APIs, plus a pre-existing destination conversation and sibling
code. Migration compares every user message and metadata record, checks active-agent refusal for
each chat regardless of draft state, and preserves the destination conversation IDs.

The deterministic Go contract gate runs a real loopback HTTP catalog server with successful,
503 and stalled responses; it needs no real Go credential and never contacts a public catalog:

```sh
pnpm --filter @gadgets/workshop-backend test:go:contract
```

Do not put Go inference/capture into normal CI. Public catalog HTTP tests are
separate from authorized inference and do not establish authentication success.
