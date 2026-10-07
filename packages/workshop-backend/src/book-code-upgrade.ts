// Upgrading the store manager's existing books to the current book template's code.
//
// A book keeps a copy of its gadget code (server.js/client.js) committed when it was created,
// so fixes shipped in the template never reach books that already exist. This module scans the
// calling admin's own workspaces for book gadgets, reports each book's current code vintage,
// and rewrites the code files as one new git commit per book. It never touches the book's
// stored data: manuscript files, tutor conversation, progress and settings live in workspace
// SQLite (`book_files`/`messages`/`progress`/`settings`), which these paths do not read.
//
// Books carrying the bundled illustration animations keep them: rather than adopting the new
// template's client.js outright (the template no longer ships animation implementations), the
// upgrade splices the book's own animation payload into the new application code. Everything
// else gets the new client.js verbatim.
//
// The AdminSettings DO drives it: it is the deployment's singleton and reachable only through
// AdminApi, which AuthenticatedApi mints solely for admins (server.ts getAdminApi).

import * as Y from "yjs";
import type {
  BookCodeUpgradeEntry, BookCodeUpgradeEntryStatus, BookCodeUpgradeReport,
} from "@gadgets/workshop-shared/api";
import { readBlueprintContent } from "./blueprint-archive.js";
import { BOOK_BLUEPRINT_ID } from "./book-mcp.js";
import type { OverseerDurableObject } from "./overseer.js";
import type { UserDurableObject } from "./user.js";
import { readBlueprintKvRecord } from "./storage-schema/blueprints-kv.js";

/** The pieces of the deployment the upgrade reads and writes, threaded in by AdminSettings. */
export type BookCodeUpgradeContext = {
  env: Cloudflare.Env;
  /** The requesting admin's user DO id -- what workspaces check their ownerId against. */
  adminUserId: string;
  adminUser: DurableObjectStub<UserDurableObject>;
  overseers: DurableObjectNamespace<OverseerDurableObject>;
};

/** The code files an upgrade replaces. */
export type BookCode = {
  serverJs: string;
  clientJs: string;
};

/** A book gadget plus the workspace stub it is reached through. Internal to the scan. */
type SourceBook = {
  workspaceId: string;
  workspaceTitle: string;
  gadgetId: number;
  overseer: DurableObjectStub<OverseerDurableObject>;
};

// The generated animation code sits in one contiguous region of the bundled client.js: the
// `// client/anim/<name>.ts` implementation blocks ending with `// client/anim/index.ts` and
// `var registry = {...}` (id -> function). mountAnimations() and canvasLoop() follow the
// region and belong to the application part. The drawing constants the animations share
// (ACCENT, INK, SOFT, WARM, ease) sit between canvasLoop and the `// workspace-book-client.js`
// application marker; the animation-free template simply has an empty block in each spot.
const ANIM_SECTION_START = "  // client/anim/";
const MOUNT_MARKER = "  function mountAnimations(";
const CANVAS_LOOP_END = '__name(canvasLoop, "canvasLoop");';
const APP_MARKER = "  // workspace-book-client.js";
const ANIM_IMPL_MARKER = /\/\/ client\/anim\/(?!index\.ts)/;
const NONEMPTY_REGISTRY = /var registry = \{\s*[^\s}]/;

/** A book client's animation payload: the parts an upgrade carries into the new template. */
type AnimPayload = {
  /** Implementation blocks plus the `index.ts` registry, from the first anim marker to
   *  mountAnimations(). */
  implementations: string;
  /** The shared drawing constants between canvasLoop and the application marker. */
  constants: string;
};

function extractAnimPayload(clientJs: string): AnimPayload | null {
  let animStart = clientJs.indexOf(ANIM_SECTION_START);
  let mountStart = clientJs.indexOf(MOUNT_MARKER);
  let canvasEnd = clientJs.indexOf(CANVAS_LOOP_END);
  let appStart = clientJs.indexOf(APP_MARKER);
  if (animStart < 0 || mountStart < 0 || canvasEnd < 0 || appStart < 0) return null;
  return {
    implementations: clientJs.slice(animStart, mountStart),
    constants: clientJs.slice(canvasEnd + CANVAS_LOOP_END.length, appStart),
  };
}

function hasAnimations(payload: AnimPayload): boolean {
  return ANIM_IMPL_MARKER.test(payload.implementations)
      || NONEMPTY_REGISTRY.test(payload.implementations);
}

