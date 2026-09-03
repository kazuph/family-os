# Book MCP

Family OS exposes a stateless Streamable HTTP MCP endpoint at `/mcp` so a local authoring agent can
read and update the table of contents and Markdown chapters of a Workspace Book instance.

The bundled `format.book` blueprint is only a generic starter for creating new books. Creating a
book copies that blueprint into a new workspace; the workspace then owns its executable snapshot
and its `book_files` SQLite rows. Updating the bundled blueprint therefore changes future books but
does not rewrite an existing book. Deployment-specific manuscripts, illustrations, and reader
customizations belong in their workspace, not in the bundled format blueprint.

## Who may call it

Two kinds of caller reach `/mcp`, and they differ in whose books they may name. The Worker validates
the signed `Cf-Access-Jwt-Assertion` either way, and the endpoint is disabled outright when
`CF_ACCESS_AUD` / `CF_ACCESS_ISS` are not configured.

**A signed-in person, through Access Managed OAuth.** The agent opens a browser, the human
authenticates against the same Access policy that guards the rest of Family OS, and the token that
comes back stands for that human. Their identity is the authorization: `ownerEmail` is filled in
from the assertion, and naming a different account is refused. This is the setup to prefer — there
is no long-lived shared secret on disk, and the agent reaches exactly the books its human owns.

**A service token.** The assertion carries `common_name` and no identity, so the caller has to say
which account's books it means. Use this for unattended jobs where no human is present.

Before reading or writing, the backend resolves the owning account, verifies that it owns the
requested workspace, and verifies that the workspace's default Gadget has output id `book`. The
endpoint never accepts an application-supplied email as authentication, and it cannot edit
`client.js`, `server.js`, or other executable files. The writable paths are `content/toc.json` and
Markdown files under `content/` only.

## Tools

- `book.list`: list the owner's book workspaces.
- `book.read_files`: read all book content or selected content paths.
- `book.put_files`: add or replace the table of contents and Markdown chapter files.
- `book.read_progress`: read the Gadget's persisted chapter completion map.

`ownerEmail` is optional on every tool. Omit it when signed in as a person; a service token must
supply it.

`book.put_files` persists overrides in the book Gadget's own SQLite storage. The reader fetches the
current table of contents and chapters when it opens, so edits survive reload without rebuilding the
blueprint. The bundled chapters remain the default until an instance receives an override.

## Setting up browser sign-in (Managed OAuth)

Without Managed OAuth, a non-browser client that hits an Access-protected URL gets a `302` to the
login page and no usable token. Managed OAuth turns Access into an OAuth 2.0 authorization server
for the application: the client gets a `401` with a `WWW-Authenticate` header, discovers the
endpoints from `/.well-known/oauth-authorization-server`, opens the browser for the human, and
receives a token it can refresh silently.

In the Zero Trust dashboard:

1. **Access controls → Applications**, find the application that already protects this deployment,
   and open its three-dot menu → **Edit**.
2. On the **Advanced settings** tab, turn on **Managed OAuth**.
3. Turn on **Allow localhost clients** and **Allow loopback clients**. These are toggles, and they
   are what permits the `http://localhost:<port>/callback` a local agent listens on. Do not try to
   type that address into **Allowed redirect URIs** — that field takes HTTPS URIs only, and a local
   agent does not need an entry there.
4. Set a short **access token lifetime** (5–15 minutes) with a **grant session duration** of 1–2
   weeks. The agent then refreshes in the background while Access keeps re-evaluating the policy,
   and the human signs in again only when the grant expires.

Confirm it took effect from the outside: an unauthenticated `POST` to `/mcp` should stop answering
with a `302` to the login page and start answering `401` with a `WWW-Authenticate` Bearer challenge.
The `authentication_methods` list in the protected-resource metadata is not the thing to read — it
names `cloudflared` either way.

Scoping this to `/mcp` alone by giving that path its own Access application is the tidier end state,
because a more specific path application takes precedence and can carry its own policy. It needs a
code change first: a separate application is issued its own AUD, and `verifyCfAccessJwt` currently
validates one `CF_ACCESS_AUD` for the whole Worker, so a path-scoped application would make every
`/mcp` assertion fail until the endpoint validates that second audience.

Then add the server to the client and authenticate once:

```sh
claude mcp add --transport http family-books https://family.example/mcp
# then, inside a session: /mcp -> family-books -> Authenticate (a browser tab opens)
```

## Setting up a service token instead

For unattended use, create a service token under **Access controls → Service credentials → Service
Tokens**, and give the application a policy whose action is **Service Auth** — with any other action
Access asks for an interactive login instead of honouring the token. The client then sends both
header values:

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
