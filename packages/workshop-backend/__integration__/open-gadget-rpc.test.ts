import { runInDurableObject } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import {
  createOpenGadgetError,
  getOpenGadgetErrorCode,
  OPEN_GADGET_ERROR_CODES,
  type AuthenticatedApi,
  type FamilyEntry,
  type OpenGadgetErrorCode,
  type PublicApi,
  unwrapFamilyRpcResult,
} from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { makeOverseerStorage } from "../src/overseer.js";
import { FAMILY_ACCESS_ADULT as adult, signFamilyAccessJwt } from "./family-access-jwt.js";

type CodedError = Error & { code?: unknown };

const PASSWORD_HASH = new Uint8Array([1, 2, 3]);
// Also whitelisted in vitest.integration.config.ts onUnhandledError: capabilities held across
// the injected abort reject on their own schedule.
const USER_DO_ABORT_REASON = "user-DO reset injected by test";
const EXPECTED_MESSAGES: Record<OpenGadgetErrorCode, string> = {
  [OPEN_GADGET_ERROR_CODES.workspaceNotFound]: "Workspace not found.",
  [OPEN_GADGET_ERROR_CODES.workspaceAccessDenied]: "You don't have access to this workspace.",
};

function username(prefix: string): string {
  return prefix + crypto.randomUUID().replaceAll("-", "");
}

async function rejection(value: PromiseLike<unknown>): Promise<CodedError> {
  try {
    await value;
  } catch (error) {
    if (!(error instanceof Error)) {
      throw new TypeError("Expected RPC to reject with an Error.", { cause: error });
    }
    return error;
  }
  throw new Error("Expected RPC to reject.");
}

function expectRpcCode(error: CodedError, code: OpenGadgetErrorCode): void {
  expect(error.message).toBe(EXPECTED_MESSAGES[code]);
  expect(error.code).toBe(code);
  expect(Object.prototype.propertyIsEnumerable.call(error, "code")).toBe(true);
  expect(getOpenGadgetErrorCode(error)).toBe(code);
}

async function connect(): Promise<RpcStub<PublicApi>> {
  const response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: { Upgrade: "websocket" },
  }));

  expect(response.status).toBe(101);
  const socket = response.webSocket;
  if (!socket) throw new TypeError("Expected a WebSocket response.");

  socket.accept();
  return newWebSocketRpcSession<PublicApi>(socket);
}

async function connectAdult(loginIat: number): Promise<{
  publicApi: RpcStub<PublicApi>;
  family: RpcStub<FamilyEntry>;
  authenticated: RpcStub<AuthenticatedApi>;
}> {
  const response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: {
      Upgrade: "websocket",
      Origin: "https://workshop.invalid",
      Cookie: `CF_Authorization=login-${loginIat}`,
      "cf-access-jwt-assertion": await signFamilyAccessJwt(loginIat),
    },
  }));
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  if (!socket) throw new TypeError("Expected a WebSocket response.");

  socket.addEventListener("error", () => {});
  socket.accept();
  const publicApi = newWebSocketRpcSession<PublicApi>(socket);
  publicApi.onRpcBroken(() => {});
  const family = await publicApi.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  unwrapFamilyRpcResult(await family.selectAdultProfile());
  const authenticated = unwrapFamilyRpcResult(await family.getAuthenticatedApi());
  authenticated.onRpcBroken(() => {});
  return { publicApi, family, authenticated };
}

async function createAccount(
    publicApi: RpcStub<PublicApi>, prefix: string): Promise<{ username: string; token: string }> {
  const name = username(prefix);
  const token = await publicApi.createAccount(name, name, PASSWORD_HASH);
  if (token === null) throw new Error(`Failed to create ${name}.`);
  return { username: name, token };
}

async function openRejection(
    authenticated: RpcStub<AuthenticatedApi>,
    id: string): Promise<CodedError> {
  using workspace = authenticated.openGadget(id);
  return await rejection(workspace.getMetadata());
}

