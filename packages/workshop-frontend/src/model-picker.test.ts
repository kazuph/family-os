// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { AiChatAuthorInfo } from "@gadgets/workshop-shared/api";
import { modelPickerGroups, modelPickerKind, modelPickerLabel } from "./model-picker";
import { getStoredSelectedModel, persistSelectedModel } from "./modelSelection";

const model = (id: string): AiChatAuthorInfo => ({ type: "agent", id, name: id, managedByDeployment: true });

describe("model picker presentation", () => {
  beforeEach(() => localStorage.clear());

  it("pins exactly the three recommendations in the requested order without changing defaults", () => {
    const models = ["deepseek-v4-flash", "kimi-k3", "omen-alpha", "muse-spark-1.3-contributor",
      "glm-5.3", "glm-5.3-flash"].map(model);
    const originalIds = models.map(entry => entry.id);
    const groups = modelPickerGroups(models);
    expect(groups.map(group => group.kind)).toEqual(["recommended", "alpha", "other"]);
    expect(groups[0].models.map(entry => entry.id))
      .toEqual(["glm-5.3-flash", "muse-spark-1.3-contributor", "kimi-k3"]);
    expect(groups[0].models.map(modelPickerLabel)).toEqual([
      "★ glm-5.3-flash", "★ muse-spark-1.3-contributor", "★ kimi-k3",
    ]);
    expect(groups.flatMap(group => group.models).map(entry => entry.id).toSorted())
      .toEqual(originalIds.toSorted());
    expect(models.map(entry => entry.id)).toEqual(originalIds);
    expect(getStoredSelectedModel(models)).toBe("deepseek-v4-flash");
    persistSelectedModel("muse-spark-1.3-contributor");
    expect(getStoredSelectedModel(models)).toBe("muse-spark-1.3-contributor");
    persistSelectedModel(null);
    expect(getStoredSelectedModel(models)).toBeNull();
  });

  it("marks current and newly listed Alpha entries without recommending them", () => {
    for (const id of ["omen-alpha", "future-alpha-free"]) {
      expect(modelPickerKind(model(id))).toBe("alpha");
      expect(modelPickerLabel(model(id))).toBe(`🧪 ${id}`);
    }
    expect(modelPickerKind(model("alphabet-model"))).toBe("other");
    expect(modelPickerLabel(model("glm-5.3"))).toBe("glm-5.3");
  });

  it("omits empty groups and does not insert models absent from the provider list", () => {
    expect(modelPickerGroups([])).toEqual([]);
    expect(modelPickerGroups([model("omen-alpha")]))
      .toEqual([{ kind: "alpha", models: [model("omen-alpha")] }]);
  });
});
