import { exports } from "cloudflare:workers";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import type { AuthenticatedApi, FamilyEntry, PublicApi } from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import {
  FAMILY_ACCESS_ADULT,
  signFamilyAccessJwt,
  signFamilyServiceJwt,
} from "./family-access-jwt.js";

async function authenticatedApi(): Promise<{
  api: RpcStub<AuthenticatedApi>; family: RpcStub<FamilyEntry>; root: RpcStub<PublicApi>;
}> {
  let response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: {
      Upgrade: "websocket", Origin: "https://workshop.invalid",
      Cookie: "CF_Authorization=login-100",
      "cf-access-jwt-assertion": await signFamilyAccessJwt(1),
    },
  }));
  if (!response.webSocket) throw new Error("Expected Access WebSocket.");
  response.webSocket.accept();
  let root = newWebSocketRpcSession<PublicApi>(response.webSocket);
  let family = await root.authenticateFromCfAccess() as RpcStub<FamilyEntry>;
  unwrapFamilyRpcResult(await family.selectAdultProfile());
  let api = unwrapFamilyRpcResult(await family.getAuthenticatedApi());
  if (!(await api.isOnboardingCompleted())) {
    await api.setOwnDisplayName("MCP Author");
    await api.completeOnboarding();
  }
  return { api, family, root };
}

async function mcp(token: string, method: string, params?: unknown, id = 1) {
  return exports.default.fetch(new Request("https://workshop.invalid/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-access-jwt-assertion": token },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  }));
}

describe("Family OS book MCP", () => {
  it("authenticates a service client and persists chapter additions in an owned book", async () => {
    let { api, family, root } = await authenticatedApi();
    using workspace = await api.newGadgetFromBlueprint("format.book", {
      AI: { type: "aiModel", modelId: "deepseek-v4-flash" },
    });
    let { id: workspaceId } = await workspace.getMetadata();
    let serviceToken = await signFamilyServiceJwt(2);

    let initialize = await mcp(serviceToken, "initialize", { protocolVersion: "2025-06-18" });
    expect(initialize.status).toBe(200);
    await expect(initialize.json()).resolves.toMatchObject({ result: { serverInfo: { name: "family-os-books" } } });

    // A person who signed in through Access Managed OAuth reaches the same endpoint. Their
    // assertion carries an email rather than a common_name, and that email *is* the authorization.
    let humanToken = await signFamilyAccessJwt(3);
    expect((await mcp(humanToken, "tools/list")).status).toBe(200);
    expect((await mcp("invalid", "tools/list")).status).toBe(403);

    // Signed in as a person, the owner is taken from the assertion, so no argument names it.
    let ownList = await mcp(humanToken, "tools/call", { name: "book.list", arguments: {} });
    await expect(ownList.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { workspaceId, title: "Workspace Book" },
    ] } } });

    // ...and pointing that session at somebody else's books is refused rather than obeyed.
    let impersonation = await mcp(humanToken, "tools/call", { name: "book.list", arguments: {
      ownerEmail: "someone-else@integration.test",
    } });
    await expect(impersonation.json()).resolves.toMatchObject({ error: {
      message: `This Access session can only reach books owned by ${FAMILY_ACCESS_ADULT.email}.`,
    } });

    // A service token has no identity of its own, so it must still say whose books it means.
    let anonymousService = await mcp(serviceToken, "tools/call", { name: "book.list", arguments: {} });
    await expect(anonymousService.json()).resolves.toMatchObject({ error: {
      message: "ownerEmail is required when calling with a service token.",
    } });
    let listed = await mcp(serviceToken, "tools/call", { name: "book.list", arguments: {
      ownerEmail: FAMILY_ACCESS_ADULT.email,
    } });
    await expect(listed.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { workspaceId, title: "Workspace Book" },
    ] } } });

    let executableWrite = await mcp(serviceToken, "tools/call", { name: "book.put_files", arguments: {
      ownerEmail: FAMILY_ACCESS_ADULT.email, workspaceId,
      files: [{ path: "content/server.js", content: "export class Gadget {}" }],
    } });
    await expect(executableWrite.json()).resolves.toMatchObject({ error: {
      message: expect.stringContaining("cannot edit content/server.js"),
    } });

    let foreignRead = await mcp(serviceToken, "tools/call", { name: "book.read_files", arguments: {
      ownerEmail: "someone-else@integration.test", workspaceId,
    } });
    await expect(foreignRead.json()).resolves.toMatchObject({ error: {
      message: "The account does not own this workspace.",
    } });

    let toc = {
      title: "MCP編集テスト書籍",
      parts: [{ part: 0, title: "導入", chapters: [
        { id: "ch00", chapter: 0, title: "既存章" },
        { id: "ch03", chapter: 3, title: "MCPで追加した章" },
      ] }],
    };
    let write = await mcp(serviceToken, "tools/call", { name: "book.put_files", arguments: {
      ownerEmail: FAMILY_ACCESS_ADULT.email, workspaceId,
      files: [
        { path: "content/toc.json", content: JSON.stringify(toc) },
        { path: "content/part1/ch03.md", content: "# MCPで追加した章\n\nローカルAIから追記した教材です。" },
      ],
    } });
    expect(write.status).toBe(200);
    await expect(write.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { path: "content/toc.json" }, { path: "content/part1/ch03.md" },
    ] } } });

    let read = await mcp(serviceToken, "tools/call", { name: "book.read_files", arguments: {
      ownerEmail: FAMILY_ACCESS_ADULT.email, workspaceId,
      paths: ["content/toc.json", "content/part1/ch03.md"],
    } });
    await expect(read.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { path: "content/part1/ch03.md", content: expect.stringContaining("ローカルAIから追記") },
      { path: "content/toc.json", content: expect.stringContaining("MCPで追加した章") },
    ] } } });

    // The same authoring loop, driven entirely by the signed-in session: no owner argument
    // anywhere, and the write is visible on the way back out.
    let humanWrite = await mcp(humanToken, "tools/call", { name: "book.put_files", arguments: {
      workspaceId,
      files: [{ path: "content/part1/ch04.md", content: "# ブラウザ認証で追記した章\n\n本人のAccessセッションから書いた。" }],
    } });
    expect(humanWrite.status).toBe(200);
    let humanRead = await mcp(humanToken, "tools/call", { name: "book.read_files", arguments: {
      workspaceId, paths: ["content/part1/ch04.md"],
    } });
    await expect(humanRead.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { path: "content/part1/ch04.md", content: expect.stringContaining("ブラウザ認証で追記") },
    ] } } });

    api[Symbol.dispose]();
    family[Symbol.dispose]();
    root[Symbol.dispose]();
  });
});