// TODO: This test suite keeps timing out in CI, skipping for now.
describe.skip("openGadget errors across native RPC and Cap'n Web", () => {
  it("retains enumerable Error.code at the native Durable Object boundary", async () => {
    const code = OPEN_GADGET_ERROR_CODES.workspaceNotFound;
    const local = createOpenGadgetError(code);

    expect(local.message).toBe(EXPECTED_MESSAGES[code]);
    expect(local.code).toBe(code);
    expect(Object.prototype.propertyIsEnumerable.call(local, "code")).toBe(true);

    const name = username("native");
    const userId = exports.UserDurableObject.idFromName(name).toString();
    const workspaceId = exports.OverseerDurableObject.newUniqueId();
    const error = await rejection(
      exports.OverseerDurableObject.get(workspaceId).open(userId, name, () => {}),
    );

    expectRpcCode(error, code);
  });

  it("maps malformed IDs through AuthenticatedApi", async () => {
    using publicApi = await connect();
    const account = await createAccount(publicApi, "missing");
    using authenticated = await publicApi.authenticate(account.token);

    const error = await openRejection(authenticated, "not-a-durable-object-id");
    expectRpcCode(error, OPEN_GADGET_ERROR_CODES.workspaceNotFound);
  });

  it("maps valid-but-missing IDs through AuthenticatedApi", async () => {
    using publicApi = await connect();
    const account = await createAccount(publicApi, "missing");
    using authenticated = await publicApi.authenticate(account.token);

    const id = exports.OverseerDurableObject.newUniqueId().toString();
    const error = await openRejection(authenticated, id);
    expectRpcCode(error, OPEN_GADGET_ERROR_CODES.workspaceNotFound);
  });

  it("maps an unauthorized existing workspace to access denied", async () => {
    using publicApi = await connect();
    const ownerAccount = await createAccount(publicApi, "owner");
    const intruderAccount = await createAccount(publicApi, "intruder");
    using owner = await publicApi.authenticate(ownerAccount.token);
    using intruder = await publicApi.authenticate(intruderAccount.token);

    using workspace = await owner.newGadget();
    const metadata = await workspace.getMetadata();

    const nativeError = await rejection(
      exports.OverseerDurableObject
        .get(exports.OverseerDurableObject.idFromString(metadata.id))
        .open(
          exports.UserDurableObject.idFromName(intruderAccount.username).toString(),
          intruderAccount.username,
          () => {},
        ),
    );
    expectRpcCode(nativeError, OPEN_GADGET_ERROR_CODES.workspaceAccessDenied);

    const browserError = await openRejection(intruder, metadata.id);
    expectRpcCode(browserError, OPEN_GADGET_ERROR_CODES.workspaceAccessDenied);
  });
});

// workerd tags rejections from a reset DO with the structured flags do-retry.ts reads. The fork
// aborts only the User DO so the Family device-session generation guard remains alive while the
// replay-safe read recovers through a freshly minted User DO stub.
describe("user-DO reset flags", () => {
  it("a tagged User DO reset is retried without bypassing the Family generation guard", async () => {
    const connection = await connectAdult(600);
    using _publicApi = connection.publicApi;
    using _family = connection.family;
    using authenticated = connection.authenticated;

    expect(await authenticated.listModels()).toBeInstanceOf(Array);

    // Bind a native stub to the current DO incarnation BEFORE the reset — a stub minted after
    // the abort would simply restart the object and succeed. This poisoned-stub rejection is
    // the exact shape AuthenticatedApiImpl sees when one of its calls loses the reset race.
    const userStub = exports.UserDurableObject.get(
      exports.UserDurableObject.idFromName(adult.email));
    expect(await userStub.listModels()).toBeInstanceOf(Array);

    await rejection(runInDurableObject(userStub, (_instance, state) => {
      state.abort("user-DO flag probe reset");
    }));

    // The session recovers: AuthenticatedApiImpl resolves a fresh stub per call, so the
    // restarted object serves this read — the browser never sees the reset.
    expect(await authenticated.listModels()).toBeInstanceOf(Array);

    const nativeErr = await rejection(userStub.listModels());
    expect({
      message: nativeErr.message,
      durableObjectReset: (nativeErr as Record<string, unknown>).durableObjectReset,
      retryable: (nativeErr as Record<string, unknown>).retryable,
      overloaded: (nativeErr as Record<string, unknown>).overloaded,
    }).toEqual({
      message: "user-DO flag probe reset",
      durableObjectReset: true,
      retryable: undefined,
      overloaded: undefined,
    });

    // Permanently broken, not fail-once: the fresh-stub-per-call design rests on this.
    const nativeErr2 = await rejection(userStub.listModels());
    expect(nativeErr2.message).toBe("user-DO flag probe reset");
  });
});

