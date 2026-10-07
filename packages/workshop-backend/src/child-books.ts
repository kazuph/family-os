// Migrating the legacy Family OS children's books into the store manager's account.
//
// The old deployment registered child accounts in FamilyDurableObject; child sign-in was never
// restored here, so those books exist but nobody can open them. This module walks the registry,
// finds every book gadget, and copies each one's complete state (see book-data.ts) into a fresh
// `format.book` workspace in the calling admin's account. Sources are read only -- nothing in a
// child's user DO, workspace or gadget database is written.
//
// The AdminSettings DO drives it: it is the deployment's singleton, so the migration ledger it
// stores is the one idempotency anchor, and it is reachable only through AdminApi, which
// AuthenticatedApi mints solely for admins.

import type {
  ChildBookMigrationEntry, ChildBookMigrationReport, ChildBookMigrationSkippedChild,
  ChildBookMigrationSource, ChildBookMigrationTarget,
} from "@gadgets/workshop-shared/api";
import { deploymentOutputForBlueprint } from "./admin-config.js";
import { readBlueprintContent, sanitizeBlueprintOutput } from "./blueprint-archive.js";
import { BOOK_BLUEPRINT_ID } from "./book-mcp.js";
import { bookDataSummary } from "./book-data.js";
import type { FamilyDurableObject, LegacyChildRecord } from "./legacy-family.js";
import type { OverseerDurableObject } from "./overseer.js";
import type { UserDurableObject } from "./user.js";
import type {
  AdminConfig, AdminSettingsStorage, ChildBookMigrationRecord,
} from "./storage-schema/admin-settings-storage.js";
import { readBlueprintKvRecord } from "./storage-schema/blueprints-kv.js";

/** The pieces of the deployment the migration reads and writes, threaded in by AdminSettings. */
export type ChildBookMigrationContext = {
  env: Cloudflare.Env;
  /** The deployment's current admin config (destination output selection). */
  config: AdminConfig;
  /** The requesting admin's account name (their profile id). */
  adminName: string;
  /** The requesting admin's user DO id -- what workspaces check their ownerId against. */
  adminUserId: string;
  adminUser: DurableObjectStub<UserDurableObject>;
  users: DurableObjectNamespace<UserDurableObject>;
  overseers: DurableObjectNamespace<OverseerDurableObject>;
  family: DurableObjectStub<FamilyDurableObject>;
  /** The migration ledger kept by AdminSettings. */
  ledger: AdminSettingsStorage["childBookMigrations"];
};

/** A source book plus the workspace stub it is read through. Internal to the scan. */
type SourceBook = {
  child: LegacyChildRecord;
  sourceWorkspaceId: string;
  sourceGadgetId: number;
  title: string;
  overseer: DurableObjectStub<OverseerDurableObject>;
};

function sourceKey(source: SourceBook): string {
  return `${source.child.userId}/${source.sourceWorkspaceId}/${source.sourceGadgetId}`;
}

/** The destination workspace's title: the book's title, marked with whose it was. */
function targetTitle(source: SourceBook): string {
  return source.child.name ? `${source.title}（${source.child.name}）` : source.title;
}

function describeSource(source: SourceBook): ChildBookMigrationSource {
  return {
    childId: source.child.id,
    childName: source.child.name,
    childUserId: source.child.userId,
    workspaceId: source.sourceWorkspaceId,
    gadgetId: source.sourceGadgetId,
    title: source.title,
  };
}

/**
 * Every registered child's own book gadget. Same scan as the admin's augmented listing
 * (server.ts listGadgets): only registry entries whose stored userId still resolves to the
 * account named by `child.id`, only workspaces the child owns, only `book`-output gadgets.
 */
