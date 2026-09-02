import { describe, expect, it } from "vitest";
import {
  assertBrowserVerifyResponseLimit,
  BROWSER_VERIFY_LEASE_MS,
  MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE,
  MAX_CONCURRENT_BROWSER_VERIFICATIONS,
} from "../src/browser-verify-limits";
import { acquireBrowserVerificationLease } from "../src/browser-verification-limiter";

describe("browserVerify limits", () => {
  it("rejects a fifth verification in one agent response", () => {
    expect(() => assertBrowserVerifyResponseLimit(MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE - 1))
        .not.toThrow();
    expect(() => assertBrowserVerifyResponseLimit(MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE))
        .toThrow(/limited to 4 calls/);
  });

  it("bounds deployment concurrency and recovers expired leases", () => {
    let now = 1_000;
    let leases: {id: string; expiresAt: number}[] = [];
    for (let index = 0; index < MAX_CONCURRENT_BROWSER_VERIFICATIONS; index++) {
      let result = acquireBrowserVerificationLease(leases, `lease-${index}`, now);
      expect(result.granted).toBe(true);
      leases = result.leases;
    }
    expect(acquireBrowserVerificationLease(leases, "blocked", now).granted).toBe(false);
    let afterExpiry = acquireBrowserVerificationLease(
      leases, "replacement", now + BROWSER_VERIFY_LEASE_MS,
    );
    expect(afterExpiry.granted).toBe(true);
    expect(afterExpiry.leases).toHaveLength(1);
  });
});
