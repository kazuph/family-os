import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { accessRateLimitKey, readCfAccessLoginIdentity, verifyCfAccessJwt } from "../src/access.js";

const accessEnv = {
  CF_ACCESS_AUD: "workshop-audience",
  CF_ACCESS_ISS: "https://team.cloudflareaccess.com",
};

describe("Cloudflare Access assertions", () => {
  it("verifies a real signed assertion and reuses the local Access JWKS transport", async () => {
    let { publicKey, privateKey } = await generateKeyPair("RS256");
    let publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    let token = await new SignJWT({ sub: "user-1", email: "person@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(accessEnv.CF_ACCESS_ISS)
      .setAudience(accessEnv.CF_ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    let jwksRequests = 0;
    let accessTransport: typeof fetch = async input => {
      let url = new URL(input.toString());
      if (url.pathname !== "/cdn-cgi/access/certs") return new Response(null, { status: 404 });
      jwksRequests++;
      return Response.json({ keys: [publicJwk] });
    };
    let request = new Request("https://workshop.example/api", {
      headers: { "cf-access-jwt-assertion": token },
    });

    await expect(verifyCfAccessJwt(request, accessEnv, undefined, accessTransport)).resolves
      .toMatchObject({ sub: "user-1", email: "person@example.com" });
    await expect(verifyCfAccessJwt(request, accessEnv, undefined, accessTransport)).resolves.not.toBeNull();
    expect(jwksRequests).toBe(1);
  });

  it("rejects missing and invalid assertions", async () => {
    const requestWithoutToken = new Request("https://workshop.example/api/client-errors");
    await expect(verifyCfAccessJwt(requestWithoutToken, accessEnv)).resolves.toBeNull();

    const requestWithToken = new Request("https://workshop.example/api/client-errors", {
      headers: { "cf-access-jwt-assertion": "invalid" },
    });
    await expect(verifyCfAccessJwt(requestWithToken, accessEnv)).resolves.toBeNull();
  });

  it("accepts only matching Access identity data and forwards only CF_Authorization", async () => {
    let request = new Request("https://workshop.example/api", {
      headers: { Cookie: "unrelated=value; CF_Authorization=identity-cookie" },
    });
    let sentCookie: string | null = null;
    let accessTransport: typeof fetch = async (_input, init) => {
      sentCookie = new Headers(init?.headers).get("Cookie");
      return Response.json({ id: "user-1", email: "person@example.com", iat: 100 });
    };
    await expect(readCfAccessLoginIdentity(request, accessEnv, {
      sub: "user-1", email: "person@example.com",
    }, accessTransport)).resolves.toBe(100);
    expect(sentCookie).toBe("CF_Authorization=identity-cookie");
    await expect(readCfAccessLoginIdentity(request, accessEnv, {
      sub: "user-1", email: "other@example.com",
    }, accessTransport)).resolves.toBeNull();
  });

  it("accepts production Access get-identity payloads that use user_uuid", async () => {
    let request = new Request("https://workshop.example/api", {
      headers: { Cookie: "CF_Authorization=identity-cookie" },
    });
    let accessTransport: typeof fetch = async () => Response.json({
      user_uuid: "bc601fc0-ba60-520f-b917-805bc3e12b41",
      email: "person@example.com",
      iat: 1786629080,
    });
    await expect(readCfAccessLoginIdentity(request, accessEnv, {
      sub: "bc601fc0-ba60-520f-b917-805bc3e12b41", email: "person@example.com",
    }, accessTransport)).resolves.toBe(1786629080);
    await expect(readCfAccessLoginIdentity(request, accessEnv, {
      sub: "other-subject", email: "person@example.com",
    }, accessTransport)).resolves.toBeNull();
  });
});

describe("accessRateLimitKey", () => {
  it("uses the verified subject and hashes email only as a fallback", async () => {
    await expect(accessRateLimitKey({ sub: "user-1", email: "person@example.com" }))
      .resolves.toBe("access-sub:user-1");
    const emailKey = await accessRateLimitKey({ email: "person@example.com" });
    expect(emailKey).toMatch(/^access-email:[0-9a-f]{64}$/);
    expect(emailKey).not.toContain("person@example.com");
  });
});