async function scanChildBooks(ctx: ChildBookMigrationContext): Promise<{
  childCount: number;
  sources: SourceBook[];
  skippedChildren: ChildBookMigrationSkippedChild[];
}> {
  let children = await ctx.family.listChildren();
  let sources: SourceBook[] = [];
  let skippedChildren: ChildBookMigrationSkippedChild[] = [];
  for (let child of children) {
    if (ctx.users.idFromName(child.id).toString() !== child.userId) {
      skippedChildren.push({
        childId: child.id, childName: child.name,
        reason: "Registry entry does not match the account named by its id.",
      });
      continue;
    }
    let user = ctx.users.get(ctx.users.idFromString(child.userId));
    for (let workspace of await user.listGadgets()) {
      // A shared-in workspace is someone else's book.
      if (workspace.owner) continue;
      let overseer = ctx.overseers.get(ctx.overseers.idFromString(workspace.id));
      for (let book of await overseer.getBookMcpWorkspaces(child.userId)) {
        sources.push({
          child,
          sourceWorkspaceId: workspace.id,
          sourceGadgetId: book.gadgetId,
          title: workspace.title,
          overseer,
        });
      }
    }
  }
  return {childCount: children.length, sources, skippedChildren};
}

function destinationForRecord(record: ChildBookMigrationRecord): ChildBookMigrationTarget {
  return {workspaceId: record.targetWorkspaceId, gadgetId: record.targetGadgetId, title: record.title};
}

function statusForRecord(record: ChildBookMigrationRecord, adminUserId: string)
    : {status: ChildBookMigrationEntry["status"]; destination?: ChildBookMigrationTarget} {
  if (record.status === "copied") {
    return record.adminUserId === adminUserId
        ? {status: "alreadyMigrated", destination: destinationForRecord(record)}
        : {status: "conflict", destination: destinationForRecord(record)};
  }
  // "created": a previous run chose the destination but never finished writing. A rerun resumes
  // into it rather than choosing anew -- the record exists so a retry can't mint a second one.
  return {status: "wouldCopy", destination: destinationForRecord(record)};
}

function buildReport(
    ctx: ChildBookMigrationContext, dryRun: boolean, childCount: number,
    entries: ChildBookMigrationEntry[], skippedChildren: ChildBookMigrationSkippedChild[])
    : ChildBookMigrationReport {
  let count = (status: ChildBookMigrationEntry["status"]) =>
      entries.filter(entry => entry.status === status).length;
  return {
    dryRun,
    generatedAt: new Date().toISOString(),
    childCount,
    bookCount: entries.length,
    wouldCopyCount: count("wouldCopy"),
    migratedCount: count("migrated"),
    alreadyMigratedCount: count("alreadyMigrated"),
    conflictCount: count("conflict"),
    errorCount: count("error"),
    skippedChildren,
    entries,
  };
}

/**
 * Dry run: list each child's book, its ledger state, and how much the copy would carry. Writes
 * nothing -- the ledger is read, source books are read, and no destination is allocated.
 */
