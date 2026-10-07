import { exports } from "cloudflare:workers";
import { abortAllDurableObjects, runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession } from "capnweb";
import type { PublicApi } from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import { commitIdentityForAuthor } from "../src/git-store";

async function connect() {
  const response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: { Upgrade: "websocket" },
  }));
  if (!response.webSocket) throw new Error("Expected WebSocket.");
  response.webSocket.accept();
  return newWebSocketRpcSession<PublicApi>(response.webSocket);
}

describe("book storage through standard Workshop authentication", () => {
  it("persists manuscript in real gadget SQLite and denies a different owner", async () => {
    using root = await connect();
    const username = "bookowner" + crypto.randomUUID().replaceAll("-", "");
    const token = await root.createAccount(username, "Book author", new Uint8Array([1, 2, 3]));
    if (!token) throw new Error("Account creation failed.");
    using api = await root.authenticate(token);
    await exports.AdminSettings.getByName("").ensureBundledBlueprintsInstalled();
    let workspaceId: string;
    {
      using workspace = await api.newGadgetFromBlueprint("format.book", {});
      workspaceId = (await workspace.getMetadata()).id;
    }
    const owner = exports.UserDurableObject.getByName(username);
    const ownerId = owner.id.toString();
    const ns = exports.OverseerDurableObject;
    let workspace = ns.get(ns.idFromString(workspaceId));
    const book = await workspace.getBookMcpWorkspace(ownerId);
    expect(book?.workspaceId).toBe(workspaceId);
    const initial = await workspace.readBookMcpFiles(ownerId, undefined, book!.gadgetId);
    expect(initial.map(file=>file.path).toSorted()).toEqual(['content/introduction.md','content/toc.json']);
    const files = [
      {path: "content/toc.json", content: JSON.stringify({title: "Test book", parts: [{title: "Part", chapters: [{id: "chapter", title: "Chapter", file: "chapter.md"}]}]})},
      {path: "content/chapter.md", content: "# Chapter\n\nPersisted manuscript."},
    ];
    await expect(workspace.putBookMcpFiles(ownerId, files, book!.gadgetId)).resolves.toEqual(files);
    await expect(workspace.readBookMcpFiles(ownerId, files.map(file => file.path), book!.gadgetId)).resolves.toEqual(files.toSorted((a, b) => a.path.localeCompare(b.path)));
    expect(await workspace.readBookMcpFiles(ownerId, undefined, book!.gadgetId)).toEqual(files.toSorted((a,b)=>a.path.localeCompare(b.path)));
    const strangerId = exports.UserDurableObject.getByName("different-owner").id.toString();
    await expect(workspace.getBookMcpWorkspaces(strangerId)).resolves.toEqual([]);
    // Catch expected failures inside the DO invocation: the pool reports a rejected native RPC
    // capability twice, while the real HTTP MCP handler catches these same failures in-process.
    const denied = await runInDurableObject(workspace, async instance => {
      let ownershipError: string | undefined;
      let executableError: string | undefined;
      let deleteOwnershipError: string | undefined;
      let deleteExecutableError: string | undefined;
      try { await instance.readBookMcpFiles(strangerId); } catch (error) { ownershipError = String(error); }
      try { await instance.putBookMcpFiles(ownerId, [{path: "server.js", content: "export class Gadget {}"}]); } catch (error) { executableError = String(error); }
      try { await instance.deleteBookMcpFiles(strangerId, ["content/chapter.md"]); } catch (error) { deleteOwnershipError = String(error); }
      try { await instance.deleteBookMcpFiles(ownerId, ["server.js"], book!.gadgetId); } catch (error) { deleteExecutableError = String(error); }
      return {ownershipError, executableError, deleteOwnershipError, deleteExecutableError};
    });
    expect(denied.ownershipError).toContain("does not own");
    expect(denied.executableError).toContain("cannot edit");
    expect(denied.deleteOwnershipError).toContain("does not own");
    expect(denied.deleteExecutableError).toContain("cannot edit");
    // A workspace with two book gadgets requires an explicit gadgetId for deletion (the
    // same selection rule the MCP tool documents).
    const multipleBooksError = await runInDurableObject(workspace, async (instance: any) => {
      const impl = instance.impl;
      const first = impl.getGadgetRecord(book!.gadgetId);
      const stored = await impl.readGadgetFiles(book!.gadgetId);
      const commit = await impl.gitStore.writeFilesAsCommit(stored, {
        parents: [],
        author: commitIdentityForAuthor({type: "user", id: ownerId, name: "Book author"}),
        message: "Second book for MCP selection",
        timestamp: new Date(),
      });
      impl.createGadget("Second book", "SECOND_BOOK", undefined, first.output, commit);
      try { await instance.deleteBookMcpFiles(ownerId, ["content/chapter.md"]); } catch (error) { return String(error); }
    });
    expect(multipleBooksError).toContain("multiple books");
    // A book whose server.js predates deleteBookFiles reports a clear update-required
    // error rather than a raw RPC failure.
    const oldVersionError = await runInDurableObject(workspace, async (instance: any) => {
      const impl = instance.impl;
      const first = impl.getGadgetRecord(book!.gadgetId);
      const stored = await impl.readGadgetFiles(book!.gadgetId);
      const oldFiles = new Map(stored);
      oldFiles.set("server.js", oldFiles.get("server.js")!.replace(/  deleteBookFiles[\s\S]*?\n  \}\n\n/, ""));
      if (oldFiles.get("server.js")!.includes("deleteBookFiles")) {
        throw new Error("test setup failed to strip deleteBookFiles");
      }
      const commit = await impl.gitStore.writeFilesAsCommit(oldFiles, {
        parents: [],
        author: commitIdentityForAuthor({type: "user", id: ownerId, name: "Book author"}),
        message: "Old-revision book for MCP deletion",
        timestamp: new Date(),
      });
      const oldBook = impl.createGadget("Old book", "OLD_BOOK", undefined, first.output, commit);
      try { await instance.deleteBookMcpFiles(ownerId, ["content/chapter.md"], oldBook.id); }
      catch (error) { return String(error); }
    });
    expect(oldVersionError).toContain("predates deleteBookFiles");
    // The owner can drop a manuscript chapter dropped from the toc; stored rows for other
    // files and the deleted chapter's messages are not touched by deleting its file.
    await expect(workspace.deleteBookMcpFiles(ownerId, ["content/chapter.md"], book!.gadgetId))
      .resolves.toEqual(["content/chapter.md"]);
    await expect(workspace.readBookMcpFiles(ownerId, undefined, book!.gadgetId))
      .resolves.toEqual([files[0]]);
    await workspace.putBookMcpFiles(ownerId, [files[1]!], book!.gadgetId);
    await abortAllDurableObjects();
    workspace = ns.get(ns.idFromString(workspaceId));
    await expect(workspace.readBookMcpFiles(ownerId, ["content/chapter.md"], book!.gadgetId)).resolves.toEqual([files[1]]);
  });
});