// The asymmetric reset a retained-stub design can't absorb: the USER DO resets while the
// workspace (Overseer) DO keeps running. The Overseer used to mint its owner/clientUser stubs
// once at open(); after the user DO's incarnation died, every user-DO-carrying call on the
// still-open session — newChat, listModels, createGadget, setPinned — failed against the
// poisoned stub until the WebSocket reconnected. The session capabilities now mint a fresh stub
// per call, so the first post-reset call restarts the object. The reset is injected into the one
// object via runInDurableObject + state.abort(), leaving the Family device-session DO alive.
describe("workspace session across a user-DO-only reset", () => {
  it("chat, models, and gadget capabilities survive the user DO resetting", async () => {
    const connection = await connectAdult(700);
    using _publicApi = connection.publicApi;
    using _family = connection.family;
    using authenticated = connection.authenticated;
    using workspace = await authenticated.newGadget();

    // Model id null: commits the message without starting an agent — the pure chat-start path.
    expect(await workspace.newChat("before the reset", null)).toEqual(expect.any(Number));

    const userStub = exports.UserDurableObject.get(
      exports.UserDurableObject.idFromName(adult.email));
    // The abort kills the very call delivering it, so the rejection is the success signal.
    await rejection(runInDurableObject(userStub, (_instance, state) => {
      state.abort(USER_DO_ABORT_REASON);
    }));

    // Every operation below crosses into the user DO through the SAME retained workspace
    // capability. Each minting a fresh stub is what restarts the object and recovers.
    expect(await workspace.newChat("after the reset", null)).toEqual(expect.any(Number));
    expect(await workspace.listModels()).toBeInstanceOf(Array);
    // createGadget resolves the binding name via getChatContext, and hands back a nested
    // GadgetClient capability that must also be born with the fresh-stub design.
    using gadget = await workspace.createGadget("post-reset gadget");
    expect(await gadget.getTitle()).toBe("post-reset gadget");
  });
});

// Smoke the paged action-log read against a real workspace DO: proves the @validateRpc wiring
// accepts the option shape (the semantics live in __tests__/action-log-pagination.test.ts).
// Runs after the reset tests so this session's DOs aren't torn down by abortAllDurableObjects().
describe("paged action-log reads", () => {
  it("answers listActions on a fresh workspace", async () => {
    const connection = await connectAdult(800);
    using _publicApi = connection.publicApi;
    using _family = connection.family;
    using authenticated = connection.authenticated;
    using workspace = await authenticated.newGadget();

    expect(await workspace.listActions({ filter: "action" })).toEqual({ entries: [] });
    // The pending filter is a distinct union member; this proves the regenerated validator
    // accepts it end to end.
    expect(await workspace.listActions({ filter: "pending" })).toEqual({ entries: [] });
  });
});

describe("workspace storage compaction", () => {
  it("truncates pre-snapshot Yjs history without changing the rendered files", async () => {
    const connection = await connectAdult(900);
    using _publicApi = connection.publicApi;
    using _family = connection.family;
    using authenticated = connection.authenticated;
    using workspace = await authenticated.newGadget();
    using gadget = await workspace.createGadget("storage compaction", undefined, "STORAGE_TEST");
    let gadgetId = await gadget.getId();

    // Prime snapshot metrics against the empty committed document, then exceed the existing 64KiB
    // snapshot threshold with incompressible-enough Yjs text content.
    expect(await gadget.getUiBundle()).toBeNull();
    let ydoc = new Y.Doc();
    let files = ydoc.getMap<Y.Text>(String(gadgetId));
    files.set("client.js", new Y.Text("x".repeat(70_000)));
    await workspace.updateCode(Y.encodeStateAsUpdateV2(ydoc));

    let expected = `export const tail = ${JSON.stringify("y".repeat(80_000))};`;
    let updates: Uint8Array[] = [];
    ydoc.on("updateV2", update => updates.push(update));
    files.get("client.js")!.delete(0, files.get("client.js")!.length);
    files.get("client.js")!.insert(0, expected);
    await workspace.updateCode(Y.mergeUpdatesV2(updates));

    let metadata = await workspace.getMetadata();
    let native = exports.OverseerDurableObject.get(
      exports.OverseerDurableObject.idFromString(metadata.id),
    );
    let counts = await runInDurableObject(native, (instance) => {
      let storage = makeOverseerStorage(
        (instance as unknown as {ctx: DurableObjectState}).ctx.storage,
      );
      return {
        codeVersions: Array.from(storage.code.list(), item => item.version),
        snapshotVersions: Array.from(
          new Set(Array.from(storage.snapshotParts.list(), item => item.version)),
        ),
        legacySnapshots: Array.from(storage.snapshots.list()).length,
      };
    });
    expect(counts.snapshotVersions).toHaveLength(1);
    expect(counts.legacySnapshots).toBe(0);
    expect(Math.min(...counts.codeVersions)).toBeGreaterThanOrEqual(counts.snapshotVersions[0]);
    expect((await gadget.getUiBundle())?.jsCode).toBe(expected);
  });
});
