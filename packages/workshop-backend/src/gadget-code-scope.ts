import * as Y from "yjs";

function belongsToRoot(item: Y.Item, root: object | undefined): boolean {
  let parent = item.parent;
  while (parent instanceof Y.AbstractType && parent._item) parent = parent._item.parent;
  return root !== undefined && parent === root;
}

/** Projects one code root while retaining the source CRDT identities and clock positions. */
export function encodeGadgetCode(doc: Y.Doc, rootName: string, stateVector?: Uint8Array): Uint8Array {
  let projection = new Y.Doc({gc: false});
  try {
    let root = doc.share.get(rootName);
    for (let [client, structs] of doc.store.clients) {
      projection.store.clients.set(client, structs.map(struct =>
        struct instanceof Y.Item && !belongsToRoot(struct, root)
          ? new Y.GC(struct.id, struct.length) : struct));
    }
    // This view is never integrated or edited: retained Items still refer to their original
    // parent types, which lets Yjs encode root names without copying unrelated content.
    return Y.encodeStateAsUpdateV2(projection, stateVector);
  } finally {
    projection.destroy();
  }
}

function deny(): never {
  throw new Error("Code update is outside this gadget's code root.");
}

function visitRange(doc: Y.Doc, client: number, clock: number, length: number,
    check: (struct: Y.Item | Y.GC) => void): void {
  let structs = doc.store.clients.get(client);
  if (!structs || clock + length > Y.getState(doc.store, client)) deny();
  let index = Y.findIndexSS(structs, clock);
  let end = clock + length;
  while (clock < end) {
    let struct = structs[index++];
    if (!struct || struct.id.clock > clock) deny();
    check(struct);
    clock = struct.id.clock + struct.length;
  }
}

/** Rejects cross-root writes and unresolved updates before they reach the persisted document. */
export function assertGadgetCodeUpdate(doc: Y.Doc, rootName: string, update: Uint8Array): void {
  let decoded = Y.decodeUpdateV2(update);
  let candidate = new Y.Doc({gc: false});
  try {
    Y.applyUpdateV2(candidate, Y.encodeStateAsUpdateV2(doc));
    Y.applyUpdateV2(candidate, update);
    // A deferred reference could become a cross-root write when a future update arrives.
    if (candidate.store.pendingStructs || candidate.store.pendingDs) deny();
    let root = candidate.share.get(rootName);
    for (let struct of decoded.structs) {
      let knownClock = Y.getState(doc.store, struct.id.client);
      let end = struct.id.clock + struct.length;
      if (struct instanceof Y.GC) {
        // A projected snapshot contains clock placeholders for private roots. They may only
        // acknowledge already-known clocks, never reserve future source clock positions.
        if (end > knownClock) deny();
      } else if (struct instanceof Y.Item && end > knownClock) {
        // Both sequence neighbours must belong to this root. Trusting only the integrated
        // parent would let a forged rightOrigin splice a private sequence into the public one.
        for (let reference of [struct.origin, struct.rightOrigin,
          struct.parent instanceof Y.ID ? struct.parent : null]) {
          if (reference) {
            visitRange(candidate, reference.client, reference.clock, 1, item => {
              if (!(item instanceof Y.Item) || !belongsToRoot(item, root)) deny();
            });
          }
        }
        if (typeof struct.parent === "string" && struct.parent !== rootName) deny();
        let start = Math.max(struct.id.clock, knownClock);
        visitRange(candidate, struct.id.client, start, end - start, item => {
          if (!(item instanceof Y.Item) || !belongsToRoot(item, root)) deny();
        });
      }
    }
    for (let [client, ranges] of decoded.ds.clients) {
      for (let range of ranges) {
        visitRange(candidate, client, range.clock, range.len, struct => {
          if (struct instanceof Y.Item && !belongsToRoot(struct, root)) deny();
        });
      }
    }
    // Integrating a map assignment can delete a conflicting Item without an explicit incoming
    // DeleteSet. Check existing private Items as well as the update's declared deletions.
    let sourceRoot = doc.share.get(rootName);
    for (let [client, structs] of doc.store.clients) {
      for (let struct of structs) {
        if (struct instanceof Y.Item && !struct.deleted && !belongsToRoot(struct, sourceRoot)) {
          visitRange(candidate, client, struct.id.clock, struct.length, item => {
            if (!(item instanceof Y.Item) || item.deleted || belongsToRoot(item, root)) deny();
          });
        }
      }
    }
  } finally {
    candidate.destroy();
  }
}
