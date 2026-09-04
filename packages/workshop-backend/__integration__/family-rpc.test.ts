import { exports } from "cloudflare:workers";
import { env } from "cloudflare:workers";
import { newWebSocketRpcSession, type RpcStub } from "capnweb";
import {
  FAMILY_ERROR_CODES,
  type FamilyEntry,
  type FamilyRpcResult,
  type PublicApi,
  unwrapFamilyRpcResult,
} from "@gadgets/workshop-shared/api";
import { describe, expect, it } from "vitest";
import { readCfAccessLoginIdentity } from "../src/access.js";
import {
  FAMILY_ACCESS_ADULT as adult,
  FAMILY_ACCESS_API_URL,
  FAMILY_ACCESS_AUDIENCE as audience,
  FAMILY_ACCESS_ISSUER as issuer,
  signFamilyAccessJwt as token,
} from "./family-access-jwt.js";

type Connection = { api: RpcStub<PublicApi>; family: RpcStub<FamilyEntry>; cookie: string };

async function reject(value: PromiseLike<unknown>): Promise<unknown> {
  try { await value; } catch (error) { return error; }
  throw new Error("Expected RPC rejection.");
}

function expectFamilyRpcError<T>(result: FamilyRpcResult<T>,
    code: typeof FAMILY_ERROR_CODES[keyof typeof FAMILY_ERROR_CODES]) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe(code);
}

