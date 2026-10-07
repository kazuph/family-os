// The admin-only upgrade that moves an existing book's committed code (server.js/client.js)
// onto the current book template (src/book-code-upgrade.ts). Books carry a copy of their
// gadget code from the template they were created with, so production books from before the
// template fix need this to get it. Covered here, against real overseer/facet DOs and the real
// installed blueprint:
//
//  * a dry-run plan lists each book's workspace, vintage (generic / illustration-animation /
//    current / unknown) and what the upgrade would change;
//  * a run writes one code-only commit per book -- generic books take the new client.js, books
//    carrying the bundled illustration animations keep their animation payload spliced into
//    the new application code;
//  * book data (manuscript files, tutor messages, progress, settings) is never touched and
//    stays readable -- including chapter-scoped conversation reads the new server.js provides;
//  * a second run changes nothing; a non-admin never gets the API at all.
import { env, exports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession } from "capnweb";
import * as Y from "yjs";
import { expect, it } from "vitest";
import type { PublicApi } from "@gadgets/workshop-shared/api";
import { deploymentOutputForBlueprint, readAdminConfig } from "../src/admin-config";
import { readBlueprintContent, sanitizeBlueprintOutput } from "../src/blueprint-archive";
import { BOOK_BLUEPRINT_ID } from "../src/book-mcp";
import { readBlueprintKvRecord } from "../src/storage-schema/blueprints-kv";
import { GITDIR, makeGitObjectsFs } from "../src/git-store";
import LEGACY_SERVER from "./fixtures/legacy-book-server.js.txt";
import LEGACY_ANIM_PAYLOAD from "./fixtures/legacy-book-anim-payload.txt";
import LEGACY_ANIM_CONSTANTS from "./fixtures/legacy-book-anim-constants.txt";

// Matches the ADMINS binding in vitest.config.ts -- the value #isAdmin() compares the
// authenticated username against.
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

// The book blueprint code the deployment ships (what the upgrade installs). Decoded the same
// way loadTemplateCode does it -- from the installed blueprint record's archive.
async function templateCode() {
  await exports.AdminSettings.getByName("").ensureBundledBlueprintsInstalled();
  const kvRecord = (await readBlueprintKvRecord(env, BOOK_BLUEPRINT_ID))!;
  const bytes = (await readBlueprintContent(env, BOOK_BLUEPRINT_ID, kvRecord.metadata.version))!;
  const doc = new Y.Doc();
  Y.applyUpdateV2(doc, bytes);
  const files = new Map<string, string>();
  for (const [name, text] of doc.getMap<Y.Text>()) files.set(name, text.toString());
  return { serverJs: files.get("server.js")!, clientJs: files.get("client.js")! };
}

// The old-app marker makes the planted "old" clients differ in their application part -- the
// part an upgrade replaces -- so the test can see the replacement happened at all.
const OLD_APP_MARKER = "var OLD_BOOK_APP_MARKER = true;";

// A pre-upgrade client.js of the animation-free kind: the template's own code plus a marker
// that proves the file is not the upgrade target.
function genericOldClient(newClientJs: string): string {
  return newClientJs.replace("  // workspace-book-client.js",
      "  // workspace-book-client.js\n  " + OLD_APP_MARKER);
}

// A pre-upgrade client.js of the kind the electrical/radio/acoustics books carry: the real
// bundled animation implementations and registry plus the shared drawing constants they use,
// over the old application code (marker). The payload is a fixture cut from the actual
// pre-PR#39 client.js, registry trimmed to the two implementations kept.
function animOldClient(newClientJs: string): string {
  let withAnims = newClientJs.replace(
      "  // client/anim/index.ts\n  var registry = {};", LEGACY_ANIM_PAYLOAD.trimEnd() + "\n");
  expect(withAnims).not.toBe(newClientJs);
  const constantsSpot = '__name(canvasLoop, "canvasLoop");\n\n  // workspace-book-client.js';
  let withConstants = withAnims.replace(constantsSpot,
      '__name(canvasLoop, "canvasLoop");\n' + LEGACY_ANIM_CONSTANTS
      + "\n  // workspace-book-client.js");
  expect(withConstants).not.toBe(withAnims);
  return withConstants.replace("  // workspace-book-client.js",
      "  // workspace-book-client.js\n  " + OLD_APP_MARKER);
}

