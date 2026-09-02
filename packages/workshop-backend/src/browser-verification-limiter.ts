import { DurableObject } from "cloudflare:workers";
import {
  BROWSER_VERIFY_LEASE_MS,
  MAX_CONCURRENT_BROWSER_VERIFICATIONS,
} from "./browser-verify-limits";

type BrowserVerificationLease = {id: string; expiresAt: number};

/** Pure lease transition used by the deployment semaphore and its deterministic tests. */
export function acquireBrowserVerificationLease(
  stored: BrowserVerificationLease[], id: string, now: number,
): {granted: boolean; leases: BrowserVerificationLease[]} {
  let leases = stored.filter(lease => lease.expiresAt > now && lease.id !== id);
  if (leases.length >= MAX_CONCURRENT_BROWSER_VERIFICATIONS) {
    return {granted: false, leases};
  }
  return {granted: true, leases: [...leases, {id, expiresAt: now + BROWSER_VERIFY_LEASE_MS}]};
}

/** Deployment-wide semaphore for Browser Run verification sessions. */
export class BrowserVerificationLimiterDurableObject extends DurableObject<Cloudflare.Env> {
  async acquire(id: string): Promise<{granted: boolean; active: number; limit: number}> {
    return this.ctx.storage.transaction(async storage => {
      let next = acquireBrowserVerificationLease(
        await storage.get<BrowserVerificationLease[]>("leases") ?? [], id, Date.now(),
      );
      await storage.put("leases", next.leases);
      return {granted: next.granted, active: next.leases.length,
        limit: MAX_CONCURRENT_BROWSER_VERIFICATIONS};
    });
  }

  async release(id: string): Promise<void> {
    await this.ctx.storage.transaction(async storage => {
      let leases = await storage.get<BrowserVerificationLease[]>("leases") ?? [];
      let remaining = leases.filter(lease => lease.id !== id && lease.expiresAt > Date.now());
      if (remaining.length === 0) await storage.delete("leases");
      else if (remaining.length !== leases.length) await storage.put("leases", remaining);
    });
  }
}
