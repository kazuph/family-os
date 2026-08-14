import { exports } from "cloudflare:workers";
import { env } from "cloudflare:workers";
import { importJWK, SignJWT, type JWK } from "jose";
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

const issuer = "https://access.integration.test";
const audience = "family-integration-audience";
const adult = { sub: "family-integration-adult", email: "adult@integration.test" };
const privateJwk: JWK = {
  kty: "RSA", n: "sYECP43MmvP-e65qnw-Tj7HY1waghWpua7W_jb9TmFix3PSzJ__V4K04dBtP-5j3Z7nqoKm5OI7L85oc2v_ANHvAmazt76v3SkVgk92z1sCnCPjVSPqeZb6onA-2l34QouGH__tgLuPDCdc51d5F98SS87WrP7u2Mt_-hZ00Gl49R4YFZknAcPYgjnyx7_lcrJXeIo7FdswXGAUsreUkf6LQqy7yjQZoapIQkuWO43kltvMcjFBLnp69m7YKhKJT1UVQrrN2j8M-sgau4NCTheX1T6krZcL-rchewQH6M-tiMv3OJyukf_LnEJPHF2IAd9TZ-G0Yuiqt7OiyyQypcQ", e: "AQAB",
  d: "BGg7yT6M32ZKWdFq3uoG57cCh3S3-rYJubGGmPcwlPhTSrVV5yrnSVu9qobU054wut3jKyPpqBOGEXVgrOiTke4Gaj5gnj44nqrGLweut9ja0NqGR6iG0yeCpdTPS5e_A59KRlccRE_GA34ZNtPc7H3gSO4oW0XOrFjSx8gfX33vro2npj_PPK9oLgFNLnRibZROWGKDcCohj_dVdMuiCPz33r7yL0s6K8s3x-tjuZTC9-x0WO9u57iILTtd0JwJO6uUfiaXn6-yihSLhThry_lu8v_V6qlDdhDqKZOXWg1ZRJC_q2IdTKZGg9WlaD25U13oWxKu9DfH86U5HqAGIQ",
  p: "98rHDM8uW5_TSiCXfgiY8eu2KWSw1mfhn5660aTh_d0GFRoHq4OfzgNFsXh1SP-KerVuFGUOgcJcd6pYwyDPRM1Z6USwwYKIffD5LxttXzcWXSXHUjJkbrFt3Izf8OyFM8tDJhBrIOTv-na11FOmD2GRYq3jACNkxFdCn7mUDWE", q: "t2I0AAJwlBqxci1GvtUHIgZnqHCuXEsrwsnZJEtwdesrNtuWibwoTCZcCxG4LZaHmfS9OUGxYL3vKW9dzW-gsxmb3o2A_M7Mh57ZtABGtzXUHqYvOh_Nk5T4WZhW8tjdgysqY_IW7TBuNHjhtzHhq4O-8TZqRcHafFe0DfOXhhE",
  dp: "KI3xgfEunyRLSmiHIsN5dK6lQ6UNJCogTSWHYeRgcFIKOs3lz3ZdYzQ55c_XMjlQisDC4Wegti__Pj6NBHKMObB6NKlfXGxmtmYIAmO0xM6ZRGl4c8V3ln5Hgr8zr5SmQFHWDZbGUb3mYNGo9LU0CnRnfQUEj_M6_L9jUgznZEE", dq: "k1ze3IMZZGpu3Yl0qDUXnkf3VGv4MUJW0BjT3U6h-KAaAeNDfTsuRsMsg9ihYEDuhtEcnb4kg9EdNva_Mi7ZvBKAJr8fQAgOY41K9FKkgOVIp7hziwmzcTzstVKtzEho-NbfIaGQutmINbJN76Ct793Wuo83pwa4Q-NWVT_CK4E", qi: "c6pzZHHA337JbvAIKZnuqcpu2TUapW1axG94MsSkDJ6xFvC5FvQCTDYCiICSaS2NfQK3Ws4kr_HKYfxQPtaeukdSH07enQR2e668xQfrioow0_yu8h0gR8g-DcoX404Bcy6FGFh7ZuVXDRv32D83hGNIfLDTbB7LiMzwYpEsopQ",
};