const BOOK_FILES = [
  {path: "content/toc.json", content: JSON.stringify({title: "店長の本", parts: [
    {title: "第一部", chapters: [{id: "ch1", title: "一章", file: "ch1.md"},
                                {id: "ch2", title: "二章", file: "ch2.md"}]}]})},
  {path: "content/ch1.md", content: "# 一章\n\n本文です。\n"},
  {path: "content/ch2.md", content: "# 二章\n\n続きです。\n"},
];

const MESSAGES = [
  {role: "user", content: "一章の質問", chapterId: "ch1", createdAt: 1_700_000_000_000},
  {role: "assistant", content: "一章の回答", chapterId: "ch1", createdAt: 1_700_000_005_000},
  {role: "user", content: "二章の質問", chapterId: "ch2", createdAt: 1_700_000_010_000},
];

// A book the admin owns: a workspace instantiated from the book blueprint, then -- unless
// `clientJs` is left null -- its code downgraded to the given vintage, exactly the state a
// production book from before the template fix is in. Files/progress/messages are seeded the
// way the old runtime wrote them (facet calls plus direct message rows, matching how
// askTutor's writes land).
async function seedBook(username: string, title: string, clientJs: string | null,
                       serverJs?: string) {
  const template = await templateCode();
  const kvRecord = (await readBlueprintKvRecord(env, BOOK_BLUEPRINT_ID))!;
  const codeBytes = (await readBlueprintContent(env, BOOK_BLUEPRINT_ID, kvRecord.metadata.version))!;
  const output = deploymentOutputForBlueprint(await readAdminConfig(env), BOOK_BLUEPRINT_ID,
      sanitizeBlueprintOutput(kvRecord.metadata.output));

  const user = exports.UserDurableObject.getByName(username);
  const userId = user.id.toString();
  const workspaceId = exports.OverseerDurableObject.newUniqueId().toString();
  await user.newGadget(workspaceId, title);
  const overseer = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(workspaceId));
  using _session = await overseer.open(userId, username, () => {});
  await overseer.initializeFromBlueprint(codeBytes, title, output);
  const book = (await overseer.getBookMcpWorkspaces(userId))[0];
  expect(book).toBeTruthy();
  const gadgetId = book!.gadgetId;

  // Seed the book's own SQLite the way the old runtime wrote it. A BookSeedFacet (the book's
  // Gadget class plus test helpers) takes the gadget's facet name -- hence its storage -- so
  // putBookFiles/setChapterComplete exercise the real write paths and seedMessages writes the
  // tutor rows askTutor would have (it needs a live model, so the rows go in directly).
  await runInDurableObject(overseer, async (instance) => {
    const impl = (instance as any).impl;
    const facetName = impl.gadgetFacetName(gadgetId);
    const probe = instance.ctx.facets.get(facetName, () => ({
      class: (instance.ctx.exports as any).BookSeedFacet, id: facetName}));
    await probe.putBookFiles(BOOK_FILES);
    await probe.setChapterComplete("ch1", true);
    await probe.seedMessages(MESSAGES);
    // Drop the seeding facet so the next lookup loads the book's committed gadget class.
    instance.ctx.facets.abort(facetName, new Error("test: swap in the book's real gadget"));
  });

  // The code downgrade: one commit on the blueprint head replacing server.js/client.js, the
  // same shape the upgrade writes back in.
  if (clientJs !== null || serverJs !== undefined) {
    await runInDurableObject(overseer, async (instance) => {
      const impl = (instance as any).impl;
      const gadget = impl.storage.gadgets.get(gadgetId);
      const files = await impl.gitStore.readCommitFiles(gadget.commitId);
      if (serverJs !== undefined) files.set("server.js", serverJs);
      if (clientJs !== null) files.set("client.js", clientJs);
      const commitId = await impl.gitStore.writeFilesAsCommit(files, {
        parents: [gadget.commitId],
        author: {name: "Test", email: "test@workshop.example"},
        message: "plant old code",
        timestamp: new Date(),
      });
      gadget.commitId = commitId;
      impl.storage.gadgets.put(gadget);
      impl.bumpVersion([gadget.id]);
    });
  }
  return { workspaceId, workspaceTitle: title, gadgetId, overseer, template };
}

