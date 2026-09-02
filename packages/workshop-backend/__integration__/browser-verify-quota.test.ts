import { exports as workerExports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  MAX_BROWSER_VERIFY_PER_USER_PER_DAY,
  MAX_CONCURRENT_BROWSER_VERIFICATIONS,
} from "../src/browser-verify-limits.js";

describe("browserVerify durable quotas", () => {
  it("atomically refuses a user's next call after the UTC-day allowance", async () => {
    let user = workerExports.UserDurableObject.getByName(`quota-${crypto.randomUUID()}`);
    for (let used = 1; used <= MAX_BROWSER_VERIFY_PER_USER_PER_DAY; used++) {
      let result = await user.consumeDailyBrowserVerification(MAX_BROWSER_VERIFY_PER_USER_PER_DAY);
      expect(result).toMatchObject({withinLimits: true, used});
    }
    await expect(user.consumeDailyBrowserVerification(MAX_BROWSER_VERIFY_PER_USER_PER_DAY))
        .resolves.toMatchObject({withinLimits: false, used: MAX_BROWSER_VERIFY_PER_USER_PER_DAY});
  });

  it("refuses a fourth concurrent deployment lease and releases capacity", async () => {
    let limiter = workerExports.BrowserVerificationLimiterDurableObject.getByName("global");
    let ids = Array.from({length: MAX_CONCURRENT_BROWSER_VERIFICATIONS}, () => crypto.randomUUID());
    try {
      for (let [index, id] of ids.entries()) {
        await expect(limiter.acquire(id)).resolves.toMatchObject({
          granted: true, active: index + 1, limit: MAX_CONCURRENT_BROWSER_VERIFICATIONS,
        });
      }
      await expect(limiter.acquire(crypto.randomUUID())).resolves.toMatchObject({
        granted: false, active: MAX_CONCURRENT_BROWSER_VERIFICATIONS,
      });
      await limiter.release(ids[0]);
      await expect(limiter.acquire("replacement")).resolves.toMatchObject({granted: true});
      await limiter.release("replacement");
    } finally {
      await Promise.all(ids.map(id => limiter.release(id)));
    }
  });
});