type Connection = { api: RpcStub<PublicApi>; family: RpcStub<FamilyEntry>; cookie: string; closed: Promise<void> };

async function reject(value: PromiseLike<unknown>): Promise<unknown> {
  try { await value; } catch (error) { return error; }
  throw new Error("Expected RPC rejection.");
}

function expectFamilyRpcError<T>(result: FamilyRpcResult<T>,
    code: typeof FAMILY_ERROR_CODES[keyof typeof FAMILY_ERROR_CODES]) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe(code);
}

async function token(appIat: number): Promise<string> {
  let key = await importJWK(privateJwk, "RS256");
  return new SignJWT(adult).setProtectedHeader({ alg: "RS256", kid: "family-integration-key" })
    .setIssuer(issuer).setAudience(audience).setIssuedAt(appIat).setExpirationTime("1h").sign(key);
}

async function connect(loginIat: number, appIat: number, deviceCookie?: string): Promise<Connection> {
  let cookie = [deviceCookie, `CF_Authorization=login-${loginIat}`].filter(Boolean).join("; ");
  let response = await exports.default.fetch(new Request("https://workshop.invalid/api", {
    headers: { Upgrade: "websocket", Origin: "https://workshop.invalid", Cookie: cookie,
      "cf-access-jwt-assertion": await token(appIat) },
  }));
  if (response.status !== 101) throw new Error(`Access handshake failed: ${response.status} ${await response.text()}`);
  if (!response.webSocket) throw new TypeError("Expected a WebSocket response.");
  response.webSocket.addEventListener("error", () => {});
  let closed = new Promise<void>(resolve => response.webSocket!.addEventListener("close", () => resolve(), { once: true }));
  response.webSocket.accept();
  let api = newWebSocketRpcSession<PublicApi>(response.webSocket);
  api.onRpcBroken(() => {});
  let family = await api.authenticateFromCfAccess();
  family.onRpcBroken(() => {});
  return { api, family, closed, cookie: response.headers.get("Set-Cookie")?.split(";", 1)[0] ?? deviceCookie! };
}

describe("Family OS Access device generation", () => {
  it("closes same-device stale capabilities and accepts only a newer identity login", async () => {
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
    expect(onboardingModels.some(model => model.id === "deepseek-v4-flash")).toBe(true);
    unwrapFamilyRpcResult(await onboardingApi.setPreferredModel("deepseek-v4-flash"));
    await onboardingApi.completeOnboarding();
    await expect(onboardingApi.isOnboardingCompleted()).resolves.toBe(true);
    await expect(onboardingApi.getPreferredModel()).resolves.toBe("deepseek-v4-flash");
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
    await second.closed;
    expectFamilyRpcError(
      await sameSessionWorkspace.createShareLink("build"),
      FAMILY_ERROR_CODES.profileCapabilityRevoked,
    );
    sameSessionAdult[Symbol.dispose]();
    await expect(otherDeviceApi.whoami()).resolves.toMatchObject({ type: 'user' });
    second.api[Symbol.dispose]();
    otherDeviceApi[Symbol.dispose]();
    otherDevice.family[Symbol.dispose]();
    otherDevice.api[Symbol.dispose]();
    await expect(reject(staleAdult.whoami())).resolves.toBeTruthy();
    await expect(reject(staleDerived.getMetadata())).resolves.toBeTruthy();

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
    await Promise.all([childSession.closed, lockObserver.closed]);
    expectFamilyRpcError(thirdResult, FAMILY_ERROR_CODES.passcodeReauthenticationRequired);
    childSession.family[Symbol.dispose]();
    childSession.api[Symbol.dispose]();
    lockObserver.family[Symbol.dispose]();
    lockObserver.api[Symbol.dispose]();
    await expect(reject(staleChild.whoami())).resolves.toBeTruthy();
    await expect(reject(staleChildDerived.getMetadata())).resolves.toBeTruthy();

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
