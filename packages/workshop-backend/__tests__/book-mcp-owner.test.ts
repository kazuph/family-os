import { describe, expect, it } from "vitest";
import type { JWTPayload } from "jose";
import { handleBookMcpRequest, type BookMcpFile, type BookMcpStore } from "../src/book-mcp.js";

// A real store, not a stand-in for one: it holds books keyed by the exact owner string it is
// handed. That is the point of these tests -- an account's Durable Object is addressed by name,
// so whether "Kazu@Example.com" and "kazu@example.com" reach the same books is decided by the
// string the endpoint passes down, and nothing downstream folds the case for it.
class OwnerKeyedStore implements BookMcpStore {
  readonly seen: string[] = [];
  constructor(private readonly books: Map<string, BookMcpFile[]>) {}

  async listBooks(ownerEmail: string) {
    this.seen.push(ownerEmail);
    return this.books.has(ownerEmail)
      ? [{ workspaceId: `ws-for-${ownerEmail}`, title: "Workspace Book", gadgetId: 1 }]
      : [];
  }

  async readFiles(ownerEmail: string, _workspaceId: string, _paths?: string[]) {
    this.seen.push(ownerEmail);
    let files = this.books.get(ownerEmail);
    if (!files) throw new Error("The account does not own this workspace.");
    return files;
  }

  async putFiles(ownerEmail: string, _workspaceId: string, files: BookMcpFile[]) {
    this.seen.push(ownerEmail);
    return files;
  }

  async readProgress(ownerEmail: string) {
    this.seen.push(ownerEmail);
    return {};
  }
}

const MIXED_CASE = "Kazu.Homma@Example.com";

function storeOwnedBy(owner: string): OwnerKeyedStore {
  return new OwnerKeyedStore(new Map([[owner, [{ path: "content/toc.json", content: "{}" }]]]));
}

function call(payload: JWTPayload | null, store: BookMcpStore, name: string, args: unknown) {
  return handleBookMcpRequest(
    new Request("https://workshop.invalid/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    }),
    payload,
    store);
}

const person = (email: string): JWTPayload => ({ sub: "person", email });
const serviceToken: JWTPayload = { sub: "", common_name: "family-mcp.example" };

describe("book MCP owner resolution", () => {
  it("addresses the account by the address the identity provider actually sent", async () => {
    // The signed-in person's provider returns a mixed-case address, and their books live under it.
    let store = storeOwnedBy(MIXED_CASE);
    let response = await call(person(MIXED_CASE), store, "book.list", {});

    expect(store.seen).toEqual([MIXED_CASE]);
    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { workspaceId: `ws-for-${MIXED_CASE}` },
    ] } } });
  });

  it("lets that person name themselves in any capitalisation", async () => {
    let store = storeOwnedBy(MIXED_CASE);
    let response = await call(
      person(MIXED_CASE), store, "book.read_files",
      { ownerEmail: MIXED_CASE.toLowerCase(), workspaceId: "ws" });

    // Matching is case-insensitive, but the assertion's own spelling is what resolves the account.
    expect(store.seen).toEqual([MIXED_CASE]);
    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { path: "content/toc.json" },
    ] } } });
  });

  it("refuses to point a signed-in session at somebody else", async () => {
    let store = storeOwnedBy(MIXED_CASE);
    let response = await call(
      person(MIXED_CASE), store, "book.list", { ownerEmail: "someone-else@example.com" });

    expect(store.seen).toEqual([]);
    await expect(response.json()).resolves.toMatchObject({ error: {
      message: `This Access session can only reach books owned by ${MIXED_CASE}.`,
    } });
  });

  it("passes a service token's chosen address through unchanged", async () => {
    let store = storeOwnedBy(MIXED_CASE);
    let response = await call(serviceToken, store, "book.list", { ownerEmail: MIXED_CASE });

    expect(store.seen).toEqual([MIXED_CASE]);
    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { workspaceId: `ws-for-${MIXED_CASE}` },
    ] } } });
  });

  it("makes a service token say whose books it means", async () => {
    let store = storeOwnedBy(MIXED_CASE);
    await expect(call(serviceToken, store, "book.list", {}).then(r => r.json())).resolves
      .toMatchObject({ error: { message: "ownerEmail is required when calling with a service token." } });
    expect(store.seen).toEqual([]);
  });

  it("turns away a caller Access did not vouch for", async () => {
    let store = storeOwnedBy(MIXED_CASE);
    expect((await call(null, store, "book.list", {})).status).toBe(403);
    expect((await call({ sub: "nobody" }, store, "book.list", {})).status).toBe(403);
    expect(store.seen).toEqual([]);
  });
});
