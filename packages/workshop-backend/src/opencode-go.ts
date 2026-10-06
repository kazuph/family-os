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

/** HTTP origins used by the Go catalog; tests inject a real local HTTP server. */
export interface OpenCodeGoCatalogSource {
  modelsUrl: string;
  metadataUrl: string;
}

/** The production provider's public catalog endpoints (no credentials are sent). */
export const OPEN_CODE_GO_CATALOG: OpenCodeGoCatalogSource = {
  modelsUrl: `${OPENCODE_GO_BASE_URL}/models`,
  metadataUrl: "https://models.dev/api.json",
};

// Match Workshop's existing outbound HTTP deadline in web-fetch.ts (FETCH_TIMEOUT_MS).
// This bounds catalog stalls without adding a freshness TTL.
const CATALOG_FETCH_TIMEOUT_MS = 30_000;
const knownModelIds = new WeakMap<OpenCodeGoCatalogSource, Set<string>>();

/** Recognize deployment Go IDs already advertised, without contacting the network. */
export function isKnownOpenCodeGoModelId(id: string, source = OPEN_CODE_GO_CATALOG): boolean {
  return Object.hasOwn(SUGGESTED_MODELS["opencode-go"], id) ||
    (knownModelIds.get(source)?.has(id) ?? false);
}

// User-requested picker exclusions: these catalog entries were rejected by Go's upstream.
const UNAVAILABLE_MODEL_IDS = new Set([
  "hy3-preview", "kimi-k2.5", "mimo-v2-pro", "mimo-v2-omni",
]);

const modelListSchema = z.object({ data: z.array(z.object({ id: z.string().min(1) })) });
const providerMetadataSchema = z.object({
  npm: z.string(),
  models: z.record(z.string(), z.object({
    name: z.string(),
    reasoning: z.boolean(),
    modalities: z.object({ input: z.array(z.string()) }),
    limit: z.object({ context: z.number().positive(), output: z.number().positive() }),
    provider: z.object({ npm: z.string() }).optional(),
  })),
});
const metadataSchema = z.object({
  "opencode-go": providerMetadataSchema,
  opencode: providerMetadataSchema.optional(),
});

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`OpenCode Go catalog request failed (${response.status}).`);
  return response.json();
}

/** Read Go's live availability list; never include models offered only by Zen. */
export async function listOpenCodeGoModelIds(source = OPEN_CODE_GO_CATALOG): Promise<string[]> {
  const { data } = modelListSchema.parse(await readJson(source.modelsUrl));
  const ids = new Set(data.map(model => model.id));
  knownModelIds.set(source, ids);
  return [...ids];
}

/** Check membership against the provider's current Go catalog. */
export async function isOpenCodeGoModelId(id: string, source = OPEN_CODE_GO_CATALOG): Promise<boolean> {
  return (await listOpenCodeGoModelIds(source)).includes(id);
}

// Cache parsed data only; every use revalidates with the origin, without an invented TTL.
const metadataCaches = new WeakMap<OpenCodeGoCatalogSource, { etag: string; catalog: z.infer<typeof metadataSchema> }>();

async function readMetadata(source: OpenCodeGoCatalogSource) {
  const metadataCache = metadataCaches.get(source);
  const response = await fetch(source.metadataUrl, {
    signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS),
    headers: metadataCache ? { "If-None-Match": metadataCache.etag } : {},
  });
  if (response.status === 304 && metadataCache) return metadataCache.catalog;
  if (!response.ok) throw new Error(`OpenCode Go metadata request failed (${response.status}).`);
  const catalog = metadataSchema.parse(await response.json());
  const etag = response.headers.get("etag");
  if (etag) metadataCaches.set(source, { etag, catalog });
  return catalog;
}

/** Resolve current routing and limits from OpenCode's models.dev catalog. */
export async function getOpenCodeGoMetadata(id: string, source = OPEN_CODE_GO_CATALOG) {
  const [ids, catalog] = await Promise.all([
    listOpenCodeGoModelIds(source), readMetadata(source),
  ]);
  if (!ids.includes(id)) throw new Error("This OpenCode Go model is not configured by the deployment.");
  // Some Go-available models are described only in OpenCode's shared metadata. Availability
  // remains gated above by Go's endpoint; this never adds Zen-only models or uses a Zen token.
  const metadata = catalog["opencode-go"].models[id] ?? catalog.opencode?.models[id];
  const npm = metadata?.provider?.npm ?? catalog["opencode-go"].npm;
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
export async function getOpenCodeGoModel(env: Cloudflare.Env, modelId: string = OPENCODE_GO_FLASH_MODEL_ID, source = OPEN_CODE_GO_CATALOG): Promise<{
  profile: AiChatAuthorInfo;
  config: AiModelConfig;
} | undefined> {
  if (!env.OPENCODE_GO_API_TOKEN) return undefined;
  if (!isKnownOpenCodeGoModelId(modelId, source) && !await isOpenCodeGoModelId(modelId, source)) return undefined;
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
export async function listOpenCodeGoModels(env: Cloudflare.Env, source = OPEN_CODE_GO_CATALOG): Promise<AiChatAuthorInfo[]> {
  if (!env.OPENCODE_GO_API_TOKEN) return [];
  let ids: string[];
  try {
    ids = (await listOpenCodeGoModelIds(source)).filter(id => !UNAVAILABLE_MODEL_IDS.has(id));
  } catch (error) {
    console.warn("OpenCode Go catalog unavailable; other providers remain available.", error);
    return [];
  }
  // Preserve the existing default without constraining which new models can appear.
  ids.sort((a, b) => Number(b === OPENCODE_GO_FLASH_MODEL_ID) - Number(a === OPENCODE_GO_FLASH_MODEL_ID));
  return ids.map(id => ({
    type: "agent", id,
    name: SUGGESTED_MODELS["opencode-go"][id]?.name ?? `${id} (OpenCode Go)`,
    managedByDeployment: true,
  }));
}
