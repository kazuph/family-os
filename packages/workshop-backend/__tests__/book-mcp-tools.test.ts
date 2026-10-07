import type { JWTPayload } from "jose";
import { describe, expect, it } from "vitest";
import { handleBookMcpRequest, type BookMcpStore } from "../src/book-mcp.js";

const user: JWTPayload = { email: "BookOwner@local.test" };
const service: JWTPayload = { common_name: "svc" };

function storeWithSpy() {
  const deleted: { ownerEmail: string; workspaceId: string; paths: string[]; gadgetId?: number }[] = [];
  const store: BookMcpStore = {
    createBook: () => Promise.resolve({ workspaceId: "w", title: "t", gadgetId: 1 }),
    listBooks: () => Promise.resolve([]),
    readFiles: () => Promise.resolve([]),
    putFiles: (_owner, _workspace, files) => Promise.resolve(files),
    deleteFiles: (ownerEmail, workspaceId, paths, gadgetId) => {
      deleted.push({ ownerEmail, workspaceId, paths, gadgetId });
      return Promise.resolve(paths);
    },
    readProgress: () => Promise.resolve({}),
  };
  return { store, deleted };
}

async function call(identity: JWTPayload | null, name: string, args: Record<string, unknown>,
                    store: BookMcpStore) {
  const request = new Request("https://workshop.invalid/mcp", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name, arguments: args } }),
  });
  const response = await handleBookMcpRequest(request, identity, store);
  return { status: response.status, body: await response.json() as Record<string, any> };
}

describe("book.delete_files MCP tool", () => {
  it("is advertised by tools/list", async () => {
    const { store } = storeWithSpy();
    const request = new Request("https://workshop.invalid/mcp", {
      method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const body = await (await handleBookMcpRequest(request, user, store)).json() as any;
    expect(body.result.tools.map((tool: { name: string }) => tool.name)).toContain("book.delete_files");
  });

  it("forwards the validated paths to the owner-checked store", async () => {
    const { store, deleted } = storeWithSpy();
    const { body } = await call(user, "book.delete_files",
      { workspaceId: "w1", gadgetId: 3, paths: ["content/chapter.md"] }, store);
    expect(body.error).toBeUndefined();
    expect(body.result.structuredContent.value).toEqual(["content/chapter.md"]);
    expect(deleted).toEqual([
      { ownerEmail: "BookOwner@local.test", workspaceId: "w1", paths: ["content/chapter.md"], gadgetId: 3 },
    ]);
  });

  it("rejects non-manuscript and malformed paths before reaching the store", async () => {
    const { store, deleted } = storeWithSpy();
    for (const paths of [["server.js"], ["client.js"], ["../secret.md"], ["/etc/passwd"], ["content/a.txt"]]) {
      const { body } = await call(user, "book.delete_files",
        { workspaceId: "w1", paths }, store);
      expect(body.error.message).toMatch(/cannot edit|Invalid book file path/);
    }
    for (const paths of [[], "content/a.md", undefined]) {
      const { body } = await call(user, "book.delete_files",
        { workspaceId: "w1", paths }, store);
      expect(body.error.message).toContain("paths must be a non-empty array of strings");
    }
    expect(deleted).toEqual([]);
  });

  it("enforces the session identity boundary like the other book tools", async () => {
    const { store, deleted } = storeWithSpy();
    const otherOwner = await call(user, "book.delete_files",
      { workspaceId: "w1", ownerEmail: "Other@local.test", paths: ["content/a.md"] }, store);
    expect(otherOwner.body.error.message).toContain("only reach books owned");
    const missingOwner = await call(service, "book.delete_files",
      { workspaceId: "w1", paths: ["content/a.md"] }, store);
    expect(missingOwner.body.error.message).toContain("ownerEmail is required");
    const serviceCall = await call(service, "book.delete_files",
      { workspaceId: "w1", ownerEmail: "BookOwner@local.test", paths: ["content/a.md"] }, store);
    expect(serviceCall.body.error).toBeUndefined();
    expect(deleted).toHaveLength(1);
  });
});