export async function planChildBookMigration(ctx: ChildBookMigrationContext)
    : Promise<ChildBookMigrationReport> {
  let {childCount, sources, skippedChildren} = await scanChildBooks(ctx);
  let entries: ChildBookMigrationEntry[] = [];
  for (let source of sources) {
    let record = ctx.ledger.get(sourceKey(source));
    if (record) {
      entries.push({source: describeSource(source), ...statusForRecord(record, ctx.adminUserId)});
      continue;
    }
    try {
      let snapshot = await source.overseer.exportBookData(
          source.child.userId, source.sourceGadgetId);
      entries.push({
        source: describeSource(source),
        destination: {title: targetTitle(source)},
        status: "wouldCopy",
        ...bookDataSummary(snapshot),
      });
    } catch (err) {
      entries.push({
        source: describeSource(source), status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return buildReport(ctx, true, childCount, entries, skippedChildren);
}

// The blueprint to stamp destinations from. Read once per run; a deployment that somehow lacks
// the bundled book fails the whole run before any workspace is touched.
async function loadBookBlueprint(ctx: ChildBookMigrationContext) {
  let kvRecord = await readBlueprintKvRecord(ctx.env, BOOK_BLUEPRINT_ID);
  if (!kvRecord) throw new Error(`Blueprint ${BOOK_BLUEPRINT_ID} is not installed.`);
  let bytes = await readBlueprintContent(ctx.env, BOOK_BLUEPRINT_ID, kvRecord.metadata.version);
  if (!bytes) throw new Error(`Blueprint ${BOOK_BLUEPRINT_ID} content is missing.`);
  return {
    bytes,
    output: deploymentOutputForBlueprint(
        ctx.config, BOOK_BLUEPRINT_ID, sanitizeBlueprintOutput(kvRecord.metadata.output)),
  };
}

// Reserve the destination before it exists: the record's targetWorkspaceId is the id the
// workspace will get, so a crash anywhere below resumes into the same destination.
function claimDestination(ctx: ChildBookMigrationContext, source: SourceBook)
    : ChildBookMigrationRecord {
  let record: ChildBookMigrationRecord = {
    sourceKey: sourceKey(source),
    adminUserId: ctx.adminUserId,
    childId: source.child.id,
    childUserId: source.child.userId,
    childName: source.child.name,
    sourceWorkspaceId: source.sourceWorkspaceId,
    sourceGadgetId: source.sourceGadgetId,
    targetWorkspaceId: ctx.overseers.newUniqueId().toString(),
    title: targetTitle(source),
    status: "created",
    migratedAt: new Date().toISOString(),
  };
  ctx.ledger.put(record);
  return record;
}

/**
 * Ensure the record's destination workspace exists, is the admin's, and holds a book gadget.
 * Fresh records build it like newGadgetFromBlueprint() does (open() initializes ownership);
 * resumed records skip whichever steps an interrupted run already completed.
 */
async function ensureDestination(ctx: ChildBookMigrationContext,
                                 record: ChildBookMigrationRecord,
                                 blueprint: Awaited<ReturnType<typeof loadBookBlueprint>>)
    : Promise<{overseer: DurableObjectStub<OverseerDurableObject>; gadgetId: number}> {
  let overseer = ctx.overseers.get(ctx.overseers.idFromString(record.targetWorkspaceId));
  let books = await overseer.getBookMcpWorkspaces(ctx.adminUserId);
  if (books.length === 0) {
    await ctx.adminUser.newGadget(record.targetWorkspaceId, record.title);
    // open() is what transfers ownership into the workspace; the session ends when the stub
    // is disposed at return, leaving the workspace initialized.
    using _session = await overseer.open(record.adminUserId, ctx.adminName, () => {});
    await overseer.initializeFromBlueprint(blueprint.bytes, record.title, blueprint.output);
    books = await overseer.getBookMcpWorkspaces(ctx.adminUserId);
    if (books.length === 0) {
      throw new Error("Destination workspace produced no book gadget.");
    }
  }
  return {overseer, gadgetId: books[0]!.gadgetId};
}

/**
 * Real run: copy every source book not already marked copied. Per book, failures are recorded in
 * the entry (the run continues) and the ledger keeps whatever state it reached, so rerunning
 * after fixing a problem only retries the books that need it.
 */
export async function runChildBookMigration(ctx: ChildBookMigrationContext)
    : Promise<ChildBookMigrationReport> {
  let {childCount, sources, skippedChildren} = await scanChildBooks(ctx);
  let blueprint = await loadBookBlueprint(ctx);
  let entries: ChildBookMigrationEntry[] = [];
  for (let source of sources) {
    let record = ctx.ledger.get(sourceKey(source));
    if (record?.status === "copied") {
      entries.push({source: describeSource(source), ...statusForRecord(record, ctx.adminUserId)});
      continue;
    }
    let destination: ChildBookMigrationTarget | undefined;
    try {
      record ??= claimDestination(ctx, source);
      destination = destinationForRecord(record);
      let {overseer, gadgetId} = await ensureDestination(ctx, record, blueprint);
      destination = {...destination, gadgetId};

      // Read the source only after the destination exists: a source that cannot be read leaves
      // the record at "created" for a later retry.
      let snapshot = await source.overseer.exportBookData(
          source.child.userId, source.sourceGadgetId);
      await overseer.importBookData(ctx.adminUserId, snapshot, gadgetId);
      ctx.ledger.put({
        ...record, targetGadgetId: gadgetId, status: "copied",
        migratedAt: new Date().toISOString(),
      });

      // Publish the new workspace's output to the admin's index now, rather than waiting for the
      // deferred push open() scheduled, so listOutputs() sees the book as soon as the run ends.
      let outputs = await overseer.getOutputsForOwnerBackfill(ctx.adminUserId);
      if (outputs) await ctx.adminUser.syncWorkspaceOutputs(record.targetWorkspaceId, outputs);

      entries.push({
        source: describeSource(source), destination, status: "migrated",
        ...bookDataSummary(snapshot),
      });
    } catch (err) {
      entries.push({
        source: describeSource(source), destination, status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return buildReport(ctx, false, childCount, entries, skippedChildren);
}
