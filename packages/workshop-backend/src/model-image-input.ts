import type { ImageContent } from "@earendil-works/pi-ai";

/** Maximum browser verification screenshots sent back into one model response. */
export const MAX_BROWSER_VERIFY_MODEL_IMAGES_PER_RESPONSE = 2;

/** Whether a resolved model descriptor declares that it accepts image content. */
export function modelSupportsImageInput(model: { input: readonly string[] }): boolean {
  return model.input.includes("image");
}

/** Builds the same pi image content used for uploaded images, or omits it for text-only models. */
export function imageContentForModel(
  model: { input: readonly string[] },
  data: string,
  mimeType: string,
): ImageContent | undefined {
  return modelSupportsImageInput(model) ? { type: "image", data, mimeType } : undefined;
}

/** Builds a browser screenshot image while enforcing the per-response visual feedback cap. */
export function browserVerifyImageContentForModel(
  model: { input: readonly string[] },
  imagesAlreadyAttached: number,
  readData: () => string,
): ImageContent | undefined {
  if (imagesAlreadyAttached >= MAX_BROWSER_VERIFY_MODEL_IMAGES_PER_RESPONSE) return undefined;
  if (!modelSupportsImageInput(model)) return undefined;
  return { type: "image", data: readData(), mimeType: "image/png" };
}

/** Model-specific system instruction for visual or text-only browser verification. */
export function browserVerifyModelInstruction(model: { input: readonly string[] }): string {
  return modelSupportsImageInput(model)
    ? `Your current model accepts images. browserVerify returns its first ` +
      `${MAX_BROWSER_VERIFY_MODEL_IMAGES_PER_RESPONSE} screenshots in this response as image ` +
      `content. Inspect each supplied screenshot visually for clipping, unexpected blank space, ` +
      `overlap, illegible or garbled text, broken hierarchy, and other layout defects that the ` +
      `structured diagnostics cannot detect. Describe concrete visible evidence, not merely the ` +
      `DOM counts, before declaring the UI verified.`
    : `Your current model does not accept images. browserVerify omits screenshot image content ` +
      `from your model input while still saving it for the user. Rely on the structured DOM, ` +
      `image-load, console, page-error, and canvas diagnostics; do not claim to have seen the ` +
      `screenshot.`;
}
