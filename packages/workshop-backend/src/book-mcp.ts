import type { JWTPayload } from "jose";

const JSON_HEADERS = { "content-type": "application/json" };

export type BookMcpFile = { path: string; content: string };

export type BookMcpWorkspace = {
  workspaceId: string;
  title: string;
  gadgetId: number;
};

export interface BookMcpStore {
  listBooks(ownerEmail: string): Promise<BookMcpWorkspace[]>;
  readFiles(ownerEmail: string, workspaceId: string, paths?: string[]): Promise<BookMcpFile[]>;
  putFiles(ownerEmail: string, workspaceId: string, files: BookMcpFile[]): Promise<BookMcpFile[]>;
  readProgress(ownerEmail: string, workspaceId: string): Promise<unknown>;
}

type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number; method: string; params?: unknown };

// Two kinds of caller reach this endpoint, and they differ in whose books they may name.
//
// A service token is not a person: the Access assertion carries `common_name` and no identity, so
// the caller has to say which account's books it means, and nothing here can narrow that down.
//
// A signed-in person arrives through Access Managed OAuth -- the local AI opens a browser, the
// human authenticates against the same policy that guards the rest of Family OS, and the token
// that comes back stands for that human. Their identity is the authorization, so `ownerEmail` is
// filled in from the assertion and may not be pointed at somebody else.
type BookMcpIdentity = { kind: "service" } | { kind: "user"; email: string };

function identify(accessPayload: JWTPayload | null): BookMcpIdentity | null {
  if (!accessPayload) return null;
  if (typeof accessPayload.email === "string" && accessPayload.email.trim()) {
    // Verbatim, not lowercased. An account's User Durable Object is named by whatever the identity
    // provider put in the assertion the first time that person signed in (see
    // authenticateFromCfAccess in server.ts), so folding the case here would address a different,
    // empty object for anyone whose provider returns a mixed-case address -- their books would
    // simply not be there.
    return { kind: "user", email: accessPayload.email };
  }
  if (typeof accessPayload.common_name === "string" && accessPayload.common_name.trim()) {
    return { kind: "service" };
  }
  return null;
}

function resolveOwnerEmail(identity: BookMcpIdentity, args: Record<string, unknown>): string {
  let requested = args.ownerEmail;
  if (requested !== undefined && (typeof requested !== "string" || !requested.trim())) {
    throw new Error("ownerEmail must be a non-empty string.");
  }
  if (identity.kind === "service") {
    if (!requested) throw new Error("ownerEmail is required when calling with a service token.");
    return requested;
  }
  // Comparing identities is case-insensitive -- nobody should have to reproduce their provider's
  // capitalisation to name themselves -- but the address that goes on to resolve the account is
  // always the one from the assertion.
  if (requested && requested.toLowerCase() !== identity.email.toLowerCase()) {
    throw new Error(`This Access session can only reach books owned by ${identity.email}.`);
  }
  return identity.email;
}

