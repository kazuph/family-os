// Exercises the git-storage migration through its *real* trigger: the OverseerImpl constructor
// noticing `version` 1 and running migrateToGitStorage under blockConcurrencyWhile, over real
// SQLite DO storage -- complementing git-migration.test.ts's direct migrateCodeLogToGit calls on
// mock storage. Each test seeds a legacy (version-1) workspace into a fresh DO, aborts every DO
// so the next touch re-runs the constructor, then asserts the migrated snapshots against an
// independent replay of the seeded Yjs update log.
//
// This lives in __tests__/ (the unit workerd config), not __integration__/: the TEST_OVERSEER
// DO binding exists only in vitest.config.ts, and no public API path can create a legacy
// workspace anymore (new workspaces are born at version 4), so seeding must reach into
// impl.storage. The public DO surface (open() etc.) is deliberately never called:
// #initializeNewWorkspace would stamp version 4 and shadow the scenario.
//
// The version-3 action-index backfill and the version-4 workpiece-type stamp ride the same
// constructor trigger, so their tests live here too.

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { applyCodeChange } from "@gadgets/workshop-shared/code-change";
import type { CodeContent } from "@gadgets/workshop-shared/code-change";
import type { StoredChatMessage } from "../src/storage-schema/overseer-storage";
import { env } from "cloudflare:workers";
import { abortAllDurableObjects, runInDurableObject } from "cloudflare:test";
import type { OverseerDurableObject } from "../src/overseer.js";
import { HISTORY_COMMIT_GAP_MS, migrateCodeLogToGit } from "../src/storage-schema/overseer-git-migration";
import { OVERSEER_STORAGE_VERSION } from "../src/storage-schema/overseer-migrations";
import {
  LegacyWorkspace, MINUTE, T0, USER, captureEdit, expectHeadsMatchDoc, readDocFiles, setFile,
} from "./legacy-workspace";
import { makePreIndexActionStorage, putAction } from "./fixtures.js";

declare module "cloudflare:workers" {
  interface ProvidedEnv {
    TEST_OVERSEER: DurableObjectNamespace<OverseerDurableObject>;
  }
}

// With no ownerId seeded, ownerCommitIdentity() resolves to this documented fallback without
// contacting any user DO.
const FALLBACK_OWNER = { name: "Workspace owner", email: "owner@localhost" };

// Mints a fresh stub per call: after abortAllDurableObjects() the previous stub is permanently
// poisoned, and only a fresh stub re-constructs the object.
async function inOverseer(name: string, fn: (impl: any) => Promise<void>): Promise<void> {
  let stub = env.TEST_OVERSEER.getByName(name);
  await runInDurableObject(stub, async (instance: OverseerDurableObject) => {
    await fn((instance as unknown as { impl: any }).impl);
  });
}

// Seeds a legacy workspace into the named DO's real storage and arms the constructor trigger.
// The returned LegacyWorkspace lives in test scope, so its in-memory update log (docAt) survives
// the DO abort and serves as the post-migration oracle.
async function seedLegacyWorkspace(
    name: string, build: (ws: LegacyWorkspace, impl: any) => void): Promise<LegacyWorkspace> {
  let ws!: LegacyWorkspace;
  await inOverseer(name, async impl => {
    // Pins the seeding recipe's precondition: a fresh TEST_OVERSEER DO writes *nothing* at
    // construction (migrateToMultiGadget returns immediately at version 0 with no ownerId). If a
    // future constructor change starts initializing fresh DOs, this fails loudly and the
    // recipe needs rethinking.
    expect(impl.storage.version.get()).toBe(0);
    ws = new LegacyWorkspace(impl.storage);
    build(ws, impl);
    // ownerId is deliberately never seeded: it keeps migrateToMultiGadget inert on re-entry and
    // makes ownerCommitIdentity() return its fallback instead of calling a user DO.
    //
    // Last write: arm the constructor's version-1 git-storage migration trigger.
    impl.storage.version.put(1);
  });
  return ws;
}

