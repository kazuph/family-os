import { DurableObject } from "cloudflare:workers";

/** Retains the deployed household namespace without restoring household authentication. */
export class FamilyDurableObject extends DurableObject<Cloudflare.Env> {}

/** Retains the obsolete browser semaphore namespace and its stored leases. */
export class BrowserVerificationLimiterDurableObject extends DurableObject<Cloudflare.Env> {}

/**
 * Retains the deployed BookDataFacet namespace (added by the since-removed child-book migration)
 * so the production class set stays unchanged; deleting a deployed class is irreversible.
 */
export class BookDataFacet extends DurableObject<Cloudflare.Env> {}
