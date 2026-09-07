import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { assertGadgetCodeUpdate, encodeGadgetCode } from "../src/gadget-code-scope.js";

function fixture() {
  let source = new Y.Doc({gc: false});
  source.getMap<Y.Text>("book").set("client.js", new Y.Text("reader"));
  source.getMap<Y.Text>("private").set("secret.js", new Y.Text("private source content"));
  source.getMap<Y.Text>("book").get("client.js")!.insert(6, " code");
  let client = new Y.Doc({gc: false});
  Y.applyUpdateV2(client, encodeGadgetCode(source, "book"));
  return {source, client};
}

function edit(doc: Y.Doc, action: () => void): Uint8Array {
  let updates: Uint8Array[] = [];
  let collect = (update: Uint8Array) => updates.push(update);
  doc.on("updateV2", collect);
  action();
  doc.off("updateV2", collect);
  return Y.mergeUpdatesV2(updates);
}

function text(doc: Y.Doc, root: string, filename: string): string | undefined {
  return doc.getMap<Y.Text>(root).get(filename)?.toString();
}

describe("gadget code capability boundary", () => {
  it("exposes only the selected root and preserves its struct IDs without changing the source", () => {
    let {source, client} = fixture();
    let before = Y.encodeStateAsUpdateV2(source);
    let projection = encodeGadgetCode(source, "book");
    expect([...client.share.keys()]).toEqual(["book"]);
    expect(text(client, "book", "client.js")).toBe("reader code");
    for (let struct of Y.decodeUpdateV2(projection).structs) {
      if (struct instanceof Y.Item) {
        expect(struct.content.getContent().filter(value => typeof value === "string").join(""))
          .not.toContain("private source content");
      }
    }
    expect(client.getMap("book")._map.get("client.js")!.id)
      .toEqual(source.getMap("book")._map.get("client.js")!.id);
    expect(Y.encodeStateAsUpdateV2(source)).toEqual(before);
  });

  it("round-trips edits, deletions, file replacement and reconnects while private clocks advance", () => {
    let {source, client} = fixture();
    for (let action of [
      () => client.getMap<Y.Text>("book").get("client.js")!.insert(0, "new "),
      () => client.getMap<Y.Text>("book").get("client.js")!.delete(0, 4),
      () => client.getMap<Y.Text>("book").set("client.js", new Y.Text("replacement")),
      () => client.getMap<Y.Text>("book").set("server.js", new Y.Text("server")),
      () => client.getMap<Y.Text>("book").delete("server.js"),
    ]) {
      let update = edit(client, action);
      assertGadgetCodeUpdate(source, "book", update);
      Y.applyUpdateV2(source, update);
      // Replayed deliveries are harmless and must remain valid.
      assertGadgetCodeUpdate(source, "book", update);
      source.getMap<Y.Text>("private").get("secret.js")!.insert(0, "private ");
      Y.applyUpdateV2(client, encodeGadgetCode(source, "book", Y.encodeStateVector(client)));
      Y.applyUpdateV2(client, encodeGadgetCode(source, "book"));
      expect(text(client, "book", "client.js")).toBe(text(source, "book", "client.js"));
      expect([...client.share.keys()]).toEqual(["book"]);
    }
  });

  it("rejects a new private root, a known private child write and a deletion-only attack", () => {
    let {source} = fixture();
    let attacker = new Y.Doc({gc: false});
    Y.applyUpdateV2(attacker, Y.encodeStateAsUpdateV2(source));
    let before = Y.encodeStateAsUpdateV2(source);
    for (let action of [
      () => attacker.getMap<Y.Text>("another").set("file", new Y.Text("attack")),
      () => attacker.getMap<Y.Text>("private").get("secret.js")!.insert(0, "attack"),
      () => attacker.getMap<Y.Text>("private").get("secret.js")!.delete(0, 1),
    ]) {
      expect(() => assertGadgetCodeUpdate(source, "book", edit(attacker, action))).toThrow();
      expect(Y.encodeStateAsUpdateV2(source)).toEqual(before);
    }
  });

  it("rejects unresolved references that could activate against another root later", () => {
    let {source} = fixture();
    let attacker = new Y.Doc({gc: false});
    attacker.getMap<Y.Text>("private").set("later", new Y.Text("first"));
    let update = edit(attacker, () => attacker.getMap<Y.Text>("private").get("later")!.insert(0, "deferred"));
    expect(() => assertGadgetCodeUpdate(source, "book", update)).toThrow();
  });

  it("rejects a forged sequence joining an allowed origin to a private rightOrigin", () => {
    let {source} = fixture();
    let attack = new Y.Doc({gc: false});
    let origin = source.getMap<Y.Text>("book").get("client.js")!._start!.id;
    let rightOrigin = source.getMap<Y.Text>("private").get("secret.js")!._start!.id;
    attack.store.clients.set(attack.clientID, [new Y.Item(
      new Y.ID(attack.clientID, 0), null, origin, null, rightOrigin,
      null, null, new Y.ContentString("forged"),
    )]);
    let before = Y.encodeStateAsUpdateV2(source);
    expect(() => assertGadgetCodeUpdate(source, "book", Y.encodeStateAsUpdateV2(attack))).toThrow();
    expect(Y.encodeStateAsUpdateV2(source)).toEqual(before);
  });

  it("rejects unresolved deletes, mixed authorized and private edits, and unknown GC clocks", () => {
    let {source, client} = fixture();
    let attacker = new Y.Doc({gc: false});
    attacker.getMap<Y.Text>("private").set("later", new Y.Text("first"));
    let deletion = edit(attacker, () => attacker.getMap("private").delete("later"));
    expect(() => assertGadgetCodeUpdate(source, "book", deletion)).toThrow();
    let mixed = edit(client, () => {
      client.getMap<Y.Text>("book").get("client.js")!.insert(0, "valid");
      client.getMap<Y.Text>("private").set("secret.js", new Y.Text("invalid"));
    });
    expect(() => assertGadgetCodeUpdate(source, "book", mixed)).toThrow();
    let unrelated = new Y.Doc({gc: false});
    unrelated.getMap("private").set("data", "private");
    expect(() => assertGadgetCodeUpdate(source, "book", encodeGadgetCode(unrelated, "book"))).toThrow();
  });

  it("does not allow a projection's private GC DeleteSet to delete live source data", () => {
    let {source, client} = fixture();
    expect(() => assertGadgetCodeUpdate(source, "book", Y.encodeStateAsUpdateV2(client))).toThrow();
    expect(text(source, "private", "secret.js")).toBe("private source content");
  });

  it("keeps concurrent edits and offline edits after a full reconnect", () => {
    let {source, client} = fixture();
    let offline = edit(client, () => client.getMap<Y.Text>("book").get("client.js")!.insert(0, "offline "));
    source.getMap<Y.Text>("book").get("client.js")!.insert(0, "host ");
    source.getMap<Y.Text>("private").get("secret.js")!.insert(0, "private ");
    Y.applyUpdateV2(client, encodeGadgetCode(source, "book"));
    assertGadgetCodeUpdate(source, "book", offline);
    Y.applyUpdateV2(source, offline);
    expect(text(source, "book", "client.js")).toBe(text(client, "book", "client.js"));
    expect(text(client, "book", "client.js")).toContain("offline ");
    expect(text(client, "book", "client.js")).toContain("host ");
  });
});