const tools = [
  {
    name: "book.list",
    description: "List book workspaces owned by a Family OS account.",
    inputSchema: ownerSchema(),
  },
  {
    name: "book.read_files",
    description: "Read all editable book files, or selected paths, from an owned book workspace.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["workspaceId"],
      properties: {
        ownerEmail: ownerEmailProperty(), workspaceId: { type: "string" },
        paths: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "book.put_files",
    description: "Add or replace the table of contents and chapter files in an owned book workspace.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["workspaceId", "files"],
      properties: {
        ownerEmail: ownerEmailProperty(), workspaceId: { type: "string" },
        files: {
          type: "array", minItems: 1,
          items: {
            type: "object", additionalProperties: false, required: ["path", "content"],
            properties: { path: { type: "string" }, content: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "book.read_progress",
    description: "Read persisted chapter progress from an owned book workspace.",
    inputSchema: workspaceSchema(),
  },
] as const;

function ownerEmailProperty() {
  return {
    type: "string",
    description: "Whose books to work on. Omit it when signed in as a person -- it is then taken "
      + "from the Access session, and naming anyone else is refused. A service token has no "
      + "identity of its own and must supply it.",
  } as const;
}

function ownerSchema() {
  return {
    type: "object", additionalProperties: false, required: [],
    properties: { ownerEmail: ownerEmailProperty() },
  } as const;
}

function workspaceSchema() {
  return {
    type: "object", additionalProperties: false, required: ["workspaceId"],
    properties: { ownerEmail: ownerEmailProperty(), workspaceId: { type: "string" } },
  } as const;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, key: string): string {
  let field = value[key];
  if (typeof field !== "string" || !field.trim()) throw new Error(`${key} must be a non-empty string.`);
  return field;
}

export function validateBookFilePath(path: string): void {
  if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    throw new Error(`Invalid book file path: ${path}`);
  }
  if (!(path === "content/toc.json" || (path.startsWith("content/") && path.endsWith(".md")))) {
    throw new Error(`Book MCP cannot edit ${path}.`);
  }
}

function parseFiles(value: unknown): BookMcpFile[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("files must be a non-empty array.");
  return value.map((entry) => {
    let item = object(entry);
    let path = stringField(item, "path");
    let content = item.content;
    if (typeof content !== "string") throw new Error("content must be a string.");
    validateBookFilePath(path);
    return { path, content };
  });
}

function result(id: JsonRpcRequest["id"], value: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id, result: value }, { headers: JSON_HEADERS });
}

function error(id: JsonRpcRequest["id"], code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { headers: JSON_HEADERS });
}

function toolResult(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: { value } };
}

export async function handleBookMcpRequest(
    request: Request, accessPayload: JWTPayload | null, store: BookMcpStore): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  let identity = identify(accessPayload);
  if (!identity) {
    return new Response(
      "A Cloudflare Access session is required: either sign in through Managed OAuth or "
        + "present a service token.",
      { status: 403 });
  }

  let rpc: JsonRpcRequest;
  try {
    let value: unknown = await request.json();
    let input = object(value);
    if (input.jsonrpc !== "2.0" || typeof input.method !== "string") throw new Error("Invalid JSON-RPC request.");
    rpc = input as JsonRpcRequest;
  } catch (err) {
    return error(undefined, -32700, err instanceof Error ? err.message : "Invalid request.");
  }

  try {
    if (rpc.method === "initialize") {
      return result(rpc.id, {
        protocolVersion: "2025-06-18", capabilities: { tools: {} },
        serverInfo: { name: "family-os-books", version: "1" },
      });
    }
    if (rpc.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (rpc.method === "tools/list") return result(rpc.id, { tools });
    if (rpc.method !== "tools/call") return error(rpc.id, -32601, "Method not found.");

    let params = object(rpc.params);
    let name = stringField(params, "name");
    let args = object(params.arguments);
    let ownerEmail = resolveOwnerEmail(identity, args);
    let value: unknown;
    if (name === "book.list") {
      value = await store.listBooks(ownerEmail);
    } else {
      let workspaceId = stringField(args, "workspaceId");
      if (name === "book.read_files") {
        let paths = args.paths;
        if (paths !== undefined && (!Array.isArray(paths) || paths.some(path => typeof path !== "string"))) {
          throw new Error("paths must be an array of strings.");
        }
        for (let path of paths ?? []) validateBookFilePath(path as string);
        value = await store.readFiles(ownerEmail, workspaceId, paths as string[] | undefined);
      } else if (name === "book.put_files") {
        value = await store.putFiles(ownerEmail, workspaceId, parseFiles(args.files));
      } else if (name === "book.read_progress") {
        value = await store.readProgress(ownerEmail, workspaceId);
      } else {
        return error(rpc.id, -32602, `Unknown tool: ${name}`);
      }
    }
    return result(rpc.id, toolResult(value));
  } catch (err) {
    return error(rpc.id, -32602, err instanceof Error ? err.message : "Tool call failed.");
  }
}
