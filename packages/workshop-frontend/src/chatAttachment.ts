/**
 * Sniff the magic number of a clipboard paste arriving without a MIME type (empty File.type),
 * which the upload would otherwise reject as octet-stream. Returns the image MIME type so
 * screenshots still take the image pipeline; unrecognized bytes yield undefined and stay a
 * generic file.
 */
export function sniffPastedImageMimeType(header: Uint8Array): string | undefined {
  if (
    header.length >= 8 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e &&
    header[3] === 0x47 && header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return "image/png";
  }
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    header.length >= 12 && header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 &&
    header[3] === 0x46 && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    header.length >= 6 && header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 &&
    header[3] === 0x38 && (header[4] === 0x37 || header[4] === 0x39) && header[5] === 0x61
  ) {
    return "image/gif";
  }
  return undefined;
}