/**
 * Splice a book's animation payload into the new template's client.js: the template keeps its
 * (fixed) mountAnimations/canvasLoop and all application code, the book keeps its own
 * implementations, registry and drawing constants. Null when the new client has no animation
 * region to splice into.
 */
export function mergeAnimClientCode(templateClientJs: string, payload: AnimPayload)
    : string | null {
  let animStart = templateClientJs.indexOf(ANIM_SECTION_START);
  let mountStart = templateClientJs.indexOf(MOUNT_MARKER);
  let canvasEnd = templateClientJs.indexOf(CANVAS_LOOP_END);
  let appStart = templateClientJs.indexOf(APP_MARKER);
  if (animStart < 0 || mountStart < 0 || canvasEnd < 0 || appStart < 0) return null;
  return templateClientJs.slice(0, animStart)
      + payload.implementations
      + templateClientJs.slice(mountStart, canvasEnd + CANVAS_LOOP_END.length)
      + payload.constants
      + templateClientJs.slice(appStart);
}

/** What planBookCode decided for one book: its vintage, the change list, and the target code. */
type BookCodePlan = {
  kind: BookCodeUpgradeEntry["kind"];
  changes: string[];
  /** The code an upgrade writes; absent for current/unknown books. */
  target?: BookCode;
};

/**
 * Classify a book's committed code and compute its upgrade target. Pure -- the dry run and the
 * real run share this so the report an admin reviewed is exactly what the run writes.
 */
export function planBookCode(code: {serverJs?: string; clientJs?: string}, template: BookCode)
    : BookCodePlan {
  if (code.serverJs === undefined || code.clientJs === undefined) {
    return {kind: "unknown", changes: ["server.js or client.js is missing from the book's code"]};
  }

  let payload = extractAnimPayload(code.clientJs);
  if (payload === null) {
    // Animations without the generated markers can't be spliced; replacing wholesale would
    // silently drop them, so the book is left for the admin to inspect.
    if (NONEMPTY_REGISTRY.test(code.clientJs)) {
      return {kind: "unknown",
        changes: ["client.js has an animation registry in a layout the upgrade cannot splice"]};
    }
  }
  let anim = payload !== null && hasAnimations(payload);

  let clientTarget = anim ? mergeAnimClientCode(template.clientJs, payload!) : template.clientJs;
  if (clientTarget === null) {
    return {kind: "unknown",
      changes: ["the installed template's client.js has no animation region to splice into"]};
  }

  let kind: BookCodeUpgradeEntry["kind"] =
      code.serverJs === template.serverJs && code.clientJs === clientTarget
        ? "current" : (anim ? "anim" : "generic");
  let changes: string[] = [];
  if (code.serverJs !== template.serverJs) {
    changes.push("server.js: replaced with the installed template " +
        "(per-chapter tutor conversations, server-side chapter text, deleteBookFiles)");
  }
  if (code.clientJs !== clientTarget) {
    changes.push(anim
        ? `client.js: application code updated to the installed template; ` +
          `animation payload preserved (${countAnimations(payload!)} implementations)`
        : "client.js: replaced with the installed template");
  }
  return {kind, changes, target: kind === "current" ? undefined : {serverJs: template.serverJs, clientJs: clientTarget}};
}

