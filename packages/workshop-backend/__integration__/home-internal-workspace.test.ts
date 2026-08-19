import { exports } from "cloudflare:workers";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import {
  FAMILY_ERROR_CODES,
  INTERNAL_WORKSPACE_TITLE,
  type AuthenticatedApi,
  type FamilyEntry,
  type PublicApi,
  unwrapFamilyRpcResult,
} from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import { signFamilyAccessJwt as token } from "./family-access-jwt.js";

type Connection = {
  api: RpcStub<PublicApi>;
  family: RpcStub<FamilyEntry>;
  cookie: string;
};

async function connect(loginIat: number, appIat: number, deviceCookie?: string): Promise<Connection> {
  let cookie = [deviceCookie, `CF_Authorization=login-${loginIat}`].filter(Boolean).join("; ");
  let response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: { Upgrade: "websocket", Origin: "https://workshop.invalid", Cookie: cookie,
      "cf-access-jwt-assertion": await token(appIat) },
  }));
  if (response.status !== 101) throw new Error(`Access handshake failed: ${response.status} ${await response.text()}`);
  if (!response.webSocket) throw new TypeError("Expected a WebSocket response.");
  response.webSocket.addEventListener("error", () => {});
  response.webSocket.accept();
  let api = newWebSocketRpcSession<PublicApi>(response.webSocket);
  api.onRpcBroken(() => {});
  let family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  return { api, family, cookie: response.headers.get("Set-Cookie")?.split(";", 1)[0] ?? deviceCookie! };
}

async function selectAdult(family: RpcStub<FamilyEntry>): Promise<void> {
  let first = await family.selectAdultProfile();
  if (first.ok) return;
  if (first.error === FAMILY_ERROR_CODES.passcodeInvalid) {
    unwrapFamilyRpcResult(await family.selectAdultProfile("123456"));
    return;
  }
  unwrapFamilyRpcResult(first);
}

async function ensureOnboarded(api: RpcStub<AuthenticatedApi>): Promise<void> {
  if (await api.isOnboardingCompleted()) return;
  await api.setOwnDisplayName("Guardian");
  await api.completeOnboarding();
}

async function waitUntil(label: string, predicate: () => Promise<boolean>): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if (await predicate()) return;
    } catch (error) {
      lastError = error;
    }
    await scheduler.wait(50);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${String(lastError)}` : ""}`);
}

describe("per-profile internal home workspace", () => {
  it("reuses one hidden workspace, keeps selected workspaces intact, and isolates profiles", async () => {
    let session = await connect(400, 1);
    await selectAdult(session.family);
    let adultApi = unwrapFamilyRpcResult(await session.family.getAuthenticatedApi());
    adultApi.onRpcBroken(() => {});
    await ensureOnboarded(adultApi);

    expect(await adultApi.getInternalWorkspaceId()).toBeNull();

    using visible = await adultApi.newGadget();
    visible.onRpcBroken(() => {});
    await visible.setTitle("Game Development");
    let visibleId = (await visible.getMetadata()).id;
    await visible.newChat("keep this workspace", null);
    await waitUntil("visible workspace to appear in listGadgets", async () =>
      (await adultApi.listGadgets()).some((gadget) => gadget.id === visibleId));

    using firstHome = await adultApi.getOrCreateInternalWorkspace();
    firstHome.onRpcBroken(() => {});
    let homeId = (await firstHome.getMetadata()).id;
    expect(await firstHome.getMetadata()).toMatchObject({ id: homeId, title: INTERNAL_WORKSPACE_TITLE });
    expect(await adultApi.getInternalWorkspaceId()).toBe(homeId);
    let firstChat = await firstHome.newChat("default home chat", null);
    let secondChat = await firstHome.newChat("second home chat", null);
    expect(secondChat).not.toBe(firstChat);

    using reusedHome = await adultApi.getOrCreateInternalWorkspace();
    reusedHome.onRpcBroken(() => {});
    expect((await reusedHome.getMetadata()).id).toBe(homeId);
    await waitUntil("internal chats to be listed", async () =>
      (await reusedHome.listChats()).length >= 2);
    let homeChats = await reusedHome.listChats();
    expect(homeChats.map((chat) => chat.id).toSorted()).toEqual([firstChat, secondChat].toSorted());

    using openedHome = await adultApi.openGadget(homeId);
    openedHome.onRpcBroken(() => {});
    expect((await openedHome.getMetadata()).id).toBe(homeId);

    await waitUntil("internal lastActive flush without listing the home workspace", async () => {
      let listed = await adultApi.listGadgets();
      return listed.some((gadget) => gadget.id === visibleId)
        && listed.every((gadget) => gadget.id !== homeId);
    });
    let listed = await adultApi.listGadgets();
    expect(listed.map((gadget) => gadget.id)).toContain(visibleId);
    expect(listed.map((gadget) => gadget.title)).toContain("Game Development");
    expect(listed.some((gadget) => gadget.id === homeId)).toBe(false);
    expect(listed.some((gadget) => gadget.title === INTERNAL_WORKSPACE_TITLE)).toBe(false);

    using selectedWorkspace = await adultApi.openGadget(visibleId);
    selectedWorkspace.onRpcBroken(() => {});
    let selectedChat = await selectedWorkspace.newChat("chat in Game Development", null);
    let selectedChats = await selectedWorkspace.listChats();
    expect(selectedChats.some((chat) => chat.id === selectedChat)).toBe(true);
    expect((await selectedWorkspace.getMetadata()).title).toBe("Game Development");

    unwrapFamilyRpcResult(await session.family.setHouseholdPasscode("123456"));
    let child = unwrapFamilyRpcResult(await session.family.createChildProfile("Home Child")).childProfiles[0];
    if (!child) throw new Error("Expected child profile.");
    unwrapFamilyRpcResult(await session.family.selectChildProfile(child.id));
    let childApi = unwrapFamilyRpcResult(await session.family.getAuthenticatedApi());
    childApi.onRpcBroken(() => {});

    using childHome = await childApi.getOrCreateInternalWorkspace();
    childHome.onRpcBroken(() => {});
    let childHomeId = (await childHome.getMetadata()).id;
    expect(childHomeId).not.toBe(homeId);
    await childHome.newChat("child home chat", null);
    expect(await childApi.getInternalWorkspaceId()).toBe(childHomeId);
    let childList = await childApi.listGadgets();
    expect(childList.some((gadget) => gadget.id === homeId)).toBe(false);
    expect(childList.some((gadget) => gadget.id === visibleId)).toBe(false);
    expect(childList.some((gadget) => gadget.id === childHomeId)).toBe(false);

    adultApi[Symbol.dispose]();
    childApi[Symbol.dispose]();
    session.family[Symbol.dispose]();
    session.api[Symbol.dispose]();
  });
});
