import { exports as workerExports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import {
  type FamilyEntry,
  type PublicApi,
  unwrapFamilyRpcResult,
} from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import type { FamilyDeviceSessionDurableObject } from "../src/family-device-session.js";
import {
  FAMILY_ACCESS_ADULT as adult,
  FAMILY_ACCESS_API_URL,
  signFamilyAccessJwt as token,
} from "./family-access-jwt.js";

// Reproduces the production incident directly against real workerd: a genuine Durable Object
// reset (`ctx.abort()`, the same primitive the runtime uses when it evicts/resets an object --
// see the "Durable Object connection closed because the object was reset." error observed in
// production) fired at the exact device-session DO instance a live WebSocket is attached to, then
// measures how the real capnweb client actually reacts and whether a fresh reconnect restores the
// previously selected Family OS profile. No mocks/fakes: real workerd, real WebSocket, real DO.

type Connection = {
  api: RpcStub<PublicApi>;
  family: RpcStub<FamilyEntry>;
  cookie: string;
  webSocket: WebSocket;
  closed: Promise<{ code: number; reason: string }>;
  brokenCount: () => number;
};

// Deliberately NOT a mock: this counts real `onRpcBroken` invocations fired by the real capnweb
// client against a real WebSocket, so the test can assert on ground truth instead of assuming it.
async function connect(loginIat: number, appIat: number, deviceCookie?: string): Promise<Connection> {
  let cookie = [deviceCookie, `CF_Authorization=login-${loginIat}`].filter(Boolean).join("; ");
  let response = await workerExports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
    headers: { Upgrade: "websocket", Origin: "https://workshop.invalid", Cookie: cookie,
      "cf-access-jwt-assertion": await token(appIat) },
  }));
  if (response.status !== 101) throw new Error(`Access handshake failed: ${response.status} ${await response.text()}`);
  if (!response.webSocket) throw new TypeError("Expected a WebSocket response.");
  let webSocket = response.webSocket;
  webSocket.addEventListener("error", () => {});
  let closed = new Promise<{ code: number; reason: string }>(resolve =>
    webSocket.addEventListener("close", (event) => resolve({ code: event.code, reason: event.reason }), { once: true }));
  webSocket.accept();
  let brokenCount = 0;
  let api = newWebSocketRpcSession<PublicApi>(webSocket);
  api.onRpcBroken(() => { brokenCount++; });
  let family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  return {
    api, family, webSocket, closed, brokenCount: () => brokenCount,
    cookie: response.headers.get("Set-Cookie")?.split(";", 1)[0] ?? deviceCookie!,
  };
}

