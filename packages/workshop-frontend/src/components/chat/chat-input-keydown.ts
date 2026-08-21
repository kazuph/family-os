import { isImeComposing } from "../../keyboardEvent";

export type ChatInputKeyEvent = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "isComposing" | "keyCode"
>;

export function isImeCompositionEvent(event: ChatInputKeyEvent): boolean {
  return isImeComposing(event);
}

export function shouldSubmitChatInput(event: ChatInputKeyEvent): boolean {
  return event.key === "Enter" && !event.shiftKey && !isImeCompositionEvent(event);
}
