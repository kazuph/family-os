import { env, exports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession } from "capnweb";
import { collection, createTypedStorage } from "@gadgets/typed-storage";
import { expect, it } from "vitest";
import type { PublicApi } from "@gadgets/workshop-shared/api";
import { deploymentOutputForBlueprint, readAdminConfig } from "../src/admin-config";
import { readBlueprintContent, sanitizeBlueprintOutput } from "../src/blueprint-archive";
import { BOOK_BLUEPRINT_ID } from "../src/book-mcp";
import type { LegacyChildRecord } from "../src/legacy-family";
import type { ChildBookMigrationRecord } from "../src/storage-schema/admin-settings-storage";
import { makeAdminSettingsStorage } from "../src/storage-schema/admin-settings-storage";
import { readBlueprintKvRecord } from "../src/storage-schema/blueprints-kv";

const ADMIN = "admin";

async function connect() {
  const response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: {Upgrade: "websocket"},
  }));
  if (!response.webSocket) throw new Error("Expected Workshop WebSocket");
  response.webSocket.accept();
  return newWebSocketRpcSession<PublicApi>(response.webSocket);
}

async function authenticate(username: string) {
  const root = await connect();
  const password = new Uint8Array([1, 2, 3]);
  const token = await root.createAccount(username, username, password)
      ?? await root.login(username, password);
  expect(token).toBeTruthy();
  // The returned session outlives `root`: the api stub keeps the WebSocket it was minted from.
  return await root.authenticate(token!);
}

// A legacy child book: a child account that can no longer sign in, owning a workspace that
// holds one `book` gadget with files, progress and tutor history written the way the old
// runtime wrote them (book tables on the gadget's own facet storage -- see book-data.ts).
async function seedChildBook(childId: string, childName: string, seedContent = true) {
  await exports.AdminSettings.getByName("").ensureBundledBlueprintsInstalled();
  const kvRecord = (await readBlueprintKvRecord(env, BOOK_BLUEPRINT_ID))!;
  expect(kvRecord).toBeTruthy();
  const codeBytes = (await readBlueprintContent(env, BOOK_BLUEPRINT_ID, kvRecord.metadata.version))!;
  const output = deploymentOutputForBlueprint(await readAdminConfig(env), BOOK_BLUEPRINT_ID,
      sanitizeBlueprintOutput(kvRecord.metadata.output));

  // The child account exists (its User DO holds its workspace listing) but has no way to sign
  // in -- exactly the old-deployment state this migration exists for.
  const childUser = exports.UserDurableObject.getByName(childId);
  const childUserId = childUser.id.toString();
  const workspaceId = exports.OverseerDurableObject.newUniqueId().toString();
  await childUser.newGadget(workspaceId, "はなの本");
  const overseer = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(workspaceId));
  using _session = await overseer.open(childUserId, childId, () => {});
  await overseer.initializeFromBlueprint(codeBytes, "はなの本", output);
  const book = (await overseer.getBookMcpWorkspaces(childUserId))[0];
  expect(book).toBeTruthy();

  // The old runtime's writes: files and progress through its own methods, messages as direct
  // rows (askTutor needs a live model -- the seeded timestamps are fixed so the copy's fidelity
  // is checkable).
  const messages = [
    {role: "user", content: "この章の意味を教えて", chapterId: "ch1", createdAt: 1_700_000_000_000},
    {role: "assistant", content: "この章ではね……", chapterId: "ch1", createdAt: 1_700_000_005_000},
    {role: "user", content: "ありがとう、次の章は？", chapterId: "ch2", createdAt: 1_700_000_010_000},
  ];
  const files = [
    {path: "content/toc.json", content: JSON.stringify({title: "はなの本", parts: [
      {title: "一", chapters: [{id: "ch1", title: "一章", file: "ch1.md"},
                              {id: "ch2", title: "二章", file: "ch2.md"}]}]})},
    {path: "content/ch1.md", content: "# 一章\n\nむかしむかし。\n"},
    {path: "content/ch2.md", content: "# 二章\n\n続き。\n"},
  ];
  if (seedContent) {
    await runInDurableObject(overseer, async (instance, ctx) => {
      const facetName = (instance as any).impl.gadgetFacetName(book.gadgetId);
      // The legacy runtime's own code does the writes a real child book would have, on the
      // book's facet storage; aborting a name rebinds it to the next facet class used.
      const legacy = ctx.facets.get<any>(facetName,
          () => ({class: (ctx.exports as any).LegacyBookGadget, id: facetName}));
      await legacy.putBookFiles(files);
      await legacy.setChapterComplete("ch1", true);
      await legacy.setChapterComplete("ch2", false);
      ctx.facets.abort(facetName, new Error("Switching to the raw-SQL seed facet."));
      const sql = ctx.facets.get<any>(facetName,
          () => ({class: (ctx.exports as any).TestSqlFacet, id: facetName}));
      for (const [index, message] of messages.entries()) {
        await sql.exec(
            "INSERT INTO messages (id, role, content, chapter_id, created_at) " +
            "VALUES (?, ?, ?, ?, ?)",
            [index + 1, message.role, message.content, message.chapterId, message.createdAt]);
      }
      ctx.facets.abort(facetName, new Error("Seeding complete."));
    });
  }

  await runInDurableObject(exports.FamilyDurableObject.getByName(""), (_instance, ctx) => {
    createTypedStorage(ctx.storage, {
      collections: {children: collection<LegacyChildRecord>()({primaryKey: "id"})},
    }).children.put({kind: "child", id: childId, name: childName, userId: childUserId});
  });

  return {childId, childUserId, workspaceId, gadgetId: book.gadgetId, overseer, files, messages};
}

