# OpenCode Go and book contracts

Upstream baseline: `5cae880e5e54563895a067e7f4dae67514e581be`. Supported legacy book
capture: `f41f7db45e6a2ecf593241288b6ba5f02c405c71`.

## Decisions and verification contracts

| Decision / claim | Invariant | Gate / evidence |
| --- | --- | --- |
| DEC-Go / CLAIM-Go | Deployment-managed token stays in the Worker. Go keeps live availability/metadata and Pi 0.99.1 native Completions, Responses and Anthropic routing. Existing non-Go model resolution makes no Go HTTP request. Known Go IDs retain deployment priority; newly advertised IDs remain selectable. Catalog failure leaves other providers available, while Go execution reports its own failure. | `test:go:contract`: real loopback HTTP success, 503 and stalled responses with real User DOs. `test:go:live`: separate public-catalog and authorized inference cases. |
| DEC-Attachments / CLAIM-Attachments | Go image support comes from model metadata; PDFs additionally require the existing native/bridge protocol. Unsupported content is rejected before staging and before saving a message after model selection changes; replay also rejects unsupported Go media. Other providers keep their existing policy. Compaction uses the resolved Go handle's window/output capacity and existing configuration overrides. | Local metadata/capability/compaction contracts, real upload/selection/replay checks and normal UI rejection. |
| DEC-Consult / CLAIM-Consult | Flash alone can consult Pro; only explicit question/context is sent, Pro has no tools, and stored output/error is replayed after reload. | Real Pro request, normal UI consultation and history replay. |
| DEC-Book / CLAIM-Book | `format.book` and output `book` identify books. Generic bundled content is distinct from user manuscripts. The reader preserves TOC, chapters, math, progress, tutor and creation/editing. Saved SQLite TOCs suppress starter-file injection; untouched new books still have a starter. Instantiated executable snapshots are not rewritten by blueprint updates. | `test:book:storage`, signed MCP checks, normal new-book/TOC replacement and reload. |
| DEC-Auth / CLAIM-MCP | Standard upstream authentication and email-named User DOs apply. Human Access assertions reach only their own email and honor `signupsEnabled` on first creation. Service assertions require explicit existing owners and cannot provision accounts. The user index and workspace owner must both agree; MCP cannot write executable code. | `test:book:mcp`: real ephemeral RSA/JWKS issuer, valid/invalid assertions, registration, owner and file-path boundaries. This is not production Access passage. |
| DEC-Migration / CLAIM-Migration | Copy only validated legacy moved books. Preserve owner/workspace/gadget IDs, every manuscript/progress/tutor-message/settings row, accepted code, draft code and Workshop chat meta/messages including accepted/discarded conversations. Active agents, unresolved moves, nonempty capabilities and unsupported targets stop. Source remains unchanged. | Actual legacy-runtime capture → real SQLite/KV/Git migration; compare state, siblings and existing chat IDs; restart, identical no-op, conflicting retry and publication recovery. |
| DEC-Upstream / CLAIM-Upstream | No Family auth, move UI, unrelated tools or custom UI is added. The upstream toolchain/storage basis and non-Go provider contracts remain. | Baseline diff, `pnpm lint`, `pnpm build`, explicit related regression suites and normal UI evidence. |

The catalog HTTP deadline matches the existing outbound-fetch deadline in `web-fetch.ts`;
there is no invented freshness TTL. Only Go catalog errors are isolated when listing models.
Known Go IDs (suggested or already advertised by a successful catalog read) take precedence.
Before the first catalog read, an unknown dynamic Go ID that collides with an existing gateway
or user model resolves to that existing provider without Go HTTP. After catalog discovery it
takes Go precedence; the normal picker discovers the catalog before selecting a Go model.
This resolution rule preserves non-Go outage independence without a new ID namespace or
persistent catalog synchronization.
Advertised Go IDs missing from the Go metadata table use OpenCode's published entry when
present; otherwise they retain the existing protocol/model descriptor. Unknown media
capabilities are rejected, and compaction uses that same effective model descriptor.
Workspace book listing remains fail-closed: a workspace failure fails the entire request,
rather than silently presenting a partial result as a complete list.

## Book-only offline copy

Moved target records reference a source lease. Verify source/target owner, workspace ID,
gadget ID and lease token before copying. Accepted code, SQLite state and pending code live
at the source. The source is retained as the rollback copy, and no owner is reassigned.

The legacy fork's version 2 means action-index backfill, whereas upstream version 2 means
Git conversion. The offline planner validates exact provenance, Yjs/code/chat structures and
absence of Git heads before mapping only the copied destination to upstream version 1.
Migration runs Git 1→2 (stamp last), action-index transaction 2→3, and gadget-type stamping
3→4. Existing sources and already-Git workspaces are not reset.

Copy SQLite before transactional KV publication; equal existing SQL permits retry, different
SQL stops. Publication rebuilds chat/gadget indexes, preserves existing destination IDs, and
requires a stopped destination without competing writers. The receipt verifies source/state
hashes and accepted/draft equality for repeat no-op. Worker-restart recovery is tested; power
loss is not established by that test.

Pruned target snapshots stop because sibling code/history cannot yet be converted safely.
Moved gatekeeper IDs are capabilities, so nonempty bindings stop instead of being copied or
dropped. A same-owner explicit detach/copy/standard Go reconnect can be tested on an isolated
copy; automatic reconnection is not provided. Legacy UUID child owners have no equivalent
standard password/email sign-in route. Preserving IDs does not establish accessibility, and
neither adult reassignment nor Family authentication is performed.

## Reproduce checks

After `pnpm install --frozen-lockfile`, run `pnpm lint` and `pnpm build` at the repository root.
Dedicated backend scripts do not forward arbitrary file arguments through compound scripts:
use the exact dedicated script or `pnpm exec vitest run` with explicit files/config when selecting
cases. Do not infer focused coverage from a whole-suite run.

```sh
pnpm --filter @gadgets/workshop-backend test:go:contract
pnpm --filter @gadgets/workshop-backend test:book:storage
pnpm --filter @gadgets/workshop-backend test:book:mcp
LEGACY_BOOK_FIXTURE=/absolute/path/to/capture.json \
  pnpm --filter @gadgets/workshop-backend test:book:migration
# Explicit authorization and OPENCODE_GO_API_TOKEN environment required:
pnpm --filter @gadgets/workshop-backend test:go:live
```

See [book test environments](../packages/workshop-backend/scripts/book-tests/README.md) for
pinned legacy preparation/capture, paid live gates and optional sibling/history/connection
variants, and [Book MCP](book-mcp.md) for public tool usage. Book tests live outside the upstream
integration glob; live HTTP/inference tests live outside the normal unit glob. Missing required
inputs fail instead of skipping. Normal Go unit tests use pure contracts; the local contract
suite uses a real loopback HTTP server, not fetch replacement.

## Output and known verification limits

Firefox normal HTML/PDF menu → real download/save completed for a preserved text-and-math
chapter. Saved HTML and PDF content, fonts and superscript rendering were inspected. The reader's
brand/tutor images are outside the PDF print body; this fixture has no embedded manuscript image.
Chrome HTML/PDF clicks reach their handlers, but native-dialog save completion is unverified.
Native GUI control failures do not establish an application defect or a permission-only cause.

Production Access, production migration, child-owner reachability, power-loss recovery and
arbitrary embedded-image manuscripts remain separate unverified surfaces. Existing mock-dependent
suites are not accepted as real Worker/UI evidence. Per-run logs, screenshots, command results,
input hashes and review dispositions belong in the PR's external verification evidence, rather
than checkout-local paths in this contract.
