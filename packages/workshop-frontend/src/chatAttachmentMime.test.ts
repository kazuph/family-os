import { describe, expect, it } from "vitest";
import { sniffPastedImageMimeType } from "./ChatInterface";

describe("sniffPastedImageMimeType", () => {
  it("identifies PNG screenshots", () => {
    expect(sniffPastedImageMimeType(new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]))).toBe("image/png");
  });

  it("identifies JPEG bytes", () => {
    expect(sniffPastedImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])))
      .toBe("image/jpeg");
  });

  it("identifies WebP bytes", () => {
    expect(sniffPastedImageMimeType(new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]))).toBe("image/webp");
  });

  it("identifies GIF bytes", () => {
    expect(sniffPastedImageMimeType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])))
      .toBe("image/gif");
  });

  it("returns undefined for non-image or truncated headers", () => {
    expect(sniffPastedImageMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])))
      .toBeUndefined();
    expect(sniffPastedImageMimeType(new Uint8Array([0x89, 0x50]))).toBeUndefined();
    expect(sniffPastedImageMimeType(new Uint8Array([]))).toBeUndefined();
  });
});
