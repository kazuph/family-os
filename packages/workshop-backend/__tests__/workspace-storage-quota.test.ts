import { describe, expect, it } from "vitest";
import { checkWorkspaceStorageWrite } from "../src/workspace-storage-quota";

describe("workspace storage quota", () => {
  let quota = {warningBytes: 512, hardBytes: 1024};

  it("warns before the hard limit without rejecting the write", () => {
    expect(checkWorkspaceStorageWrite(500, 12, quota)).toEqual({
      usedBytes: 500, projectedBytes: 512, warning: true,
    });
  });

  it("rejects a write that would cross the hard limit", () => {
    expect(() => checkWorkspaceStorageWrite(1000, 25, quota)).toThrow(/quota exceeded/);
  });
});
