import { AiChatAuthorInfo, AiModelConfig, SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";

/** The default, cheaper/faster model exposed by the deployment-managed OpenCode Go subscription. */
export const OPENCODE_GO_FLASH_MODEL_ID = "deepseek-v4-flash";

/**
 * The stronger reasoning model exposed by the same OpenCode Go subscription. Available for a
 * user to select directly, and for a Flash-run agent to consult via the `consultPro` tool (see
 * agent.ts) -- Pro is never itself given that tool, so consultation cannot recurse.
 */
export const OPENCODE_GO_PRO_MODEL_ID = "deepseek-v4-pro";

// Deployment-managed OpenCode Go models, in picker order (Flash first: it's the default).
const OPENCODE_GO_MODEL_IDS = [
  OPENCODE_GO_FLASH_MODEL_ID,
  OPENCODE_GO_PRO_MODEL_ID,
  "glm-5.3",
  "glm-5.3-flash",
  "kimi-k3",
] as const;

export type OpenCodeGoModelId = typeof OPENCODE_GO_MODEL_IDS[number];

/** Whether `id` names one of the models this deployment's OpenCode Go subscription serves. */
export function isOpenCodeGoModelId(id: string): id is OpenCodeGoModelId {
  return (OPENCODE_GO_MODEL_IDS as readonly string[]).includes(id);
}

/**
 * Whether `model` is DeepSeek V4 Flash specifically (as opposed to another OpenCode Go model, or
 * a model from another provider entirely). Used to gate `consultPro` onto DeepSeek Flash turns.
 */
export function isOpenCodeGoFlashModel(model: {provider: string, id: string}): boolean {
  return model.provider === "opencode-go" && model.id === OPENCODE_GO_FLASH_MODEL_ID;
}

/** OpenAI-compatible API base for OpenCode Go models. */
export const OPENCODE_GO_BASE_URL = "https://opencode.ai/zen/go/v1";

/**
 * Return one deployment-managed OpenCode Go model when its secret is configured. Defaults to
 * Flash (the model chats start on) when `modelId` is omitted.
 */
export function getOpenCodeGoModel(env: Cloudflare.Env, modelId: OpenCodeGoModelId = OPENCODE_GO_FLASH_MODEL_ID): {
  profile: AiChatAuthorInfo;
  config: AiModelConfig;
} | undefined {
  if (!env.OPENCODE_GO_API_TOKEN) return undefined;
  const suggested = SUGGESTED_MODELS["opencode-go"][modelId];
  return {
    profile: {
      type: "agent",
      id: modelId,
      name: suggested.name,
      managedByDeployment: true,
    },
    config: { provider: "opencode-go", model: modelId, apiToken: "" },
  };
}

/** List OpenCode Go models in deployment-default picker order. */
export function listOpenCodeGoModels(env: Cloudflare.Env): AiChatAuthorInfo[] {
  if (!env.OPENCODE_GO_API_TOKEN) return [];
  return OPENCODE_GO_MODEL_IDS.map(id => getOpenCodeGoModel(env, id)!.profile);
}
