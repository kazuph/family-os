import { describe, expect, it } from "vitest";
import { DEFAULT_CHAT_TITLE, normalizeChatTitle } from "@gadgets/workshop-shared/api";
import { assertAdultFamilyProfile } from "../src/family.js";
import {
  allowedSpawnedAgentTools,
  assertAgentChatTitle,
  CHAT_TITLE_AGENT_INSTRUCTIONS,
  CHAT_TITLE_LENGTH_GUIDANCE,
} from "../src/agent.js";

describe("normalizeChatTitle", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeChatTitle("  明日の買い物  リスト  ")).toBe("明日の買い物 リスト");
  });

  it("rejects empty, whitespace-only, and control-only titles", () => {
    expect(() => normalizeChatTitle("")).toThrow("non-empty");
    expect(() => normalizeChatTitle("   ")).toThrow("non-empty");
    expect(() => normalizeChatTitle("\n\t")).toThrow("non-empty");
  });

  it("keeps a Japanese title without inventing a length cap", () => {
    expect(normalizeChatTitle("明日の買い物リスト")).toBe("明日の買い物リスト");
  });
});

describe("assertAgentChatTitle", () => {
  it("rejects the default placeholder so the agent cannot no-op rename", () => {
    expect(() => assertAgentChatTitle(DEFAULT_CHAT_TITLE)).toThrow(DEFAULT_CHAT_TITLE);
    expect(() => assertAgentChatTitle(`  ${DEFAULT_CHAT_TITLE}  `)).toThrow(DEFAULT_CHAT_TITLE);
  });

  it("accepts a specific title in the conversation language", () => {
    expect(assertAgentChatTitle("週末の遠足")).toBe("週末の遠足");
  });
});

describe("setChatTitle agent policy", () => {
  it("tells the primary agent to name New Chat, retitle on subject change, and match language", () => {
    expect(CHAT_TITLE_LENGTH_GUIDANCE).toBe("2-8 words");
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain("setChatTitle");
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain(DEFAULT_CHAT_TITLE);
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain("first user message");
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain("subject clearly changes");
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain("Japanese");
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).toContain(CHAT_TITLE_LENGTH_GUIDANCE);
    expect(CHAT_TITLE_AGENT_INSTRUCTIONS).not.toMatch(/adult/i);
  });

  it("does not give spawned sub-agents the chat-rename capability", () => {
    expect(allowedSpawnedAgentTools(false)).toEqual(new Set(["describeBinding", "executeCode"]));
    expect(allowedSpawnedAgentTools(true)).toEqual(
        new Set(["describeBinding", "executeCode", "giveUp"]));
    expect(allowedSpawnedAgentTools(false).has("setChatTitle")).toBe(false);
    expect(allowedSpawnedAgentTools(true).has("setChatTitle")).toBe(false);
  });

  it("does not treat chat rename as an adult-only Family action", () => {
    expect(() => assertAdultFamilyProfile(false)).not.toThrow();
  });
});
