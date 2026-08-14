import { describe, expect, it } from "vitest";
import { listOpenCodeGoModels, OPENCODE_GO_MODEL_ID } from "../src/opencode-go.js";

describe("listOpenCodeGoModels", () => {
  it("lists DeepSeek V4 Flash first when the deployment secret exists", () => {
    const models = listOpenCodeGoModels({
      OPENCODE_GO_API_TOKEN: "deployment-token",
    } as Cloudflare.Env);

    expect(models).toEqual([{
      type: "agent",
      id: OPENCODE_GO_MODEL_ID,
      name: "DeepSeek V4 Flash (OpenCode Go)",
      managedByDeployment: true,
    }]);
  });

  it("does not list OpenCode Go without the deployment secret", () => {
    expect(listOpenCodeGoModels({} as Cloudflare.Env)).toEqual([]);
  });
});