// Everything the migration could possibly disturb: the workspace's own KV plus every row in
// the book gadget's facet tables. Reading the tables means binding the facet name to the
// raw-SQL facet -- and aborting it again afterwards so a later real gadget open reloads its
// own class.
function storageFingerprint(overseer: DurableObjectStub, gadgetId: number) {
  return runInDurableObject(overseer, async (instance, ctx) => {
    const facetName = (instance as any).impl.gadgetFacetName(gadgetId);
    ctx.facets.abort(facetName, new Error("Taking the book's storage fingerprint."));
    try {
      const sql = ctx.facets.get<any>(facetName,
          () => ({class: (ctx.exports as any).TestSqlFacet, id: facetName}));
      const names = (await sql.exec(
          "SELECT name FROM sqlite_master WHERE type = 'table'") as {name: string}[])
          .map(row => row.name)
          .filter(name => !name.startsWith("sqlite_") && !name.startsWith("_cf_"));
      const tables: Record<string, unknown[]> = {};
      for (const name of names) tables[name] = await sql.exec(`SELECT * FROM ${name}`);
      return JSON.stringify({kv: [...ctx.storage.kv.list()], tables});
    } finally {
      ctx.facets.abort(facetName, new Error("Fingerprint complete."));
    }
  });
}

async function ledgerRecords() {
  return runInDurableObject(exports.AdminSettings.getByName(""), (_instance, ctx) =>
    [...makeAdminSettingsStorage(ctx.storage).childBookMigrations.list()]);
}

