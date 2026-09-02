import { describe, expect, it } from "vitest";
import {
  browserVerifyImageContentForModel,
  browserVerifyModelInstruction,
  imageContentForModel,
  MAX_BROWSER_VERIFY_MODEL_IMAGES_PER_RESPONSE,
  modelSupportsImageInput,
} from "../src/model-image-input.js";

describe("model image input", () => {
  it("uses the model descriptor as the static image capability source", () => {
    expect(modelSupportsImageInput({ input: ["text", "image"] })).toBe(true);
    expect(modelSupportsImageInput({ input: ["text"] })).toBe(false);
  });

  it("builds pi image content only for image-capable models", () => {
    expect(imageContentForModel(
      { input: ["text", "image"] }, "base64-png", "image/png",
    )).toEqual({ type: "image", data: "base64-png", mimeType: "image/png" });
    expect(imageContentForModel(
      { input: ["text"] }, "base64-png", "image/png",
    )).toBeUndefined();
  });

  it("caps visual feedback at two screenshots in one agent response", () => {
    expect(MAX_BROWSER_VERIFY_MODEL_IMAGES_PER_RESPONSE).toBe(2);
    expect(browserVerifyImageContentForModel(
      { input: ["text", "image"] }, 1, () => "second-image",
    )).toEqual({ type: "image", data: "second-image", mimeType: "image/png" });
    expect(browserVerifyImageContentForModel(
      { input: ["text", "image"] }, 2, () => "third-image",
    )).toBeUndefined();
    expect(browserVerifyImageContentForModel(
      { input: ["text"] }, 0, () => { throw new Error("must stay lazy"); },
    )).toBeUndefined();
  });

  it("tells vision models to inspect pixels and text-only models not to claim sight", () => {
    expect(browserVerifyModelInstruction({ input: ["text", "image"] }))
      .toContain("Inspect each supplied screenshot visually");
    expect(browserVerifyModelInstruction({ input: ["text"] }))
      .toContain("do not claim to have seen the screenshot");
  });
});
