import { describe, expect, it } from "vitest";
import { SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";
import {
  getOpenCodeGoModel,
  getOpenCodeGoMetadata,
  listOpenCodeGoModelIds,
  isOpenCodeGoFlashModel,
  isOpenCodeGoModelId,
  listOpenCodeGoModels,
  OPENCODE_GO_FLASH_MODEL_ID,
  OPENCODE_GO_PRO_MODEL_ID,
} from "../src/opencode-go.js";

describe("listOpenCodeGoModels", async () => {
  it("lists every supported model in picker order when the deployment secret exists", async () => {
    const models = await listOpenCodeGoModels({
      OPENCODE_GO_API_TOKEN: "deployment-token",
    } as Cloudflare.Env);

    const response = await fetch("https://opencode.ai/zen/go/v1/models");
    const payload = await response.json() as { data: { id: string }[] };
    expect(models.map(model => model.id).toSorted()).toEqual(payload.data.map(model => model.id).toSorted());
    expect(models[0].id).toBe(OPENCODE_GO_FLASH_MODEL_ID);
    expect(models.every(model => model.managedByDeployment)).toBe(true);
    expect(models.some(model => model.id === "muse-spark-1.3-contributor")).toBe(true);
  });

  it("does not list OpenCode Go without the deployment secret", async () => {
    expect(await listOpenCodeGoModels({} as Cloudflare.Env)).toEqual([]);
  });
});

describe("OpenCode Go suggested model limits", async () => {
  it("uses the published context and output limits for the additional models", async () => {
    expect(SUGGESTED_MODELS["opencode-go"]["glm-5.3"]).toEqual({
      name: "GLM-5.3 (OpenCode Go)", contextWindow: 1_000_000, outputLimit: 131_072,
    });
    expect(SUGGESTED_MODELS["opencode-go"]["glm-5.3-flash"]).toEqual({
      name: "GLM-5.3 Flash (OpenCode Go)", contextWindow: 1_000_000, outputLimit: 131_072,
      input: ["text", "image"],
    });
    expect(SUGGESTED_MODELS["opencode-go"]["kimi-k3"]).toEqual({
      name: "Kimi K3 (OpenCode Go)", contextWindow: 1_048_576, outputLimit: 131_072,
      input: ["text", "image"],
    });
  });
});

describe("getOpenCodeGoModel", async () => {
  it("defaults to Flash when no model id is given", async () => {
    const model = await getOpenCodeGoModel({ OPENCODE_GO_API_TOKEN: "token" } as Cloudflare.Env);
    expect(model?.profile.id).toBe(OPENCODE_GO_FLASH_MODEL_ID);
    expect(model?.config).toEqual({
      provider: "opencode-go", model: OPENCODE_GO_FLASH_MODEL_ID, apiToken: "",
    });
  });

  it("returns Pro when explicitly requested", async () => {
    const model = await getOpenCodeGoModel(
      { OPENCODE_GO_API_TOKEN: "token" } as Cloudflare.Env, OPENCODE_GO_PRO_MODEL_ID);
    expect(model?.profile).toEqual({
      type: "agent", id: OPENCODE_GO_PRO_MODEL_ID,
      name: "DeepSeek V4 Pro (OpenCode Go)", managedByDeployment: true,
    });
    expect(model?.config).toEqual({
      provider: "opencode-go", model: OPENCODE_GO_PRO_MODEL_ID, apiToken: "",
    });
  });

  it("is undefined without the deployment secret", async () => {
    expect(await getOpenCodeGoModel({} as Cloudflare.Env)).toBeUndefined();
    expect(await getOpenCodeGoModel({} as Cloudflare.Env, OPENCODE_GO_PRO_MODEL_ID)).toBeUndefined();
  });
});

describe("isOpenCodeGoModelId", async () => {
  it("accepts every model shown in the picker", async () => {
    expect(await isOpenCodeGoModelId(OPENCODE_GO_FLASH_MODEL_ID)).toBe(true);
    expect(await isOpenCodeGoModelId(OPENCODE_GO_PRO_MODEL_ID)).toBe(true);
    expect(await isOpenCodeGoModelId("glm-5.3")).toBe(true);
    expect(await isOpenCodeGoModelId("glm-5.3-flash")).toBe(true);
    expect(await isOpenCodeGoModelId("kimi-k3")).toBe(true);
  });

  it("rejects any other model id, including plausible-looking ones", async () => {
    expect(await isOpenCodeGoModelId("deepseek-v4")).toBe(false);
    expect(await isOpenCodeGoModelId("deepseek-v4-flash-free")).toBe(false);
    expect(await isOpenCodeGoModelId("claude-sonnet-5")).toBe(false);
    expect(await isOpenCodeGoModelId("")).toBe(false);
  });
});

describe("isOpenCodeGoFlashModel", async () => {
  it("is true only for the opencode-go Flash id", async () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: OPENCODE_GO_FLASH_MODEL_ID }))
        .toBe(true);
  });

  it("is false for Pro on the same provider", async () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: OPENCODE_GO_PRO_MODEL_ID }))
        .toBe(false);
  });

  it("is false for the additional OpenCode Go models", async () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "glm-5.3" })).toBe(false);
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "glm-5.3-flash" })).toBe(false);
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "kimi-k3" })).toBe(false);
  });

  it("is false for a different provider even if the id happens to match", async () => {
    expect(isOpenCodeGoFlashModel({ provider: "anthropic", id: OPENCODE_GO_FLASH_MODEL_ID }))
        .toBe(false);
  });
});


describe("live OpenCode Go routing catalog", () => {
  it.each([
    ["muse-spark-1.3-contributor", "openai-responses"],
    ["minimax-m3", "anthropic-messages"],
    ["glm-5.3", "openai-completions"],
  ])("resolves %s to its published native protocol", async (id, api) => {
    const resolved = await getOpenCodeGoMetadata(id);
    expect(resolved.api).toBe(api);
    expect(resolved.metadata?.limit.context).toBeGreaterThan(0);
    expect(resolved.metadata?.limit.output).toBeGreaterThan(0);
  });

  it("resolves every live Go model without a deployment allowlist", async () => {
    const ids = await listOpenCodeGoModelIds();
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const resolved = await getOpenCodeGoMetadata(id);
      expect(["openai-responses", "anthropic-messages", "openai-completions"])
        .toContain(resolved.api);
    }
  }, 60000);
});
