# Book MCP

Family OS exposes a stateless Streamable HTTP MCP endpoint at `/mcp` so a local authoring agent can
read and update the table of contents and Markdown chapters of a Workspace Book instance.

## Security boundary

Put `/mcp` behind a Cloudflare Access policy that accepts service tokens. The Worker validates the
signed `Cf-Access-Jwt-Assertion` and accepts only service-token assertions (`common_name` present,
human `email` absent). Every tool call also names the owner's email. Before reading or writing, the
backend resolves that account, verifies that it owns the requested workspace, and verifies that the
workspace's default Gadget has output id `book`.

The endpoint is disabled when `CF_ACCESS_AUD` / `CF_ACCESS_ISS` are not configured. It never accepts
an application-supplied email as authentication, and it cannot edit `client.js`, `server.js`, or
other executable files. The writable paths are `content/toc.json` and Markdown files under
`content/` only.

## Tools

- `book.list`: list the owner's book workspaces.
- `book.read_files`: read all book content or selected content paths.
- `book.put_files`: add or replace the table of contents and Markdown chapter files.
- `book.read_progress`: read the Gadget's persisted chapter completion map.

`book.put_files` persists overrides in the book Gadget's own SQLite storage. The reader fetches the
current table of contents and chapters when it opens, so edits survive reload without rebuilding the
blueprint. The bundled chapters remain the default until an instance receives an override.

## Local client setup

Cloudflare Access normally accepts `CF-Access-Client-Id` and `CF-Access-Client-Secret`. Claude Code
can send both directly:

```sh
claude mcp add --transport http family-books https://family.example/mcp \
  --header "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  --header "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET"
```

For Codex, configure the Access application to accept its service token through a single
`Authorization` header, store that value in `FAMILY_BOOK_MCP_TOKEN`, then run:

```sh
codex mcp add family-books --url https://family.example/mcp \
  --bearer-token-env-var FAMILY_BOOK_MCP_TOKEN
```

Treat the service-token secret as deployment credentials. Do not put it in a repository or a
Gadget file.
