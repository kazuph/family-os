import { AiChatAuthorInfo, AiModelConfig, SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";

/** Model exposed by a deployment-managed OpenCode Go subscription. */
export const OPENCODE_GO_MODEL_ID = "deepseek-v4-flash";

/** OpenAI-compatible API base for OpenCode Go models. */
export const OPENCODE_GO_BASE_URL = "https://opencode.ai/zen/go/v1";

/** Return the deployment-managed OpenCode Go model when its secret is configured. */
export function getOpenCodeGoModel(env: Cloudflare.Env): {
  profile: AiChatAuthorInfo;
  config: AiModelConfig;
} | undefined {
  if (!env.OPENCODE_GO_API_TOKEN) return undefined;
  const suggested = SUGGESTED_MODELS["opencode-go"][OPENCODE_GO_MODEL_ID];
  return {
    profile: {
      type: "agent",
      id: OPENCODE_GO_MODEL_ID,
      name: suggested.name,
      managedByDeployment: true,
    },
    config: { provider: "opencode-go", model: OPENCODE_GO_MODEL_ID, apiToken: "" },
  };
}

/** List OpenCode Go models in deployment-default order. */
export function listOpenCodeGoModels(env: Cloudflare.Env) {
  const model = getOpenCodeGoModel(env);
  return model ? [model.profile] : [];
}
