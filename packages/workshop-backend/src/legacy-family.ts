import { DurableObject } from "cloudflare:workers";
import { collection, createTypedStorage } from "@gadgets/typed-storage";

/** The original child registry row; the UUID owner is never reassigned. */
export type LegacyChildRecord = {kind: "child"; id: string; name: string; userId: string};

/** Retains the deployed household namespace without restoring household authentication. */
export class FamilyDurableObject extends DurableObject<Cloudflare.Env> {
  /** Reads the old child registry without touching passcodes, sessions, or avatar records. */
  listChildren(): LegacyChildRecord[] {
    return [...createTypedStorage(this.ctx.storage, {
      collections: {children: collection<LegacyChildRecord>()({primaryKey: "id"})},
    }).children.list()];
  }
}

/** Retains the obsolete browser semaphore namespace and its stored leases. */
export class BrowserVerificationLimiterDurableObject extends DurableObject<Cloudflare.Env> {}

/**
 * Retains the deployed BookDataFacet namespace (added by the since-removed child-book migration)
 * so the production class set stays unchanged; deleting a deployed class is irreversible.
 */
export class BookDataFacet extends DurableObject<Cloudflare.Env> {}
