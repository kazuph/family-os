import { MAX_EXPORT_DURATION_MS } from "./export-limits";

/** Maximum Browser Run verifications one user may start in one UTC day. */
export const MAX_BROWSER_VERIFY_PER_USER_PER_DAY = 30;

/** Maximum Browser Run verifications one agent response may start. */
export const MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE = 4;

/** Maximum concurrent Browser Run verifications in one deployment. */
export const MAX_CONCURRENT_BROWSER_VERIFICATIONS = 3;

/** Browser execution budget applied to each verification. */
export const MAX_BROWSER_VERIFY_DURATION_MS = MAX_EXPORT_DURATION_MS;

/**
 * Lease lifetime includes the existing ten-second browser-close budget. A crashed caller cannot
 * consume a global slot indefinitely.
 */
export const BROWSER_VERIFY_LEASE_MS = MAX_BROWSER_VERIFY_DURATION_MS + 10_000;

/** Reject an additional Browser Run call once one agent response has spent its allowance. */
export function assertBrowserVerifyResponseLimit(completedOrStartedCalls: number): void {
  if (completedOrStartedCalls >= MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE) {
    throw new Error(
      `browserVerify is limited to ${MAX_BROWSER_VERIFY_PER_AGENT_RESPONSE} calls per ` +
      "agent response. Continue verification in the next response.",
    );
  }
}