async function connect(loginIat: number, appIat: number, deviceCookie?: string): Promise<Connection> {
  let cookie = [deviceCookie, `CF_Authorization=login-${loginIat}`].filter(Boolean).join("; ");
  let response = await exports.default.fetch(new Request(FAMILY_ACCESS_API_URL, {
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

describe("Family OS Access device generation", () => {
  it("rejects a stale browser client before opening a Worker session", async () => {
    let response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
      headers: { Upgrade: "websocket", Origin: "https://workshop.invalid" },
    }));
    expect(response.status).toBe(426);
    await expect(response.text()).resolves.toBe("Reload Family OS to update the client.");
  });

  it("serves an Access WebSocket from the Worker-owned session", async () => {
    let connection = await connect(50, 1);
    await expect(connection.api.ping()).resolves.toBeUndefined();
    connection.family[Symbol.dispose]();
    connection.api[Symbol.dispose]();
  });

  it("rejects same-device stale capabilities and accepts only a newer identity login", async () => {
    let directIdentity = await env.ACCESS_IDENTITY.fetch(
      new Request(`${issuer}/cdn-cgi/access/get-identity`, {
        headers: { Cookie: "CF_Authorization=login-100", Accept: "application/json" },
      }),
    );
    expect(directIdentity.status).toBe(200);
    expect(directIdentity.headers.get("content-type")).toContain("application/json");
    let directJson: unknown = await directIdentity.json();
    expect(directJson).toEqual(expect.objectContaining({
      email: expect.any(String), id: expect.any(String), iat: expect.any(Number),
    }));
    let identityIat = await readCfAccessLoginIdentity(
      new Request("https://workshop.invalid/api", {
        headers: { Cookie: "CF_Authorization=login-100" },
      }),
      { CF_ACCESS_AUD: audience, CF_ACCESS_ISS: issuer },
      { email: adult.email, sub: adult.sub },
      (input, init) => env.ACCESS_IDENTITY.fetch(input, init),
    );
    expect(identityIat).toBe(100);
    let first = await connect(100, 1);
    expectFamilyRpcError(await first.family.getAuthenticatedApi(), FAMILY_ERROR_CODES.profileSelectionRequired);
    unwrapFamilyRpcResult(await first.family.selectAdultProfile());
    let onboardingApi = unwrapFamilyRpcResult(await first.family.getAuthenticatedApi());
    onboardingApi.onRpcBroken(() => {});
    await expect(onboardingApi.isOnboardingCompleted()).resolves.toBe(false);
    await onboardingApi.setOwnDisplayName("Guardian");
    unwrapFamilyRpcResult(await first.family.setMonsterAvatar("monster-01-warm"));
    let onboardingModels = await onboardingApi.listModels();
    expect(onboardingModels.map(model => model.id)).toEqual(expect.arrayContaining([
      "deepseek-v4-flash",
      "deepseek-v4-pro",
      "glm-5.3",
      "glm-5.3-flash",
      "kimi-k3",
    ]));
    unwrapFamilyRpcResult(await onboardingApi.setPreferredModel("deepseek-v4-flash"));
    await onboardingApi.completeOnboarding();
    await expect(onboardingApi.isOnboardingCompleted()).resolves.toBe(true);
    await expect(onboardingApi.getPreferredModel()).resolves.toBe("deepseek-v4-flash");

    using bookWorkspace = await onboardingApi.newGadgetFromBlueprint("format.book", {
      AI: { type: "aiModel", modelId: "glm-5.3-flash" },
    });
    let bookMetadata = await bookWorkspace.getMetadata();
    expect(bookMetadata.defaultGadgetId).toEqual(expect.any(Number));
    using bookGadget = await bookWorkspace.getGadget(bookMetadata.defaultGadgetId!);
    let bookBundle = await bookGadget.getUiBundle();
    expect(bookBundle?.jsCode).toContain("gadget.getBookFiles");
    expect(bookBundle?.jsCode).not.toContain("client.js.gz/");

    onboardingApi[Symbol.dispose]();
    unwrapFamilyRpcResult(await first.family.setHouseholdPasscode("123456"));
    let child = unwrapFamilyRpcResult(await first.family.createChildProfile("Child")).childProfiles[0];
    if (!child) throw new Error("Expected child profile.");

    let sameSessionAdult = unwrapFamilyRpcResult(await first.family.getAuthenticatedApi());
    sameSessionAdult.onRpcBroken(() => {});
    using sameSessionWorkspace = await sameSessionAdult.newGadget();
    sameSessionWorkspace.onRpcBroken(() => {});
    let second = await connect(100, 2, first.cookie);
    let staleAdult = unwrapFamilyRpcResult(await second.family.getAuthenticatedApi());
    staleAdult.onRpcBroken(() => {});
    let staleDerived = await staleAdult.newGadget();
    staleDerived.onRpcBroken(() => {});
    let otherDevice = await connect(100, 50);
    unwrapFamilyRpcResult(await otherDevice.family.selectChildProfile(child.id));
    let otherDeviceApi = unwrapFamilyRpcResult(await otherDevice.family.getAuthenticatedApi());
    otherDeviceApi.onRpcBroken(() => {});
    unwrapFamilyRpcResult(await first.family.selectChildProfile(child.id));
    expectFamilyRpcError(
      await sameSessionWorkspace.createShareLink("build"),
      FAMILY_ERROR_CODES.profileCapabilityRevoked,
    );
    sameSessionAdult[Symbol.dispose]();
    await expect(otherDeviceApi.whoami()).resolves.toMatchObject({ type: 'user' });
    await expect(reject(staleAdult.whoami())).resolves.toBeTruthy();
    expectFamilyRpcError(
      await staleDerived.createShareLink("build"),
      FAMILY_ERROR_CODES.profileCapabilityRevoked,
    );
    staleDerived[Symbol.dispose]();
    staleAdult[Symbol.dispose]();
    second.family[Symbol.dispose]();
    second.api[Symbol.dispose]();
    otherDeviceApi[Symbol.dispose]();
    otherDevice.family[Symbol.dispose]();
    otherDevice.api[Symbol.dispose]();

    let childSession = await connect(100, 3, first.cookie);
    let childApi = unwrapFamilyRpcResult(await childSession.family.getAuthenticatedApi());
    childApi.onRpcBroken(() => {});
    // Child profiles skip the adult setup wizard; re-mint after reload must stay past onboarding.
    await expect(childApi.isOnboardingCompleted()).resolves.toBe(true);
    // Adult-only management fails closed without throwing across Cap'n Web (null capability).
    await expect(childApi.getAdminApi()).resolves.toBeNull();
    await expect(childApi.amIAdmin()).resolves.toBe(false);
    // Representative adult-only mutations return the stable Family Result code (not Cap'n Web throws).
    expectFamilyRpcError(await childApi.connectAccount("github"), FAMILY_ERROR_CODES.adultProfileRequired);
    expectFamilyRpcError(
      await childApi.addModel(
        { type: "agent", id: "child-denied-model", name: "Denied" },
        { provider: "openai", model: "gpt-4o-mini", apiToken: "x" },
      ),
      FAMILY_ERROR_CODES.adultProfileRequired,
    );
    // Reads needed for existing AI use remain available to children.
    await expect(childApi.listModels()).resolves.toEqual(expect.any(Array));
    // The Family guard must run before the reset-retry wrapper: child connector discovery stays
    // hidden instead of reaching the User DO, while ordinary replay-safe reads remain available.
    await expect(childApi.listGatekeeperVendors()).resolves.toEqual([]);
    using childWorkspace = await childApi.newGadget();
    childWorkspace.onRpcBroken(() => {});
    expectFamilyRpcError(
      await childWorkspace.createShareLink("build"),
      FAMILY_ERROR_CODES.adultProfileRequired,
    );
    // Blank workspaces no longer auto-mint defaultGadgetId; create an explicit gadget for publish deny.
    using childGadget = await childWorkspace.createGadget("Child publish probe");
    childGadget.onRpcBroken(() => {});
    expectFamilyRpcError(
      await childGadget.createBlueprint("child-denied-blueprint"),
      FAMILY_ERROR_CODES.adultProfileRequired,
    );
    childApi[Symbol.dispose]();
    let lockObserver = await connect(100, 4, first.cookie);
    let staleChild = unwrapFamilyRpcResult(await lockObserver.family.getAuthenticatedApi());
    staleChild.onRpcBroken(() => {});
    let staleChildDerived = await staleChild.newGadget();
    staleChildDerived.onRpcBroken(() => {});
    expectFamilyRpcError(await childSession.family.switchToAdultProfile("000000"), FAMILY_ERROR_CODES.passcodeInvalid);
    expectFamilyRpcError(await childSession.family.switchToAdultProfile("000000"), FAMILY_ERROR_CODES.passcodeInvalid);
    let thirdResult = await childSession.family.switchToAdultProfile("000000");
    expectFamilyRpcError(thirdResult, FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    await expect(reject(staleChild.whoami())).resolves.toBeTruthy();
    expectFamilyRpcError(
      await staleChildDerived.createShareLink("build"),
      FAMILY_ERROR_CODES.profileCapabilityRevoked,
    );
    staleChildDerived[Symbol.dispose]();
    staleChild[Symbol.dispose]();
    childSession.family[Symbol.dispose]();
    childSession.api[Symbol.dispose]();
    lockObserver.family[Symbol.dispose]();
    lockObserver.api[Symbol.dispose]();

    let refreshedApplicationJwt = await connect(100, 999, first.cookie);
    await expect(refreshedApplicationJwt.family.getState()).resolves.toMatchObject({ requiresAccessReauthentication: true });
    expectFamilyRpcError(await refreshedApplicationJwt.family.getAuthenticatedApi(),
        FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    let unknownDevice = await connect(100, 5);
    expectFamilyRpcError(await unknownDevice.family.selectAdultProfile(), FAMILY_ERROR_CODES.passcodeInvalid);
    unwrapFamilyRpcResult(await unknownDevice.family.selectChildProfile(child.id));

    let reauthenticated = await connect(101, 6, first.cookie);
    let recoveredAdult = unwrapFamilyRpcResult(await reauthenticated.family.getAuthenticatedApi());
    await expect(recoveredAdult.whoami()).resolves.toMatchObject({ id: adult.email });

    first.family[Symbol.dispose]();
    first.api[Symbol.dispose]();
    reauthenticated.family[Symbol.dispose]();
    reauthenticated.api[Symbol.dispose]();
    refreshedApplicationJwt.family[Symbol.dispose]();
    refreshedApplicationJwt.api[Symbol.dispose]();
    unknownDevice.family[Symbol.dispose]();
    unknownDevice.api[Symbol.dispose]();
  });
});