it("plans, copies, and proves a legacy child book under the old runtime, idempotently", async () => {
  const child = await seedChildBook("hana", "はな");
  const sourceBefore = await storageFingerprint(child.overseer, child.gadgetId);

  using api = await authenticate(ADMIN);
  using admin = (await api.getAdminApi())!;

  // A non-admin gets no capability at all.
  using otherApi = await authenticate("notadmin" + crypto.randomUUID().replaceAll("-", "").slice(0, 8));
  expect(await otherApi.getAdminApi()).toBeNull();

  // Dry run: the copy plan only. Nothing is created, nothing is written.
  const plan = await admin.planChildBookMigration();
  expect(plan.dryRun).toBe(true);
  expect(plan.childCount).toBe(1);
  expect(plan.bookCount).toBe(1);
  expect(plan.wouldCopyCount).toBe(1);
  expect(plan.migratedCount).toBe(0);
  expect(plan.skippedChildren).toEqual([]);
  const planned = plan.entries[0]!;
  expect(planned.status).toBe("wouldCopy");
  expect(planned.source).toMatchObject({
    childId: "hana", childName: "はな", workspaceId: child.workspaceId, gadgetId: child.gadgetId,
  });
  expect(planned.destination?.title).toBe("はなの本（はな）");
  expect(planned.destination?.workspaceId).toBeUndefined();
  // 3 stored rows + the built-in introduction.md the old runtime always served.
  expect(planned.fileCount).toBe(4);
  expect(planned.messageCount).toBe(3);
  expect(planned.progressCount).toBe(2);
  expect(planned.lastChapter).toBe("ch2");
  expect((await ledgerRecords()).filter(record => record.childId === "hana")).toEqual([]);
  expect((await api.listGadgets()).some(g => g.title === "はなの本（はな）")).toBe(false);

  // Actual run.
  const report = await admin.migrateChildBooks();
  expect(report.dryRun).toBe(false);
  expect(report.migratedCount).toBe(1);
  expect(report.errorCount).toBe(0);
  const migrated = report.entries[0]!;
  expect(migrated.status).toBe("migrated");
  const targetWorkspaceId = migrated.destination!.workspaceId!;
  const targetGadgetId = migrated.destination!.gadgetId!;
  expect(targetWorkspaceId).toBeTruthy();
  expect(targetGadgetId).toBe(child.gadgetId);  // both are the default gadget
  expect(migrated.fileCount).toBe(4);
  expect(migrated.messageCount).toBe(3);
  expect(migrated.lastChapter).toBe("ch2");

  // The ledger recorded the source -> destination mapping.
  const records = (await ledgerRecords()).filter(record => record.childId === "hana");
  expect(records).toHaveLength(1);
  const record = records[0]! as ChildBookMigrationRecord;
  expect(record).toMatchObject({
    sourceKey: `${child.childUserId}/${child.workspaceId}/${child.gadgetId}`,
    childId: "hana", childUserId: child.childUserId, childName: "はな",
    sourceWorkspaceId: child.workspaceId, sourceGadgetId: child.gadgetId,
    targetWorkspaceId, targetGadgetId, status: "copied",
  });

  // The book shows up in the admin's ordinary listings.
  const adminDoId = exports.UserDurableObject.getByName(ADMIN).id.toString();
  expect((await api.listGadgets()).some(g => g.id === targetWorkspaceId)).toBe(true);
  const outputs = await api.listOutputs();
  expect(outputs.outputs.some(output =>
      output.workspaceId === targetWorkspaceId && output.output?.id === "book")).toBe(true);
  const target = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(targetWorkspaceId));
  expect((await target.getBookMcpWorkspaces(adminDoId))[0]?.gadgetId).toBe(targetGadgetId);

  // Content equality through the template's own reads...
  const copiedFiles = await target.readBookMcpFiles(adminDoId, undefined, targetGadgetId);
  const copiedByPath = new Map(copiedFiles.map(file => [file.path, file.content]));
  for (const file of child.files) expect(copiedByPath.get(file.path)).toBe(file.content);
  // ...and verbatim rows, including the metadata getState() omits.
  const copied = await target.exportBookData(adminDoId, targetGadgetId);
  const source = await child.overseer.exportBookData(child.childUserId, child.gadgetId);
  expect(copied.messages).toEqual(source.messages);
  expect(copied.messages.map(m => m.id)).toEqual([1, 2, 3]);
  expect(copied.messages[0]).toMatchObject({role: "user", chapterId: "ch1", createdAt: 1_700_000_000_000});
  expect(copied.messages[2]).toMatchObject({role: "user", chapterId: "ch2"});
  expect(copied.progress).toEqual(source.progress);
  expect(copied.settings).toEqual(source.settings);
  const progressMap = Object.fromEntries(copied.progress.map(row => [row.chapterId, row.completed]));
  expect(progressMap).toEqual({ch1: 1, ch2: 0});
  expect(await target.readBookMcpProgress(adminDoId, targetGadgetId)).toEqual({ch1: true, ch2: false});
  expect(copied.files.map(f => f.path).toSorted())
      .toEqual(["content/ch1.md", "content/ch2.md", "content/introduction.md", "content/toc.json"]);

  // The old runtime itself reads the copy: run the legacy Gadget code as the workspace facet.
  const legacy = await runInDurableObject(target, async (instance, ctx) => {
    const name = (instance as any).impl.gadgetFacetName(targetGadgetId);
    ctx.facets.abort(name, new Error("Switching to the legacy runtime."));
    try {
      const facet = ctx.facets.get<any>(name,
          () => ({class: (ctx.exports as any).LegacyBookGadget, id: name}));
      return {files: await facet.getBookFiles(), state: await facet.getState()};
    } finally {
      ctx.facets.abort(name, new Error("Legacy read complete."));
    }
  });
  expect(legacy.files["content/ch1.md"]).toBe("# 一章\n\nむかしむかし。\n");
  expect(legacy.state.messages).toEqual([
    {role: "user", content: "この章の意味を教えて"},
    {role: "assistant", content: "この章ではね……"},
    {role: "user", content: "ありがとう、次の章は？"},
  ]);
  expect(legacy.state.progress).toEqual({ch1: true, ch2: false});
  expect(legacy.state.lastChapter).toBe("ch2");

  // The source is untouched by all of this.
  expect(await storageFingerprint(child.overseer, child.gadgetId)).toBe(sourceBefore);

  // Second run: no duplicates, the ledger maps it to the existing copy.
  const gadgetCount = (await api.listGadgets()).length;
  const rerun = await admin.migrateChildBooks();
  expect(rerun.migratedCount).toBe(0);
  expect(rerun.alreadyMigratedCount).toBe(1);
  expect(rerun.entries.find(entry => entry.source.childId === "hana")).toMatchObject({
    status: "alreadyMigrated",
    destination: {workspaceId: targetWorkspaceId, gadgetId: targetGadgetId},
  });
  expect((await api.listGadgets()).length).toBe(gadgetCount);
  expect((await ledgerRecords()).filter(record => record.childId === "hana")).toHaveLength(1);

  // A dry run after migration reports the same mapping.
  const afterPlan = await admin.planChildBookMigration();
  const afterEntry = afterPlan.entries.find(entry => entry.source.childId === "hana")!;
  expect(afterEntry.status).toBe("alreadyMigrated");
  expect(afterEntry.destination?.workspaceId).toBe(targetWorkspaceId);
  expect(await storageFingerprint(child.overseer, child.gadgetId)).toBe(sourceBefore);
});

it("copies a book that was never opened (defaults only)", async () => {
  // A book whose facet never ran has no tables at all; export reports the built-in defaults.
  await seedChildBook("sora", "そら", false);
  using api = await authenticate(ADMIN);
  using admin = (await api.getAdminApi())!;
  const report = await admin.migrateChildBooks();
  const entry = report.entries.find(candidate => candidate.source.childId === "sora")!;
  expect(entry.status).toBe("migrated");
  expect(entry.fileCount).toBe(2);          // the two built-in defaults, materialized
  expect(entry.messageCount).toBe(0);
  expect(entry.progressCount).toBe(0);
  const target = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(entry.destination!.workspaceId!));
  const adminDoId = exports.UserDurableObject.getByName(ADMIN).id.toString();
  const copied = await target.exportBookData(adminDoId, entry.destination!.gadgetId!);
  expect(copied.files.map(f => f.path).toSorted())
      .toEqual(["content/introduction.md", "content/toc.json"]);
});