// Everything book data lives in, serialized: a before/after fingerprint proves the upgrade
// touched nothing but the committed code files. Book state sits on the gadget facet's own
// SQLite -- the overseer's storage holds only workspace metadata -- so a BookSeedFacet takes
// the facet name over to dump the tables, then the real gadget class is let back in.
function storageFingerprint(overseer: DurableObjectStub, gadgetId: number) {
  return runInDurableObject(overseer, async (instance) => {
    const impl = (instance as any).impl;
    const facetName = impl.gadgetFacetName(gadgetId);
    try {
      instance.ctx.facets.abort(facetName, new Error("test: swap in the inspector"));
    } catch { /* nothing live under the facet name yet */ }
    const probe = instance.ctx.facets.get(facetName, () => ({
      class: (instance.ctx.exports as any).BookSeedFacet, id: facetName}));
    try {
      return JSON.stringify(await probe.inspectTables());
    } finally {
      try {
        instance.ctx.facets.abort(facetName, new Error("test: swap back to the gadget"));
      } catch { /* already gone */ }
    }
  });
}

async function facetCall<T>(overseer: DurableObjectStub, gadgetId: number,
                            run: (facet: any) => Promise<T>): Promise<T> {
  return runInDurableObject(overseer, async (instance) => {
    const impl = (instance as any).impl;
    const facet = await impl.getGadgetFacet(gadgetId);
    try {
      return await run(facet);
    } finally {
      facet[Symbol.dispose]?.();
    }
  });
}