function countAnimations(payload: AnimPayload): number {
  return (payload.implementations.match(/\/\/ client\/anim\//g) ?? []).length - 1; // minus index.ts
}

// The code the upgrade installs: the book blueprint the deployment currently ships. Read once
// per run; a deployment that somehow lacks the book blueprint fails the run before any book is
// touched.
async function loadTemplateCode(ctx: BookCodeUpgradeContext): Promise<BookCode> {
  let kvRecord = await readBlueprintKvRecord(ctx.env, BOOK_BLUEPRINT_ID);
  if (!kvRecord) throw new Error(`Blueprint ${BOOK_BLUEPRINT_ID} is not installed.`);
  let bytes = await readBlueprintContent(ctx.env, BOOK_BLUEPRINT_ID, kvRecord.metadata.version);
  if (!bytes) throw new Error(`Blueprint ${BOOK_BLUEPRINT_ID} content is missing.`);
  let doc = new Y.Doc();
  Y.applyUpdateV2(doc, bytes);
  let files = new Map<string, string>();
  for (let [name, text] of doc.getMap<Y.Text>()) files.set(name, text.toString());
  let serverJs = files.get("server.js");
  let clientJs = files.get("client.js");
  if (!serverJs || !clientJs) {
    throw new Error(`Blueprint ${BOOK_BLUEPRINT_ID} has no server.js/client.js.`);
  }
  return {serverJs, clientJs};
}

/** Every book gadget in workspaces the admin owns (shared-in workspaces are someone else's). */
async function scanAdminBooks(ctx: BookCodeUpgradeContext): Promise<SourceBook[]> {
  let books: SourceBook[] = [];
  for (let workspace of await ctx.adminUser.listGadgets()) {
    if (workspace.owner) continue;
    let overseer = ctx.overseers.get(ctx.overseers.idFromString(workspace.id));
    for (let book of await overseer.getBookMcpWorkspaces(ctx.adminUserId)) {
      books.push({
        workspaceId: workspace.id, workspaceTitle: workspace.title,
        gadgetId: book.gadgetId, overseer,
      });
    }
  }
  return books;
}

function buildReport(dryRun: boolean, entries: BookCodeUpgradeEntry[]): BookCodeUpgradeReport {
  let count = (status: BookCodeUpgradeEntryStatus) =>
      entries.filter(entry => entry.status === status).length;
  return {
    dryRun,
    generatedAt: new Date().toISOString(),
    bookCount: entries.length,
    wouldUpgradeCount: count("wouldUpgrade"),
    upgradedCount: count("upgraded"),
    unchangedCount: count("unchanged"),
    skippedCount: count("skipped"),
    errorCount: count("error"),
    entries,
  };
}

function describeSource(source: SourceBook) {
  return {
    workspaceId: source.workspaceId,
    workspaceTitle: source.workspaceTitle,
    gadgetId: source.gadgetId,
  };
}

async function planForBook(source: SourceBook, ctx: BookCodeUpgradeContext, template: BookCode)
    : Promise<BookCodePlan> {
  let code = await source.overseer.readBookCode(ctx.adminUserId, source.gadgetId);
  return planBookCode(code, template);
}

/**
 * Dry run: list each book's code vintage and what the upgrade would change. Writes nothing --
 * books are only read, and no commits are made.
 */
export async function planBookCodeUpgrade(ctx: BookCodeUpgradeContext)
    : Promise<BookCodeUpgradeReport> {
  let template = await loadTemplateCode(ctx);
  let entries: BookCodeUpgradeEntry[] = [];
  for (let source of await scanAdminBooks(ctx)) {
    try {
      let plan = await planForBook(source, ctx, template);
      entries.push({
        ...describeSource(source), kind: plan.kind, changes: plan.changes,
        status: plan.target ? "wouldUpgrade"
            : plan.kind === "current" ? "unchanged" : "skipped",
      });
    } catch (err) {
      entries.push({
        ...describeSource(source), kind: "unknown", status: "error", changes: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return buildReport(true, entries);
}

/**
 * Real run: write each upgradable book's target code as a new commit on its head. Per book,
 * failures are recorded in the entry (the run continues); a rerun re-plans from the current
 * code, so already-written books come back `unchanged`.
 */
export async function runBookCodeUpgrade(ctx: BookCodeUpgradeContext)
    : Promise<BookCodeUpgradeReport> {
  let template = await loadTemplateCode(ctx);
  let entries: BookCodeUpgradeEntry[] = [];
  for (let source of await scanAdminBooks(ctx)) {
    let headCommitId: string | undefined;
    try {
      let plan = await planForBook(source, ctx, template);
      if (!plan.target) {
        entries.push({
          ...describeSource(source), kind: plan.kind, changes: plan.changes,
          status: plan.kind === "current" ? "unchanged" : "skipped",
        });
        continue;
      }
      headCommitId = await source.overseer.upgradeBookCode(
          ctx.adminUserId, plan.target, source.gadgetId) ?? undefined;
      entries.push({
        ...describeSource(source), kind: plan.kind, changes: plan.changes,
        status: headCommitId === undefined ? "unchanged" : "upgraded", headCommitId,
      });
    } catch (err) {
      entries.push({
        ...describeSource(source), kind: "unknown", status: "error", changes: [],
        headCommitId, error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return buildReport(false, entries);
}
