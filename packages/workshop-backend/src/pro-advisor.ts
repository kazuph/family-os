// DeepSeek V4 Pro advisor: lets a Flash-run agent (see agent.ts's `consultPro` tool) ask the
// stronger reasoning model on the same OpenCode Go deployment subscription for a second opinion
// on a difficult problem.
//
// This is a single one-shot completion, never a nested agent turn: Pro sees only the question and
// (optional) context the calling agent explicitly passes here -- never the chat history, files, or
// other tool results -- and it is given no tools at all. That structurally guarantees Pro cannot
// itself call `consultPro` (there is no tool loop for it to be part of, let alone one that offers
// the tool), so advisor consultation cannot recurse.

import type { AiChatAuthorInfo } from "@gadgets/workshop-shared/api";
import { getModel } from "./ai-models.js";
import { completeText } from "./ai-invoke.js";
import { OPENCODE_GO_PRO_MODEL_ID } from "./opencode-go.js";

export type ProAdvisorInput = {
  /** The specific question to ask Pro. */
  question: string;
  /** Relevant background Pro needs to answer well. Pro sees only this and `question`. */
  context?: string;
};

const PRO_ADVISOR_SYSTEM_PROMPT = `
You are DeepSeek V4 Pro, acting as an advisor to another AI agent (DeepSeek V4 Flash) that is
helping a user build a small personal application called a "Gadget" on the Family OS platform.
Flash consulted you because it judged the current problem difficult, high-risk, or a case where
it wasn't confident in its own answer -- reason it through carefully.

You were given only the question and context Flash chose to include below; you have no access to
the chat history, files, or any other tool. You cannot call tools, browse the web, or edit files
yourself. Answer with your best reasoning and a clear recommendation; Flash will read your reply
as advice and decide how to act on it, not as an instruction it must follow verbatim.
`.trim();

/**
 * Ask DeepSeek V4 Pro a one-shot question, with extended thinking enabled (unlike the other
 * one-shot `completeText` callers, which want quick answers, this call is specifically for
 * problems worth Pro's deeper reasoning).
 *
 * Throws if OpenCode Go isn't configured for this deployment (mirrors getModel's own error for
 * the primary chat model), or the request otherwise fails.
 */
export async function consultProAdvisor(
  env: Cloudflare.Env,
  initiator: AiChatAuthorInfo,
  input: ProAdvisorInput,
  signal?: AbortSignal,
): Promise<string> {
  const handle = getModel(
    env,
    { provider: "opencode-go", model: OPENCODE_GO_PRO_MODEL_ID, apiToken: "" },
    initiator,
  );

  const prompt = input.context
    ? `Context:\n${input.context}\n\nQuestion:\n${input.question}`
    : input.question;

  return completeText(handle, {
    systemPrompt: PRO_ADVISOR_SYSTEM_PROMPT,
    prompt,
    thinking: true,
    signal,
  });
}
