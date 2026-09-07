import { exports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import type { AuthenticatedApi, FamilyEntry, PublicApi } from "@gadgets/workshop-shared/api";
import { unwrapFamilyRpcResult } from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import {
  FAMILY_ACCESS_ADULT,
  FAMILY_ACCESS_API_URL,
  signFamilyAccessJwt,
  signFamilyServiceJwt,
} from "./family-access-jwt.js";

async function authenticatedApi(): Promise<{
  api: RpcStub<AuthenticatedApi>; family: RpcStub<FamilyEntry>; root: RpcStub<PublicApi>;
}> {
  let response = await exports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
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
    let humanToken = await signFamilyAccessJwt(3);

    // The book is created over MCP as well: the blueprint carries the chapters, so an authoring
    // agent can go from nothing to a readable book without anyone opening the browser.
    let created = await mcp(humanToken, "tools/call", { name: "book.create", arguments: {
      title: "MCPで作った書籍",
    } });
    expect(created.status).toBe(200);
    let createdBody = await created.json() as {
      result: { structuredContent: { value: { workspaceId: string, title: string } } },
    };
    let workspaceId = createdBody.result.structuredContent.value.workspaceId;
    expect(createdBody.result.structuredContent.value.title).toBe("MCPで作った書籍");

    let serviceToken = await signFamilyServiceJwt(2);

    let initialize = await mcp(serviceToken, "initialize", { protocolVersion: "2025-06-18" });
    expect(initialize.status).toBe(200);
    await expect(initialize.json()).resolves.toMatchObject({ result: { serverInfo: { name: "family-os-books" } } });

    // A person who signed in through Access Managed OAuth reaches the same endpoint. Their
    // assertion carries an email rather than a common_name, and that email *is* the authorization.
    expect((await mcp(humanToken, "tools/list")).status).toBe(200);
    expect((await mcp("invalid", "tools/list")).status).toBe(403);

    // Signed in as a person, the owner is taken from the assertion, so no argument names it.
    let ownList = await mcp(humanToken, "tools/call", { name: "book.list", arguments: {} });
    await expect(ownList.json()).resolves.toMatchObject({ result: { structuredContent: { value: [
      { workspaceId, title: "MCPで作った書籍" },
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
      { workspaceId, title: "MCPで作った書籍" },
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

  it("addresses each book explicitly after moving into a workspace that already contains a book", async () => {
    const token = await signFamilyAccessJwt(3);
    const create = async (title: string) => {
      const response = await mcp(token, "tools/call", { name: "book.create", arguments: {title} });
      const body = await response.json() as {
        result: {structuredContent: {value: {workspaceId: string; gadgetId: number}}};
      };
      return body.result.structuredContent.value;
    };
    const first = await create("移動する本");
    const second = await create("移動先にある本");
    const session = await authenticatedApi();
    using root = session.root;
    using family = session.family;
    using api = session.api;
    family.onRpcBroken(() => {});
    api.onRpcBroken(() => {});
    const disconnected = new Promise<void>(resolve => root.onRpcBroken(() => resolve()));
    using source = await api.openGadget(first.workspaceId);
    using _target = await api.openGadget(second.workspaceId);
    using book = await source.getGadget(first.gadgetId);
    const moved = await book.moveToWorkspace(second.workspaceId);
    await disconnected;

    const listed = await mcp(token, "tools/call", {name: "book.list", arguments: {}});
    const list = await listed.json() as {
      result: {structuredContent: {value: {workspaceId: string; gadgetId: number}[]}};
    };
    expect(list.result.structuredContent.value.filter(item => item.workspaceId === second.workspaceId)
      .map(item => item.gadgetId).toSorted()).toEqual([second.gadgetId, moved.gadgetId].toSorted());
    expect(list.result.structuredContent.value.some(item => item.workspaceId === first.workspaceId)).toBe(false);

    const files = [{path: "content/move-test.md", content: "移動した本だけに保存する本文"}];
    const targetHost = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(second.workspaceId));
    const ownerId = exports.UserDurableObject.idFromName(FAMILY_ACCESS_ADULT.email).toString();
    await runInDurableObject(targetHost, async instance => {
      await expect(instance.putBookMcpFiles(ownerId, files)).rejects.toThrow("gadgetId");
    });
    const written = await mcp(token, "tools/call", {name: "book.put_files", arguments: {
      workspaceId: second.workspaceId, gadgetId: moved.gadgetId, files,
    }});
    await expect(written.json()).resolves.toMatchObject({result: {structuredContent: {value: files}}});
    for (const [gadgetId, expected] of [[moved.gadgetId, files], [second.gadgetId, []]] as const) {
      const read = await mcp(token, "tools/call", {name: "book.read_files", arguments: {
        workspaceId: second.workspaceId, gadgetId, paths: [files[0].path],
      }});
      await expect(read.json()).resolves.toMatchObject({result: {structuredContent: {value: expected}}});
    }
  });

});
