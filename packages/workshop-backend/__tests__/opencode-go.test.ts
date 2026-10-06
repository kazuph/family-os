import { describe, expect, it } from "vitest";
import { SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";
import {
  getOpenCodeGoModel,
  isOpenCodeGoFlashModel,
  listOpenCodeGoModels,
  OPENCODE_GO_FLASH_MODEL_ID,
  OPENCODE_GO_PRO_MODEL_ID,
} from "../src/opencode-go.js";

describe("listOpenCodeGoModels", async () => {
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
    });
    expect(SUGGESTED_MODELS["opencode-go"]["kimi-k3"]).toEqual({
      name: "Kimi K3 (OpenCode Go)", contextWindow: 1_048_576, outputLimit: 131_072,
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
