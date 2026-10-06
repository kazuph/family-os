import { isTextLikeAttachmentMimeType } from "@gadgets/workshop-shared/api";
import type { AiModelConfig, AiModelProvider, ChatAttachmentUpload } from "@gadgets/workshop-shared/api";
import { getOpenCodeGoMetadata, OPEN_CODE_GO_CATALOG } from "./opencode-go";
import { modelApiSupportsPdfAttachments } from "./chat-attachment-pdf";
import type { Api, Model } from "@earendil-works/pi-ai";
import { PDF_MIME_TYPE } from "./chat-attachment-pdf";

// Bounds attachment storage and the bytes replayed into model requests.
const MAX_CHAT_ATTACHMENT_BYTES = 1024 * 1024;

const IMAGE_SIGNATURES = new Map<string, readonly (number | null)[]>([
  ["image/jpeg", [0xFF, 0xD8, 0xFF]],
  ["image/png", [0x89, 0x50, 0x4E, 0x47]],
  ["image/webp", [
    0x52, 0x49, 0x46, 0x46,
    null, null, null, null,
    0x57, 0x45, 0x42, 0x50,
  ]],
]);

// Magic-number prefixes checked at upload. Like the image signatures, the PDF one ("%PDF-")
// only stops mislabeled uploads at the door; nothing here parses the content.
const CONTENT_SIGNATURES = new Map<string, readonly (number | null)[]>([
  ...IMAGE_SIGNATURES,
  [PDF_MIME_TYPE, [0x25, 0x50, 0x44, 0x46, 0x2D]],
]);

const isTextOrImageMime = (mimeType: string) =>
  isTextLikeAttachmentMimeType(mimeType) || IMAGE_SIGNATURES.has(mimeType);

const isTextImageOrPdfMime = (mimeType: string) =>
  isTextOrImageMime(mimeType) || mimeType === PDF_MIME_TYPE;

// pi-ai encodes only text and image content parts, so text + images are universal. PDFs ride an
// image part and are bridged to a provider's native document input where one exists: Gemini takes
// application/pdf inline data as-is, and Anthropic/OpenAI payloads are rewritten in flight (see
// chat-attachment-pdf.ts). Workers AI and Ollama chat endpoints have no document input at all.
const ATTACHMENT_SUPPORT_BY_PROVIDER = {
  "opencode-go": isTextImageOrPdfMime,
  anthropic: isTextImageOrPdfMime,
  openai: isTextImageOrPdfMime,
  google: isTextImageOrPdfMime,
  cloudflare: isTextOrImageMime,
  ollama: isTextOrImageMime,
} satisfies Record<AiModelProvider, (mimeType: string) => boolean>;

function sanitizeChatAttachmentMimeType(mimeType: string | undefined): string {
  if (!mimeType || /[\r\n]/.test(mimeType)) return "application/octet-stream";
  return mimeType.split(";", 1)[0].trim().toLowerCase() || "application/octet-stream";
}

function sanitizeChatAttachmentName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  let result = name.replace(/[\r\n]/g, " ").slice(0, 255).trim();
  return result || undefined;
}

/** Model capabilities relevant to Go attachments, resolved before any storage write. */
export type GoAttachmentCapabilities = Pick<Model<Api>, "input" | "api">;

/** Read the selected Go model's actual capabilities; other providers keep their existing policy. */
export async function getGoAttachmentCapabilities(config?: AiModelConfig, source = OPEN_CODE_GO_CATALOG): Promise<GoAttachmentCapabilities | undefined> {
  if (config?.provider !== "opencode-go") return undefined;
  const { api, metadata } = await getOpenCodeGoMetadata(config.model, source);
  return { api, input: metadata?.modalities.input.includes("image") ? ["text", "image"] : ["text"] };
}

/** Reject an attachment type that the selected provider cannot accept. */
export function assertChatAttachmentSupportedByProvider(
  provider: AiModelProvider | undefined,
  mimeType: string,
  byteLength: number,
  goModel?: GoAttachmentCapabilities,
): void {
  if (byteLength > MAX_CHAT_ATTACHMENT_BYTES) {
    throw new Error("Chat attachment is too large.");
  }

  if (!provider) {
    if (isTextOrImageMime(mimeType)) return;
    throw new Error("Unsupported file type");
  }

  if (provider === "opencode-go") {
    if (isTextLikeAttachmentMimeType(mimeType)) return;
    if (goModel?.input.includes("image") &&
        (IMAGE_SIGNATURES.has(mimeType) ||
          (mimeType === PDF_MIME_TYPE && modelApiSupportsPdfAttachments(goModel.api)))) return;
    throw new Error("The selected OpenCode Go model does not support this attachment type.");
  }
  if (ATTACHMENT_SUPPORT_BY_PROVIDER[provider](mimeType)) return;

  throw new Error("Unsupported file type");
}

/** Normalize and validate attachment bytes before staging them in chat storage. */
export function validateChatAttachmentUpload(
  attachment: ChatAttachmentUpload,
  provider?: AiModelConfig["provider"],
  goModel?: GoAttachmentCapabilities,
): ChatAttachmentUpload {
  attachment.name = sanitizeChatAttachmentName(attachment.name);
  attachment.mimeType = sanitizeChatAttachmentMimeType(attachment.mimeType);
  assertChatAttachmentSupportedByProvider(provider, attachment.mimeType, attachment.content.byteLength, goModel);

  let signature = CONTENT_SIGNATURES.get(attachment.mimeType);
  if (signature) {
    for (let [index, expected] of signature.entries()) {
      if (expected !== null && attachment.content[index] !== expected) {
        throw new Error("Chat attachment content does not match its MIME type.");
      }
    }
  }

  return attachment;
}

/** Whether a MIME type is one of the image encodings Workshop accepts for chat attachments. */
export function isAllowedChatAttachmentImageMimeType(mimeType: string | undefined): boolean {
  return IMAGE_SIGNATURES.has(sanitizeChatAttachmentMimeType(mimeType));
}