describe("git-storage migration via the Overseer constructor", () => {
  it.each(["snapshot", "partitioned snapshot"])(
      "converts pruned chat and blueprint anchors from a complete %s without losing history",
      async snapshotKind => {
    const name = `git-migration-pruned-${snapshotKind}`;
    let originalMessages: unknown[] = [];
    let sourceRows: unknown;
    let retainedFiles: Map<string, string>;
    await seedLegacyWorkspace(name, (ws, impl) => {
      ws.addGadget(1, "APP");
      impl.storage.defaultGadgetId.put(1);
      ws.edit(T0 + MINUTE, doc => setFile(doc, "", "app.js", "accepted\n")); // v2
      const chatDoc = ws.docAt(2);
      ws.addChat(2);
      ws.addMessage(2, USER, {type: "message", text: "preserve question"});
      ws.addMessage(2, USER, {
        type: "changes", observedCodeVersion: 2,
        update: captureEdit(chatDoc, doc => doc.getMap<Y.Text>("").get("app.js")!
            .insert("accepted\n".length, "proposal\n")),
      });
      ws.addMessage(2, USER, {type: "message", text: "preserve response"});
      ws.addDraft(2, captureEdit(chatDoc, doc => doc.getMap<Y.Text>("").get("app.js")!
          .insert("accepted\nproposal\n".length, "draft\n")));
      // Explicit zero anchors are pruned too, unlike version 0 in a complete log.
      ws.addChat(3);
      ws.addMessage(3, USER, {type: "changes", observedCodeVersion: 0});
      ws.edit(T0 + 2 * MINUTE, doc => setFile(doc, "", "retained.js", "retained\n")); // v3
      const retainedDoc = ws.docAt(3);
      retainedFiles = readDocFiles(retainedDoc, "");
      const update = Y.encodeStateAsUpdateV2(retainedDoc);
      const timestamp = new Date(T0 + 2 * MINUTE);
      if (snapshotKind === "snapshot") {
        impl.storage.snapshots.put({version: 3, timestamp, update});
      } else {
        const boundary = Math.floor(update.length / 2);
        for (const [index, part] of [update.slice(0, boundary), update.slice(boundary)].entries()) {
          impl.storage.snapshotParts.put({key: `retained-${index}`, version: 3,
            timestamp, index, partCount: 2, update: part});
        }
      }
      ws.edit(T0 + 3 * MINUTE, doc => setFile(doc, "", "tip.js", "tip\n")); // v4
      for (const row of impl.storage.code.list()) {
        if (row.version <= 3) impl.storage.code.deleteRecord(row);
      }
      const metadata = {title: "Blueprint", description: "", author: USER,
        created: new Date(T0), version: 1, lastUpdated: new Date(T0), bindings: {}};
      for (const version of [0, 2]) {
        impl.storage.blueprints.put({id: `pruned-${version}`, metadata, codeVersion: version});
      }
      originalMessages = [...impl.storage.chats.list()];
      sourceRows = {code: [...impl.storage.code.list()], snapshots: [...impl.storage.snapshots.list()],
        parts: [...impl.storage.snapshotParts.list()]};
    });
    await abortAllDurableObjects();
    let convertedRows: unknown;
    let gitRows: unknown;
    await inOverseer(name, async impl => {
      expect(impl.storage.version.get()).toBe(OVERSEER_STORAGE_VERSION);
      const boundaries = [...impl.storage.chats.list()].filter((msg: StoredChatMessage) =>
        msg.type === "changes" && msg.conversionBoundary);
      expect(boundaries).toHaveLength(2);
      expect([...impl.storage.chats.list()].filter((msg: any) => !msg.conversionBoundary))
          .toEqual(originalMessages);
      expect([...impl.storage.chatDraftUpdates.list()]).toEqual([]);
      const boundary = boundaries.find((msg: StoredChatMessage) => msg.chatId === 2)!;
      expect(await impl.gitStore.readCommitFiles(boundary.pins![0].baseCommit)).toEqual(retainedFiles!);
      const base: CodeContent = new Map([[1, retainedFiles!]]);
      const content = applyCodeChange(base, boundary.change);
      expect(content.get(1)).toEqual(new Map([
        ["app.js", "accepted\nproposal\ndraft\n"], ["retained.js", "retained\n"],
      ]));
      expect(boundaries.find((msg: StoredChatMessage) => msg.chatId === 3)!.change).toBeUndefined();
      for (const version of [0, 2]) {
        const blueprint = impl.storage.blueprints.get(`pruned-${version}`)!;
        expect(blueprint.codeVersion).toBeUndefined();
        expect(await impl.gitStore.readCommitFiles(blueprint.commitId)).toEqual(retainedFiles!);
      }
      expect({code: [...impl.storage.code.list()], snapshots: [...impl.storage.snapshots.list()],
        parts: [...impl.storage.snapshotParts.list()]}).toEqual(sourceRows);
      convertedRows = [...impl.storage.chats.list()];
      gitRows = [...impl.storage.gitObjects.list()];
    });
    await abortAllDurableObjects();
    await inOverseer(name, async impl => {
      expect(impl.storage.version.get()).toBe(OVERSEER_STORAGE_VERSION);
      expect([...impl.storage.chats.list()]).toEqual(convertedRows);
      expect([...impl.storage.gitObjects.list()]).toEqual(gitRows);
    });
  });

  it("refuses an incomplete retained snapshot without modifying real SQLite source rows", async () => {
    await inOverseer("git-migration-incomplete-snapshot", async impl => {
      const ws = new LegacyWorkspace(impl.storage);
      ws.addGadget(1, "APP");
      ws.edit(T0 + MINUTE, doc => setFile(doc, "", "app.js", "accepted\n"));
      ws.storage.code.deleteRecord(ws.storage.code.get(1)!);
      const update = Y.encodeStateAsUpdateV2(ws.docAt(2));
      ws.storage.snapshotParts.put({key: "incomplete", version: 2, timestamp: new Date(T0),
        index: 0, partCount: 2, update: update.slice(0, Math.floor(update.length / 2))});
      const before = [...impl.ctx.storage.kv.list()];
      await expect(migrateCodeLogToGit(ws.host(1))).rejects.toThrow(/incomplete or inconsistent parts/);
      expect([...impl.ctx.storage.kv.list()]).toEqual(before);
    });
  });

  it("migrates a single-gadget workspace, preserving content across the batching gap",
      async () => {
    let ws = await seedLegacyWorkspace("git-migration-single", (ws, impl) => {
      ws.addGadget(1, "APP");
      impl.storage.defaultGadgetId.put(1);  // the default gadget's legacy files root is ""

      // A burst of edits (within a minute of the constructor's empty v1, so that v1 doesn't
      // become its own commit point), then non-code versions, then an edit across the one-hour
      // batching boundary.
      ws.edit(T0 + 1 * MINUTE, doc => setFile(doc, "", "app.js", "hello\n"));            // v2
      ws.edit(T0 + 2 * MINUTE, doc => setFile(doc, "", "util.js", "util one\n"));        // v3
      ws.skipVersions(2);                                                                // v4-v5
      ws.edit(T0 + 2 * MINUTE + HISTORY_COMMIT_GAP_MS, doc => {
        setFile(doc, "", "app.js", "hello\nworld\n");
        setFile(doc, "", "util.js", "util two\n");
      });                                                                                // v6

      // A pending action written through an index-less view of the same storage, simulating a
      // record that predates the pendingByGatekeeper declaration. The version-3 step (chained
      // after the git migration in the same blockConcurrencyWhile) must backfill it.
      putAction(makePreIndexActionStorage(impl.ctx.storage), 1);
    });

    await abortAllDurableObjects();

    await inOverseer("git-migration-single", async impl => {
      // The constructor's blockConcurrencyWhile completed before this event was delivered,
      // running the whole migration ladder: git storage (2), the action indexes (3), then the
      // workpiece-type stamp (4).
      expect(impl.storage.version.get()).toBe(OVERSEER_STORAGE_VERSION);
      expect([...impl.storage.actions.pendingByGatekeeper.list()].map((r: any) => r.id))
          .toEqual([1]);
      // The type stamp (3→4) covered the row the git migration wrote.
      expect(impl.storage.gadgets.get(1)!.type).toBe("gadget");

      await expectHeadsMatchDoc(impl.storage, impl.gitStore, ws.docAt("current"), 1);

      // Chain sanity: an empty parentless root, the pre-gap batch (v1-v3), and the final
      // version, linearly chained and authored as the ownerless fallback identity.
      let head = impl.storage.gadgets.get(1)!.commitId!;
      let log = await impl.gitStore.readCommitLog(head);
      expect(log.length).toBe(3);
      expect(log[0].parents).toEqual([log[1].oid]);
      expect(log[1].parents).toEqual([log[2].oid]);
      expect(log[2].parents).toEqual([]);
      expect(await impl.gitStore.readCommitFiles(log[2].oid)).toEqual(new Map());
      expect(await impl.gitStore.readCommitFiles(log[1].oid)).toEqual(new Map([
        ["app.js", "hello\n"],
        ["util.js", "util one\n"],
      ]));
      for (let entry of log) {
        expect(entry.author).toEqual(FALLBACK_OWNER);
      }
    });
  });

  it("migrates a multi-gadget workspace with per-gadget heads and unpolluted chains",
      async () => {
    let ws = await seedLegacyWorkspace("git-migration-multi", (ws, impl) => {
      ws.addGadget(1, "APP");   // default gadget: legacy files root ""
      ws.addGadget(2, "LEFT");  // root "2"
      ws.addGadget(3, "RIGHT"); // root "3"
      impl.storage.defaultGadgetId.put(1);
      ws.addChat(1);

      ws.edit(T0 + 1 * MINUTE, doc => setFile(doc, "", "app.js", "a one\n"));            // v2
      ws.addMessage(1, USER, { type: "merge", mergeThrough: 0, version: 2 });
      // One version touching two gadgets' roots at once.
      ws.edit(T0 + 2 * MINUTE, doc => {
        setFile(doc, "", "app.js", "a two\n");
        setFile(doc, "2", "left.js", "l one\n");
      });                                                                                // v3
      ws.addMessage(1, USER, { type: "merge", mergeThrough: 1, version: 3 });
      // A gap-spanning burst on gadget 3 alone: v4-v6 batch to one commit, v7 is its own.
      ws.edit(T0 + 3 * MINUTE, doc => setFile(doc, "3", "right.js", "r one\n"));         // v4
      ws.edit(T0 + 4 * MINUTE, doc => setFile(doc, "3", "extra.js", "r extra\n"));       // v5
      ws.edit(T0 + 5 * MINUTE, doc => setFile(doc, "3", "right.js", "r two\n"));         // v6
      ws.edit(T0 + 5 * MINUTE + HISTORY_COMMIT_GAP_MS,
          doc => setFile(doc, "3", "right.js", "r three\n"));                            // v7
    });

    await abortAllDurableObjects();

    await inOverseer("git-migration-multi", async impl => {
      expect(impl.storage.version.get()).toBe(OVERSEER_STORAGE_VERSION);

      // Every gadget's head equals its own root's content in an independent replay of the log.
      await expectHeadsMatchDoc(impl.storage, impl.gitStore, ws.docAt("current"), 1);

      // Non-pollution: each chain is the empty root plus that gadget's own commit points,
      // regardless of the others' activity, and carries only its own filenames.
      let logOf = async (gadgetId: number) =>
          await impl.gitStore.readCommitLog(impl.storage.gadgets.get(gadgetId)!.commitId!);
      let appLog = await logOf(1);
      let leftLog = await logOf(2);
      let rightLog = await logOf(3);
      expect(appLog.length).toBe(3);    // empty root + merge points v2 and v3
      expect(leftLog.length).toBe(2);   // empty root + merge point v3
      expect(rightLog.length).toBe(3);  // empty root + pre-gap batch (v6) + final (v7)

      expect(await impl.gitStore.readCommitFiles(appLog[1].oid))
          .toEqual(new Map([["app.js", "a one\n"]]));
      expect(await impl.gitStore.readCommitFiles(leftLog[0].oid))
          .toEqual(new Map([["left.js", "l one\n"]]));
      // Gadget 3's intermediate commit is the batch's end state, checked against the replay.
      expect(await impl.gitStore.readCommitFiles(rightLog[1].oid))
          .toEqual(readDocFiles(ws.docAt(6), "3"));
    });
  });
});

