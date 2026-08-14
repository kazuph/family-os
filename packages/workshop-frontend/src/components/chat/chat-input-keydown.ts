const IME_COMPOSITION_KEY_CODE = 229;

export type ChatInputKeyEvent = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "isComposing" | "keyCode"
>;

export function isImeCompositionEvent(event: ChatInputKeyEvent): boolean {
  return event.isComposing || event.keyCode === IME_COMPOSITION_KEY_CODE;
}

export function shouldSubmitChatInput(event: ChatInputKeyEvent): boolean {
  return event.key === "Enter" && !event.shiftKey && !isImeCompositionEvent(event);
}
