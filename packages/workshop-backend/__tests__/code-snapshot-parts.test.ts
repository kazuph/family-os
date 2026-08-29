import { describe, expect, it } from "vitest";
import { Buffer } from "node:buffer";
import type { CodeUpdate } from "@gadgets/workshop-shared/api";
import {
  CODE_SNAPSHOT_PART_BYTES,
  codeSnapshotPartKey,
  joinCodeSnapshotParts,
  latestCodeSnapshot,
  splitCodeSnapshot,
} from "../src/code-snapshot-parts.js";

function snapshot(version: number, length: number): CodeUpdate {
  let update = new Uint8Array(length);
  for (let index = 0; index < length; index++) update[index] = index % 251;
  return {
    version,
    timestamp: new Date(version * 1000),
    update,
  };
}

describe("partitioned code snapshots", () => {
  it("splits and rejoins snapshots larger than one storage row", () => {
    let original = snapshot(42, CODE_SNAPSHOT_PART_BYTES * 2 + 37);
    let parts = splitCodeSnapshot(original);
    let joined = joinCodeSnapshotParts(parts.toReversed());

    expect(parts).toHaveLength(3);
    expect(parts.every(part => part.update.length <= CODE_SNAPSHOT_PART_BYTES)).toBe(true);
    expect(joined?.version).toBe(original.version);
    expect(joined?.timestamp).toEqual(original.timestamp);
    expect(Buffer.compare(joined!.update, original.update)).toBe(0);
  });

  it("orders version and part indexes lexically", () => {
    let keys = [
      codeSnapshotPartKey(10, 1),
      codeSnapshotPartKey(2, 20),
      codeSnapshotPartKey(10, 0),
      codeSnapshotPartKey(2, 3),
    ];
    expect(keys.toSorted()).toEqual([
      codeSnapshotPartKey(2, 3),
      codeSnapshotPartKey(2, 20),
      codeSnapshotPartKey(10, 0),
      codeSnapshotPartKey(10, 1),
    ]);
  });

  it("keeps legacy snapshots readable and chooses the newest format", () => {
    let legacy = snapshot(8, 12);
    let newerParts = splitCodeSnapshot(snapshot(9, CODE_SNAPSHOT_PART_BYTES + 1));

    expect(latestCodeSnapshot(legacy, [])).toEqual(legacy);
    expect(latestCodeSnapshot(legacy, newerParts)?.version).toBe(9);
    expect(latestCodeSnapshot(snapshot(10, 7), newerParts)?.version).toBe(10);
  });

  it("rejects incomplete snapshots instead of replaying corrupt state", () => {
    let parts = splitCodeSnapshot(snapshot(3, CODE_SNAPSHOT_PART_BYTES + 1));
    expect(() => joinCodeSnapshotParts(parts.slice(0, 1))).toThrow("incomplete or inconsistent");
  });
});
