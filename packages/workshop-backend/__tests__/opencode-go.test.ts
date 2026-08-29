import { describe, expect, it } from "vitest";
import { SUGGESTED_MODELS } from "@gadgets/workshop-shared/api";
import {
  getOpenCodeGoModel,
  isOpenCodeGoFlashModel,
  isOpenCodeGoModelId,
  listOpenCodeGoModels,
  OPENCODE_GO_FLASH_MODEL_ID,
  OPENCODE_GO_PRO_MODEL_ID,
} from "../src/opencode-go.js";

describe("listOpenCodeGoModels", () => {
  it("lists every supported model in picker order when the deployment secret exists", () => {
    const models = listOpenCodeGoModels({
      OPENCODE_GO_API_TOKEN: "deployment-token",
    } as Cloudflare.Env);

    expect(models).toEqual([
      {
        type: "agent",
        id: OPENCODE_GO_FLASH_MODEL_ID,
        name: "DeepSeek V4 Flash (OpenCode Go)",
        managedByDeployment: true,
      },
      {
        type: "agent",
        id: OPENCODE_GO_PRO_MODEL_ID,
        name: "DeepSeek V4 Pro (OpenCode Go)",
        managedByDeployment: true,
      },
      {
        type: "agent",
        id: "glm-5.3",
        name: "GLM-5.3 (OpenCode Go)",
        managedByDeployment: true,
      },
      {
        type: "agent",
        id: "glm-5.3-flash",
        name: "GLM-5.3 Flash (OpenCode Go)",
        managedByDeployment: true,
      },
      {
        type: "agent",
        id: "kimi-k3",
        name: "Kimi K3 (OpenCode Go)",
        managedByDeployment: true,
      },
    ]);
  });

  it("does not list OpenCode Go without the deployment secret", () => {
    expect(listOpenCodeGoModels({} as Cloudflare.Env)).toEqual([]);
  });
});

describe("OpenCode Go suggested model limits", () => {
  it("uses the published context and output limits for the additional models", () => {
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

describe("getOpenCodeGoModel", () => {
  it("defaults to Flash when no model id is given", () => {
    const model = getOpenCodeGoModel({ OPENCODE_GO_API_TOKEN: "token" } as Cloudflare.Env);
    expect(model?.profile.id).toBe(OPENCODE_GO_FLASH_MODEL_ID);
    expect(model?.config).toEqual({
      provider: "opencode-go", model: OPENCODE_GO_FLASH_MODEL_ID, apiToken: "",
    });
  });

  it("returns Pro when explicitly requested", () => {
    const model = getOpenCodeGoModel(
      { OPENCODE_GO_API_TOKEN: "token" } as Cloudflare.Env, OPENCODE_GO_PRO_MODEL_ID);
    expect(model?.profile).toEqual({
      type: "agent", id: OPENCODE_GO_PRO_MODEL_ID,
      name: "DeepSeek V4 Pro (OpenCode Go)", managedByDeployment: true,
    });
    expect(model?.config).toEqual({
      provider: "opencode-go", model: OPENCODE_GO_PRO_MODEL_ID, apiToken: "",
    });
  });

  it("is undefined without the deployment secret", () => {
    expect(getOpenCodeGoModel({} as Cloudflare.Env)).toBeUndefined();
    expect(getOpenCodeGoModel({} as Cloudflare.Env, OPENCODE_GO_PRO_MODEL_ID)).toBeUndefined();
  });
});

describe("isOpenCodeGoModelId", () => {
  it("accepts every model shown in the picker", () => {
    expect(isOpenCodeGoModelId(OPENCODE_GO_FLASH_MODEL_ID)).toBe(true);
    expect(isOpenCodeGoModelId(OPENCODE_GO_PRO_MODEL_ID)).toBe(true);
    expect(isOpenCodeGoModelId("glm-5.3")).toBe(true);
    expect(isOpenCodeGoModelId("glm-5.3-flash")).toBe(true);
    expect(isOpenCodeGoModelId("kimi-k3")).toBe(true);
  });

  it("rejects any other model id, including plausible-looking ones", () => {
    expect(isOpenCodeGoModelId("deepseek-v4")).toBe(false);
    expect(isOpenCodeGoModelId("deepseek-v4-flash-free")).toBe(false);
    expect(isOpenCodeGoModelId("claude-sonnet-5")).toBe(false);
    expect(isOpenCodeGoModelId("")).toBe(false);
  });
});

describe("isOpenCodeGoFlashModel", () => {
  it("is true only for the opencode-go Flash id", () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: OPENCODE_GO_FLASH_MODEL_ID }))
        .toBe(true);
  });

  it("is false for Pro on the same provider", () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: OPENCODE_GO_PRO_MODEL_ID }))
        .toBe(false);
  });

  it("is false for the additional OpenCode Go models", () => {
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "glm-5.3" })).toBe(false);
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "glm-5.3-flash" })).toBe(false);
    expect(isOpenCodeGoFlashModel({ provider: "opencode-go", id: "kimi-k3" })).toBe(false);
  });

  it("is false for a different provider even if the id happens to match", () => {
    expect(isOpenCodeGoFlashModel({ provider: "anthropic", id: OPENCODE_GO_FLASH_MODEL_ID }))
        .toBe(false);
  });
});