describe("action-index backfills via the Overseer constructor", () => {
  it("backfills a version-2 workspace's indexes and stamps version 3", async () => {
    await inOverseer("pending-index-v2", async impl => {
      expect(impl.storage.version.get()).toBe(0);
      // Seed through an index-less view of the same real storage, simulating records written
      // before the action indexes were declared (their entries only exist for writes made after
      // the declarations).
      let legacy = makePreIndexActionStorage(impl.ctx.storage);
      putAction(legacy, 1);
      putAction(legacy, 2, { state: "approved" });
      putAction(legacy, 3, { gatekeeperId: 2 });
      // Last write: arm the constructor's version-2 migration.
      impl.storage.version.put(2);
    });

    await abortAllDurableObjects();

    await inOverseer("pending-index-v2", async impl => {
      expect(impl.storage.version.get()).toBe(OVERSEER_STORAGE_VERSION);
      // The pending index sees exactly the pendings (grouped by gatekeeper, so 1 before 3 here).
      expect([...impl.storage.actions.pendingByGatekeeper.list()].map((r: any) => r.id))
          .toEqual([1, 3]);
      // The history-filter index serves every key over the seeded records.
      expect([...impl.storage.actions.byHistoryFilter.get("action")].map((r: any) => r.id))
          .toEqual([1, 2, 3]);
      expect([...impl.storage.actions.byHistoryFilter.get("pending")].map((r: any) => r.id))
          .toEqual([1, 3]);
      // The last-changed index covers the whole log, in change-time order.
      expect([...impl.storage.actions.byLastChanged.list()].map((r: any) => r.id))
          .toEqual([1, 2, 3]);

      // Resolving a backfilled record must not throw on the index updates -- the failure mode
      // that makes these backfills mandatory rather than an optimization.
      let record = impl.storage.actions.get(1)!;
      record.state = "approved";
      record.appliedAt = new Date();
      impl.storage.actions.put(record);
      expect([...impl.storage.actions.pendingByGatekeeper.list()].map((r: any) => r.id))
          .toEqual([3]);
      expect([...impl.storage.actions.byHistoryFilter.get("pending")].map((r: any) => r.id))
          .toEqual([3]);
      expect([...impl.storage.actions.byLastChanged.list()].map((r: any) => r.id))
          .toEqual([2, 3, 1]);
    });
  });
});
