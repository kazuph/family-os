import { describe, expect, it } from "vitest";
import { AgentTurnError, explainIncompleteStream } from "../src/ai-invoke.js";

describe("incomplete model streams", () => {
  it("explains that partial text is retained and unfinished edits are not applied", () => {
    expect(explainIncompleteStream("Stream ended without finish_reason", true, true)).toBe(
      "The model provider closed the stream without a completion marker. " +
      "The partial text received before the disconnect is preserved below. " +
      "Incomplete tool calls and file edits were not applied. Retry the request to continue.",
    );
  });

  it("leaves unrelated provider errors unchanged", () => {
    expect(explainIncompleteStream("429 rate limit", false, false)).toBe("429 rate limit");
  });

  it("carries partial text separately from the error message", () => {
    const error = new AgentTurnError("provider disconnected", 200, "partial answer");
    expect(error.statusCode).toBe(200);
    expect(error.partialResponse).toBe("partial answer");
  });
});