it("plans, upgrades, and preserves both old book kinds, idempotently", async () => {
  const template = await templateCode();

  // Accounts exist before their user DOs seed workspaces.
  const api = await authenticate(ADMIN);
  const admin = await api.getAdminApi();
  expect(admin).toBeTruthy();

  // Non-admins never get the capability: AuthenticatedApi.getAdminApi() is the gate, minted
  // only when the identity is in env ADMINS.
  const nonAdmin = await authenticate("reader_not_admin");
  expect(await nonAdmin.amIAdmin()).toBe(false);
  expect(await nonAdmin.getAdminApi()).toBeNull();

  // Three admin books in three vintages: old generic code, old illustration-animation code,
  // and current code; plus one book a *different* user owns, which the admin-scoped scan must
  // never reach.
  const generic = await seedBook(ADMIN, "汎用の本", genericOldClient(template.clientJs),
      LEGACY_SERVER);
  const anim = await seedBook(ADMIN, "電気の本", animOldClient(template.clientJs), LEGACY_SERVER);
  const current = await seedBook(ADMIN, "更新済みの本", null);
  await seedBook("someoneelse", "他人の本",
      genericOldClient(template.clientJs), LEGACY_SERVER);
  const before = await Promise.all([generic, anim, current].map(
      book => storageFingerprint(book.overseer, book.gadgetId)));
  const headsBefore = await Promise.all([generic, anim, current].map(overseerHead));

  // Dry run: every admin book listed by workspace name with its vintage and change list; the
  // other user's book is absent. Nothing is written -- heads and storage are unchanged.
  const plan = await admin!.planBookCodeUpgrade();
  expect(plan.dryRun).toBe(true);
  expect(plan.bookCount).toBe(3);
  const byTitle = Object.fromEntries(plan.entries.map(e => [e.workspaceTitle, e]));
  expect(byTitle["汎用の本"]).toMatchObject({kind: "generic", status: "wouldUpgrade"});
  expect(byTitle["電気の本"]).toMatchObject({kind: "anim", status: "wouldUpgrade"});
  expect(byTitle["更新済みの本"]).toMatchObject({kind: "current", status: "unchanged"});
  expect(byTitle["他人の本"]).toBeUndefined();
  expect(byTitle["汎用の本"].changes.join("\n")).toContain("server.js");
  expect(byTitle["電気の本"].changes.join("\n")).toContain("animation payload preserved");
  // Dry run wrote nothing: heads and book data are exactly as seeded.
  expect(await storageFingerprint(generic.overseer, generic.gadgetId)).toBe(before[0]);
  expect(await Promise.all([generic, anim, current].map(overseerHead))).toEqual(headsBefore);

  // Real run: one code commit per old book; the current book writes nothing.
  const report = await admin!.upgradeBookCode();
  expect(report.dryRun).toBe(false);
  const after = Object.fromEntries(report.entries.map(e => [e.workspaceTitle, e]));
  expect(after["汎用の本"]).toMatchObject({status: "upgraded"});
  expect(after["電気の本"]).toMatchObject({status: "upgraded"});
  expect(after["更新済みの本"]).toMatchObject({status: "unchanged"});
  expect(after["他人の本"]).toBeUndefined();
  const animCommit = after["電気の本"].headCommitId;
  expect(animCommit).toBeTruthy();
  // The upgrade commit sits on the book's own history, not a fresh line.
  const parents = await commitParents(anim.overseer, animCommit!);
  expect(parents).toHaveLength(1);

  // Generic book: both files are the template's, byte for byte.
  let code = await generic.overseer.readBookCode(
      exports.UserDurableObject.getByName(ADMIN).id.toString(), generic.gadgetId);
  expect(code.serverJs).toBe(template.serverJs);
  expect(code.clientJs).toBe(template.clientJs);
  expect(code.clientJs).not.toContain(OLD_APP_MARKER);

  // Animation book: every animation implementation, the registry and the drawing constants
  // survived, spliced into the new application code (old-app marker gone, fixed canvasLoop).
  code = await anim.overseer.readBookCode(
      exports.UserDurableObject.getByName(ADMIN).id.toString(), anim.gadgetId);
  expect(code.serverJs).toBe(template.serverJs);
  expect(code.clientJs).not.toBe(template.clientJs);
  expect(code.clientJs).toContain("function prefixScale(");
  expect(code.clientJs).toContain("function waveSum(");
  expect(code.clientJs).toContain('"prefix-scale": prefixScale');
  expect(code.clientJs).toContain('"wave-sum": waveSum');
  expect(code.clientJs).toContain('var ACCENT = "#2b5797"');
  expect(code.clientJs).toContain('var ease = ');
  expect(code.clientJs).not.toContain(OLD_APP_MARKER);
  expect(code.clientJs).toContain("c.isConnected");
  // The application part is the template's: chapter-scoped state loads and no client-side
  // manuscript for askTutor.
  expect(code.clientJs).toContain("await gadget.getState(id)");
  expect(code.clientJs).toContain("gadget.askTutor({ message, chapterId })");
  expect(code.clientJs).not.toContain("chapterText");

  // Book data is byte-identical: manuscript, messages, progress and settings were never
  // written. (The gadget record's own row is workspace bookkeeping, not book data.)
  expect(await storageFingerprint(generic.overseer, generic.gadgetId)).toBe(before[0]);
  expect(await storageFingerprint(anim.overseer, anim.gadgetId)).toBe(before[1]);
  expect(await storageFingerprint(current.overseer, current.gadgetId)).toBe(before[2]);

  // The upgraded server.js actually runs: the old getState() leaked every chapter's messages;
  // the new one scopes them, and the new deleteBookFiles exists.
  expect(await facetCall(anim.overseer, anim.gadgetId,
      facet => facet.getState("ch1"))).toMatchObject({
    messages: MESSAGES.filter(m => m.chapterId === "ch1")
        .map(({role, content}) => ({role, content})),
    progress: {ch1: true},
  });
  const state2 = await facetCall(anim.overseer, anim.gadgetId,
      facet => facet.getState("ch2"));
  expect(state2.messages).toHaveLength(1);
  expect(state2.messages[0].content).toBe("二章の質問");
  expect((await facetCall(anim.overseer, anim.gadgetId,
      facet => facet.getState())).messages).toHaveLength(0);
  const filesAfterDelete = await facetCall(anim.overseer, anim.gadgetId,
      facet => facet.deleteBookFiles(["content/ch2.md"]));
  expect(filesAfterDelete["content/ch2.md"]).toBeUndefined();

  // A second run is a no-op: no commits, same heads, nothing upgraded.
  const headBefore = await overseerHead(anim);
  const second = await admin!.upgradeBookCode();
  expect(second.upgradedCount).toBe(0);
  expect(second.unchangedCount).toBe(3);
  expect(await overseerHead(anim)).toBe(headBefore);
});

