import { describe, expect, it } from "vitest";
import {
  isImeCompositionEvent,
  shouldSubmitChatInput,
  type ChatInputKeyEvent,
} from "./chat-input-keydown";

function keyEvent(overrides: Partial<ChatInputKeyEvent> = {}): ChatInputKeyEvent {
  return {
    key: "Enter",
    shiftKey: false,
    isComposing: false,
    keyCode: 13,
    ...overrides,
  };
}

describe("chat input Enter handling", () => {
  it("submits for a normal Enter", () => {
    expect(shouldSubmitChatInput(keyEvent())).toBe(true);
  });

  it("does not submit for Shift+Enter", () => {
    expect(shouldSubmitChatInput(keyEvent({shiftKey: true}))).toBe(false);
  });

  it("does not submit while IME composition is active", () => {
    const event = keyEvent({isComposing: true});
    expect(isImeCompositionEvent(event)).toBe(true);
    expect(shouldSubmitChatInput(event)).toBe(false);
  });

  it("does not submit for the legacy IME composition key code", () => {
    const event = keyEvent({keyCode: 229});
    expect(isImeCompositionEvent(event)).toBe(true);
    expect(shouldSubmitChatInput(event)).toBe(false);
  });

  it("does not submit for other keys", () => {
    expect(shouldSubmitChatInput(keyEvent({key: "a", keyCode: 65}))).toBe(false);
  });
});
