import type { AiChatAuthorInfo } from "@gadgets/workshop-shared/api";

// Household preferences, in the order requested by the deployment owner.
const RECOMMENDED_MODEL_IDS = ["glm-5.3-flash", "muse-spark-1.3-contributor", "kimi-k3"];

/** Classify picker entries without changing saved model IDs or agent names. */
export function modelPickerKind(model: AiChatAuthorInfo): "recommended" | "alpha" | "other" {
  if (RECOMMENDED_MODEL_IDS.includes(model.id)) return "recommended";
  if (/(?:^|[-_])alpha(?:[-_]|$)/i.test(model.id)) return "alpha";
  return "other";
}

/** Add the requested visual markers only to picker labels. */
export function modelPickerLabel(model: AiChatAuthorInfo): string {
  const kind = modelPickerKind(model);
  return `${kind === "recommended" ? "★ " : kind === "alpha" ? "🧪 " : ""}${model.name}`;
}

/** Group display choices while preserving the input order used for default selection. */
export function modelPickerGroups(models: AiChatAuthorInfo[]) {
  const recommended = models.filter(model => modelPickerKind(model) === "recommended")
    .toSorted((a, b) => RECOMMENDED_MODEL_IDS.indexOf(a.id) - RECOMMENDED_MODEL_IDS.indexOf(b.id));
  return [
    { kind: "recommended" as const, models: recommended },
    { kind: "alpha" as const, models: models.filter(model => modelPickerKind(model) === "alpha") },
    { kind: "other" as const, models: models.filter(model => modelPickerKind(model) === "other") },
  ].filter(group => group.models.length > 0);
}