// A head that moved mid-upgrade is never overwritten -- the lost update a chat merge's
// fast-forward could cause if it landed between upgradeBookCode's reads and its write. The
// interleave advances the record's commitId while the upgrade is parked on its first await,
// which is the only ordering the check-before-write has to catch.
it("fails instead of overwriting a head that moved mid-upgrade", async () => {
  const template = await templateCode();
  const book = await seedBook(ADMIN, "混んでいる本",
      genericOldClient(template.clientJs), LEGACY_SERVER);
  const ownerId = exports.UserDurableObject.getByName(ADMIN).id.toString();

  const {movedHead, upgradeError} = await runInDurableObject(book.overseer, async (instance) => {
    const impl = (instance as any).impl;
    // The interleaved commit, parented on the same head the upgrade is about to read.
    const baseHead = impl.storage.gadgets.get(book.gadgetId).commitId;
    const baseFiles = await impl.gitStore.readCommitFiles(baseHead);
    baseFiles.set("client.js", "// interleaved chat-merge edit\n" + baseFiles.get("client.js"));
    const movedHead = await impl.gitStore.writeFilesAsCommit(baseFiles, {
      parents: [baseHead],
      author: {name: "Test", email: "test@workshop.example"},
      message: "interleaved merge",
      timestamp: new Date(),
    });

    // upgradeBookCode runs synchronously until its first await, so it is guaranteed parked
    // when the merge-shaped fast-forward below lands.
    const upgrade = (instance as any).upgradeBookCode(ownerId,
        {serverJs: template.serverJs, clientJs: template.clientJs}, book.gadgetId);
    const record = impl.storage.gadgets.get(book.gadgetId);
    record.commitId = movedHead;
    impl.storage.gadgets.put(record);

    const upgradeError = await upgrade.then(() => null, (e: unknown) => String(e));
    return {movedHead, upgradeError};
  });
  expect(upgradeError).toContain("code changed");

  // The interleaved head won: no silent overwrite.
  expect(await overseerHead(book)).toBe(movedHead);

  // And nothing is corrupted: running the upgrade again parents on the interleaved head.
  const retried = await runInDurableObject(book.overseer, async (instance) =>
    (instance as any).upgradeBookCode(ownerId,
        {serverJs: template.serverJs, clientJs: template.clientJs}, book.gadgetId));
  expect(await overseerHead(book)).toBe(retried);
  expect(await commitParents(book.overseer, retried!)).toContain(movedHead);
});

async function overseerHead(book: {overseer: DurableObjectStub; gadgetId: number}) {
  return runInDurableObject(book.overseer, async (instance) =>
    (instance as any).impl.storage.gadgets.get(book.gadgetId).commitId);
}

// The parents of a commit in the workspace's object store -- read through the same plumbing
// GitStore uses, which makeGitObjectsFs() exposes for exactly this.
async function commitParents(overseer: DurableObjectStub, oid: string) {
  return runInDurableObject(overseer, async (instance) => {
    const {readCommit} = await import("isomorphic-git");
    const impl = (instance as any).impl;
    const {commit} = await readCommit({
      fs: makeGitObjectsFs(impl.storage.gitObjects), gitdir: GITDIR, oid,
    });
    return commit.parent as string[];
  });
}
