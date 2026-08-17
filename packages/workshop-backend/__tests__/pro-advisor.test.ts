import { beforeEach, describe, expect, it } from "vitest";
import type { AiChatAuthorInfo } from "@gadgets/workshop-shared/api";
import { consultProAdvisor } from "../src/pro-advisor.js";

// Drives the real pi-ai stack (no module mocks), same technique as ai-models.test.ts: a stubbed
// fetch captures the outgoing request and returns a non-retryable 400, so pi reports an
// error-stop assistant message and completeText() throws -- letting us assert on exactly what was
// sent without needing to fabricate a full successful provider response.

const INITIATOR: AiChatAuthorInfo = { type: "user", id: "user-123", name: "User" };

type CapturedRequest = { url: string; headers: Headers; body: string };
const capturedRequests: CapturedRequest[] = [];

function env(overrides: Partial<Cloudflare.Env> = {}): Cloudflare.Env {
  return { OPENCODE_GO_API_TOKEN: "opencode-go-token", ...overrides } as Cloudflare.Env;
}

beforeEach(() => {
  capturedRequests.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as RequestInfo, init);
    capturedRequests.push({ url: request.url, headers: request.headers, body: await request.text() });
    return Response.json({ error: { message: "stubbed" } }, { status: 400 });
  }) as unknown as typeof fetch;
});

describe("consultProAdvisor", () => {
  it("asks DeepSeek V4 Pro directly (not Flash), with the question and context on the wire", async () => {
    await expect(consultProAdvisor(env(), INITIATOR, {
      question: "Should we use a Durable Object or a plain Worker here?",
      context: "The gadget needs to coordinate state across five concurrent clients.",
    })).rejects.toThrow();

    expect(capturedRequests).toHaveLength(1);
    const request = capturedRequests[0];
    expect(request.url).toBe("https://opencode.ai/zen/go/v1/chat/completions");
    expect(request.headers.get("authorization")).toBe("Bearer opencode-go-token");

    const body = JSON.parse(request.body) as { model: string };
    expect(body.model).toBe("deepseek-v4-pro");
    expect(request.body).toContain("Should we use a Durable Object or a plain Worker here?");
    expect(request.body).toContain("The gadget needs to coordinate state across five concurrent clients.");
  }, 15000);

  it("omits the context section when no context is given", async () => {
    await expect(consultProAdvisor(env(), INITIATOR, {
      question: "Is this API design idiomatic?",
    })).rejects.toThrow();

    const body = JSON.parse(capturedRequests[0].body) as
        { messages: { role: string; content: unknown }[] };
    const userMessage = body.messages.find((m) => m.role === "user")!;
    expect(userMessage.content).toBe("Is this API design idiomatic?");
  }, 15000);

  it("throws when OpenCode Go isn't configured for this deployment, without making a request", async () => {
    await expect(consultProAdvisor(env({ OPENCODE_GO_API_TOKEN: undefined }), INITIATOR, {
      question: "anything",
    })).rejects.toThrow("This OpenCode Go model is not configured by the deployment.");

    expect(capturedRequests).toHaveLength(0);
  });
});
