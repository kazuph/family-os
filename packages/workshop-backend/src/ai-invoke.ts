import type { Message, Usage } from "@earendil-works/pi-ai";
import type { ModelHandle } from "./ai-models.js";

/**
 * An all-zeros pi Usage record, for synthesizing assistant messages that were never actually
 * produced by a live model call (chat-history replay, compaction prompts).
 */
export function zeroUsage(): Usage {
  return {
    input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

/**
 * A failed model request, thrown by completeText() and the agent turn loop. pi never throws for
 * provider failures -- it reports them as a final assistant message with stopReason "error" --
 * so this converts that shape back into an exception for callers that expect one (the overseer's
 * turn error triage and the one-shot completion helpers).
 */
export class AgentTurnError extends Error {
  /** HTTP status of the failing request, when the handle observed a response for it. */
  readonly statusCode?: number;

  /** Text received before the provider failed, retained for the user but never replayed. */
  readonly partialResponse?: string;

  constructor(message: string, statusCode?: number, partialResponse?: string) {
    super(message);
    this.statusCode = statusCode;
    this.partialResponse = partialResponse;
  }
}

/** Convert pi's missing-terminal-event error into an actionable user-facing explanation. */
export function explainIncompleteStream(errorMessage: string, hasToolCalls: boolean,
                                        hasPartialResponse: boolean): string {
  if (!errorMessage.includes("Stream ended without finish_reason")) return errorMessage;
  const retained = hasPartialResponse
    ? "The partial text received before the disconnect is preserved below. "
    : "";
  const protectedFiles = hasToolCalls ? "Incomplete tool calls and file edits were not applied. " : "";
  return "The model provider closed the stream without a completion marker. " + retained +
      protectedFiles + "Retry the request to continue.";
}

/**
 * Best-effort HTTP status extraction for a failed request. pi reports provider failures as
 * error text only, and its onResponse callback never fires for a request the SDK failed (so
 * ModelHandle.lastResponse is unset then) -- but the provider SDKs' error messages conventionally
 * begin with the status code (e.g. "400 {...}"), which is enough for the overseer's triage
 * (report 5xx/unknown, skip expected 4xx).
 */
export function httpStatusFromError(errorMessage: string, handle: ModelHandle)
    : number | undefined {
  const match = /^(\d{3})\b/.exec(errorMessage.trim());
  if (match) return Number(match[1]);
  return handle.lastResponse?.status;
}

/**
 * Run a single non-streaming-style completion against a ModelHandle and return the response
 * text. Used for one-shot calls: title generation, binding naming, compaction summaries,
 * LanguageModelBinding.run, and the `consultPro` advisor tool. Requests thinking off by default
 * (most one-shots should be quick, and don't benefit from extended thinking; pre-pi, these calls
 * never configured thinking either) -- pass `thinking: true` for a call that specifically wants
 * the model to reason before answering (e.g. a difficult advisor question).
 * Throws AgentTurnError on provider failure, or the abort reason when `signal` fired.
 */
export async function completeText(handle: ModelHandle, args: {
  systemPrompt?: string;
  // Convenience: wraps into a single user message. Exactly one of `prompt`/`messages` required.
  prompt?: string;
  messages?: Message[];
  maxTokens?: number;
  signal?: AbortSignal;
  thinking?: boolean;
}): Promise<string> {
  const messages: Message[] = args.messages ??
      [{ role: "user", content: args.prompt ?? "", timestamp: Date.now() }];
  const stream = await handle.stream(handle.model, {
    systemPrompt: args.systemPrompt,
    messages,
  }, {
    maxTokens: args.maxTokens,
    signal: args.signal,
    thinking: args.thinking ?? false,
  });
  const message = await stream.result();
  if (message.stopReason === "error" || message.stopReason === "aborted") {
    // Surface a cancellation as the abort reason, like a directly-aborted request would.
    args.signal?.throwIfAborted();
    const errorMessage = message.errorMessage ?? "The model request failed.";
    throw new AgentTurnError(errorMessage, httpStatusFromError(errorMessage, handle));
  }
  return message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("");
}
