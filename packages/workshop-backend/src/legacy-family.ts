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
