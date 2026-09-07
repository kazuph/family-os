import { expect, it } from "vitest";
import { autoApprovalRuleKey } from "../src/auto-approval.js";

it("keeps gadget-scoped approval separate from tags containing the scope delimiter", () => {
  const global = autoApprovalRuleKey(1, "append:gadget:2");
  const scoped = autoApprovalRuleKey(1, "append", 2);
  expect(scoped).not.toBe(global);
  expect(autoApprovalRuleKey(1, "append", 3)).not.toBe(scoped);
  expect(autoApprovalRuleKey(2, "append", 2)).not.toBe(scoped);
  expect(autoApprovalRuleKey(1, "append")).toBe("1:append");
});
