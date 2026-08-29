import type { CodeUpdate } from "@gadgets/workshop-shared/api";

/** Maximum Yjs snapshot bytes stored in one Durable Object storage row. */
export const CODE_SNAPSHOT_PART_BYTES = 512 * 1024;

/** One storage-safe part of a complete Yjs code snapshot. */
export type CodeSnapshotPart = {
  key: string;
  version: number;
  timestamp: Date;
  index: number;
  partCount: number;
  update: Uint8Array;
};

/** Return the lexically sortable storage key for one snapshot part. */
export function codeSnapshotPartKey(version: number, index: number): string {
  return `${version.toString().padStart(16, "0")}:${index.toString().padStart(6, "0")}`;
}

/** Return the common storage-key prefix for every part of one snapshot version. */
export function codeSnapshotPartPrefix(version: number): string {
  return `${version.toString().padStart(16, "0")}:`;
}

/** Split a complete snapshot into rows below the Durable Object per-value limit. */
export function splitCodeSnapshot(snapshot: CodeUpdate): CodeSnapshotPart[] {
  let partCount = Math.max(1, Math.ceil(snapshot.update.length / CODE_SNAPSHOT_PART_BYTES));
  return Array.from({length: partCount}, (_, index) => ({
    key: codeSnapshotPartKey(snapshot.version, index),
    version: snapshot.version,
    timestamp: snapshot.timestamp,
    index,
    partCount,
    update: snapshot.update.slice(
      index * CODE_SNAPSHOT_PART_BYTES,
      Math.min((index + 1) * CODE_SNAPSHOT_PART_BYTES, snapshot.update.length),
    ),
  }));
}

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

/** Choose the newest complete snapshot across the legacy and partitioned formats. */
export function latestCodeSnapshot(
    legacy: CodeUpdate | undefined, parts: Iterable<CodeSnapshotPart>): CodeUpdate | undefined {
  let partitioned = joinCodeSnapshotParts(parts);
  return partitioned && (!legacy || partitioned.version > legacy.version) ? partitioned : legacy;
}
