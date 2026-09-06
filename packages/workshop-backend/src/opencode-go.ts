import { z } from "zod";
import { AiChatAuthorInfo, AiModelConfig, SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";

/** The default, cheaper/faster model exposed by the deployment-managed OpenCode Go subscription. */
export const OPENCODE_GO_FLASH_MODEL_ID = "deepseek-v4-flash";

/**
 * The stronger reasoning model exposed by the same OpenCode Go subscription. Available for a
 * user to select directly, and for a Flash-run agent to consult via the `consultPro` tool (see
 * agent.ts) -- Pro is never itself given that tool, so consultation cannot recurse.
 */
export const OPENCODE_GO_PRO_MODEL_ID = "deepseek-v4-pro";

/** OpenAI-compatible API base for deployment-managed OpenCode Go models. */
export const OPENCODE_GO_BASE_URL = "https://opencode.ai/zen/go/v1";

const modelListSchema = z.object({ data: z.array(z.object({ id: z.string().min(1) })) });
const metadataSchema = z.object({
  "opencode-go": z.object({
    npm: z.string(),
    models: z.record(z.string(), z.object({
      name: z.string(),
      reasoning: z.boolean(),
      modalities: z.object({ input: z.array(z.string()) }),
      limit: z.object({ context: z.number().positive(), output: z.number().positive() }),
      provider: z.object({ npm: z.string() }).optional(),
    })),
  }),
});

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenCode Go catalog request failed (${response.status}).`);
  return response.json();
}

/** Read Go's live availability list; never include models offered only by Zen. */
export async function listOpenCodeGoModelIds(): Promise<string[]> {
  const { data } = modelListSchema.parse(await readJson(`${OPENCODE_GO_BASE_URL}/models`));
  return [...new Set(data.map(model => model.id))];
}

/** Check membership against the provider's current Go catalog. */
export async function isOpenCodeGoModelId(id: string): Promise<boolean> {
  return (await listOpenCodeGoModelIds()).includes(id);
}

// Cache parsed data only; every use revalidates with the origin, without an invented TTL.
let metadataCache: { etag: string; catalog: z.infer<typeof metadataSchema>["opencode-go"] } | undefined;

async function readMetadata() {
  const response = await fetch("https://models.dev/api.json", {
    headers: metadataCache ? { "If-None-Match": metadataCache.etag } : {},
  });
  if (response.status === 304 && metadataCache) return metadataCache.catalog;
  if (!response.ok) throw new Error(`OpenCode Go metadata request failed (${response.status}).`);
  const catalog = metadataSchema.parse(await response.json())["opencode-go"];
  const etag = response.headers.get("etag");
  if (etag) metadataCache = { etag, catalog };
  return catalog;
}

/** Resolve current routing and limits from OpenCode's models.dev catalog. */
export async function getOpenCodeGoMetadata(id: string) {
  const [ids, catalog] = await Promise.all([
    listOpenCodeGoModelIds(), readMetadata(),
  ]);
  if (!ids.includes(id)) throw new Error("This OpenCode Go model is not configured by the deployment.");
  const metadata = catalog.models[id];
  const npm = metadata?.provider?.npm ?? catalog.npm;
  const api = npm === "@ai-sdk/openai" ? "openai-responses"
    : npm === "@ai-sdk/anthropic" ? "anthropic-messages"
    : npm === "@ai-sdk/openai-compatible" ? "openai-completions" : undefined;
  if (!api) throw new Error(`Unsupported OpenCode Go protocol: ${npm}`);
  return { api, metadata } as const;
}

/**
 * Whether `model` is DeepSeek V4 Flash specifically (as opposed to another OpenCode Go model, or
 * a model from another provider entirely). Used to gate `consultPro` onto DeepSeek Flash turns.
 */
export function isOpenCodeGoFlashModel(model: {provider: string, id: string}): boolean {
  return model.provider === "opencode-go" && model.id === OPENCODE_GO_FLASH_MODEL_ID;
}

/**
 * Return one deployment-managed OpenCode Go model when its secret is configured. Defaults to
 * Flash (the model chats start on) when `modelId` is omitted.
 */
export async function getOpenCodeGoModel(env: Cloudflare.Env, modelId: string = OPENCODE_GO_FLASH_MODEL_ID): Promise<{
  profile: AiChatAuthorInfo;
  config: AiModelConfig;
} | undefined> {
  if (!env.OPENCODE_GO_API_TOKEN) return undefined;
  if (!await isOpenCodeGoModelId(modelId)) return undefined;
  const suggested = SUGGESTED_MODELS["opencode-go"][modelId];
  return {
    profile: {
      type: "agent",
      id: modelId,
      name: suggested?.name ?? `${modelId} (OpenCode Go)`,
      managedByDeployment: true,
    },
    config: { provider: "opencode-go", model: modelId, apiToken: "" },
  };
}

/** List OpenCode Go models in deployment-default picker order. */
export async function listOpenCodeGoModels(env: Cloudflare.Env): Promise<AiChatAuthorInfo[]> {
  if (!env.OPENCODE_GO_API_TOKEN) return [];
  const ids = await listOpenCodeGoModelIds();
  // Preserve the existing default without constraining which new models can appear.
  ids.sort((a, b) => Number(b === OPENCODE_GO_FLASH_MODEL_ID) - Number(a === OPENCODE_GO_FLASH_MODEL_ID));
  return ids.map(id => ({
    type: "agent", id,
    name: SUGGESTED_MODELS["opencode-go"][id]?.name ?? `${id} (OpenCode Go)`,
    managedByDeployment: true,
  }));
}
