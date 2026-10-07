import type { CodeUpdate } from "./storage-schema/overseer-storage";

/** One storage-safe part of a complete Yjs code snapshot. */
export type CodeSnapshotPart = {
  key: string;
  version: number;
  timestamp: Date;
  index: number;
  partCount: number;
  update: Uint8Array;
};

/** Reassemble all rows for one snapshot, rejecting incomplete or inconsistent data. */
export function joinCodeSnapshotParts(parts: Iterable<CodeSnapshotPart>): CodeUpdate | undefined {
  let sorted = [...parts].toSorted((a, b) => a.index - b.index);
  if (sorted.length === 0) return undefined;

  let first = sorted[0];
  if (sorted.length !== first.partCount || sorted.some((part, index) =>
    part.version !== first.version || part.partCount !== first.partCount || part.index !== index)) {
    throw new Error(`Code snapshot ${first.version} has incomplete or inconsistent parts.`);
  }

  let update = new Uint8Array(sorted.reduce((size, part) => size + part.update.length, 0));
  let offset = 0;
  for (let part of sorted) {
    update.set(part.update, offset);
    offset += part.update.length;
  }
  return {version: first.version, timestamp: first.timestamp, update};
}