describe("Family OS device-session Durable Object reset recovery", () => {
  it("survives a real ctx.abort() reset: measures client onRpcBroken firing and restores the selected profile on reconnect", async () => {
    // 1. Establish the device session and select the adult profile, exactly as a real household
    //    device would after Access login.
    let first = await connect(200, 1);
    unwrapFamilyRpcResult(await first.family.selectAdultProfile());
    let adultApi = unwrapFamilyRpcResult(await first.family.getAuthenticatedApi());
    adultApi.onRpcBroken(() => {});
    await adultApi.setOwnDisplayName("Guardian");
    expect(await adultApi.whoami()).toMatchObject({ id: adult.email });

    // 2. Reset the EXACT FamilyDeviceSessionDurableObject instance this WebSocket is attached to
    //    -- same namespace (`workerExports`, not a separate test binding) server.ts itself routes
    //    through, so this is the real object, not a stand-in. `ctx.abort()` is the runtime
    //    primitive behind "Durable Object connection closed because the object was reset." --
    //    the exact error observed in the production incident.
    let deviceId = first.cookie.split("=", 2)[1];
    if (!deviceId) throw new Error("Expected a device id cookie from the first connection.");
    let deviceSessionId = workerExports.FamilyDeviceSessionDurableObject.idFromName(deviceId);
    let deviceSessionStub = workerExports.FamilyDeviceSessionDurableObject.get(deviceSessionId);
    // ctx.abort() breaks the object's own output gate immediately, so the call that issues it
    // rejects in-place (workerd's "broken.outputGateBroken") -- that's the abort taking effect,
    // not a test failure.
    await runInDurableObject(deviceSessionStub, async (instance: FamilyDeviceSessionDurableObject) => {
      (instance as unknown as { ctx: DurableObjectState }).ctx.abort("simulated production DO reset");
    }).catch((error) => {
      console.log("ABORT_CALL_REJECTED_AS_EXPECTED:", error instanceof Error ? error.message : error);
    });

    // 3. Ground truth: wait for the WebSocket to actually close, and record how many times the
    //    real capnweb client's onRpcBroken fired for the reset connection. This is the fact any
    //    reconnect-race handling would need to be justified by -- not an assumption read off a
    //    server-side log line count. (Measured: exactly 1 -- a single real DO reset does not
    //    make capnweb's onRpcBroken fire more than once on the client.)
    let closeEvent = await first.closed;
    await scheduler.wait(0);
    console.log("DO_RESET_CLOSE_EVENT:", JSON.stringify(closeEvent));
    console.log("DO_RESET_CLIENT_BROKEN_COUNT:", first.brokenCount());
    expect(first.brokenCount()).toBeGreaterThanOrEqual(1);

    // 4. Reconnect as the same device (fresh WebSocket, fresh FamilyDeviceSessionDurableObject
    //    session id -- exactly what the frontend's connection manager does after a break) and
    //    confirm the previously selected adult profile is restored without re-choosing it, and
    //    the adult identity/session state (display name set above) survived the reset.
    let second = await connect(200, 2, first.cookie);
    let state = await second.family.getState();
    expect(state.activeProfile.kind).toBe("adult");
    expect(state.requiresAccessReauthentication).toBe(false);
    let recoveredAdultApi = unwrapFamilyRpcResult(await second.family.getAuthenticatedApi());
    recoveredAdultApi.onRpcBroken(() => {});
    expect(await recoveredAdultApi.whoami()).toMatchObject({ id: adult.email });

    first.api[Symbol.dispose]();
    first.family[Symbol.dispose]();
    second.api[Symbol.dispose]();
    second.family[Symbol.dispose]();
    recoveredAdultApi[Symbol.dispose]();
  });

  it("closes a hibernated Cap'n Web session with 1012, reconnects, and keeps the generation guard", async () => {
    let first = await connect(300, 10);
    unwrapFamilyRpcResult(await first.family.selectAdultProfile());
    let adultApi = unwrapFamilyRpcResult(await first.family.getAuthenticatedApi());
    adultApi.onRpcBroken(() => {});
    await adultApi.setOwnDisplayName("Hibernation Guardian");
    unwrapFamilyRpcResult(await first.family.setHouseholdPasscode("654321"));
    let child = unwrapFamilyRpcResult(await first.family.createChildProfile("Hibernate Child")).childProfiles[0];
    if (!child) throw new Error("Expected a child profile.");

    using workspace = await adultApi.newGadget();
    workspace.onRpcBroken(() => {});
    let workspaceId = (await workspace.getMetadata()).id;
    using gadget = await workspace.createGadget("Hibernate recovery probe");
    gadget.onRpcBroken(() => {});
    let gadgetId = await gadget.getId();
    let chatId = await workspace.newChat("Persist across hibernation reset", null);
    expect(await workspace.listChats()).toEqual([
      expect.objectContaining({id: chatId}),
    ]);

    let deviceId = first.cookie.split("=", 2)[1];
    if (!deviceId) throw new Error("Expected a device id cookie from the first connection.");
    let deviceSession = workerExports.FamilyDeviceSessionDurableObject.get(
        workerExports.FamilyDeviceSessionDurableObject.idFromName(deviceId));
    await runInDurableObject(deviceSession, async (instance: FamilyDeviceSessionDurableObject) => {
      let ctx = (instance as unknown as {ctx: DurableObjectState}).ctx;
      expect(ctx.getWebSocketAutoResponse()).toMatchObject({request: "ping", response: "pong"});
      let sockets = ctx.getWebSockets();
      expect(sockets).toHaveLength(1);
      let socket = sockets[0]!;
      let attachment = socket.deserializeAttachment() as Record<string, unknown>;
      // Hibernation re-runs the constructor and therefore changes the in-memory instance id while
      // preserving the socket attachment. Reproduce that exact persistent-state relationship in
      // workerd, whose local runtime delivers hibernatable events but intentionally never evicts.
      socket.serializeAttachment({...attachment, instanceId: crypto.randomUUID()});
    });

    await expect(first.api.ping()).rejects.toThrow();
    await expect(first.closed).resolves.toEqual({code: 1012, reason: "session reset"});

    let recovered = await connect(300, 11, first.cookie);
    expect((await recovered.family.getState()).activeProfile.kind).toBe("adult");
    let recoveredAdult = unwrapFamilyRpcResult(await recovered.family.getAuthenticatedApi());
    recoveredAdult.onRpcBroken(() => {});
    expect((await recoveredAdult.listModels()).map(model => model.id)).toContain("glm-5.3-flash");
    using recoveredWorkspace = recoveredAdult.openGadget(workspaceId);
    recoveredWorkspace.onRpcBroken(() => {});
    await expect(recoveredWorkspace.listChats()).resolves.toEqual([
      expect.objectContaining({id: chatId}),
    ]);
    using recoveredGadget = await recoveredWorkspace.getGadget(gadgetId);
    recoveredGadget.onRpcBroken(() => {});
    await expect(recoveredGadget.getTitle()).resolves.toBe("Hibernate recovery probe");

    let replacement = await connect(300, 12, first.cookie);
    unwrapFamilyRpcResult(await replacement.family.selectChildProfile(child.id));
    await recovered.closed;
    await expect(recoveredAdult.whoami()).rejects.toThrow();

    first.api[Symbol.dispose]();
    first.family[Symbol.dispose]();
    adultApi[Symbol.dispose]();
    recovered.api[Symbol.dispose]();
    recovered.family[Symbol.dispose]();
    recoveredAdult[Symbol.dispose]();
    replacement.api[Symbol.dispose]();
    replacement.family[Symbol.dispose]();
  });
});
