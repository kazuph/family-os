import { createRemoteJWKSet, customFetch, jwtVerify, type JWTPayload } from "jose";

/** Cloudflare Access settings required to verify an assertion. */
export type CfAccessEnv = Readonly<{
  CF_ACCESS_AUD?: string;
  CF_ACCESS_ISS?: string;
}>;

type AccessTokenVerifier = (token: string, env: CfAccessEnv) => Promise<JWTPayload>;

/** The one outbound HTTP transport used for Access JWKS and identity requests. */
export type CfAccessFetch = typeof fetch;

const remoteJwkSets = new WeakMap<CfAccessFetch, Map<string, ReturnType<typeof createRemoteJWKSet>>>();

function accessIssuerOrigin(env: CfAccessEnv): URL {
  if (!env.CF_ACCESS_AUD || !env.CF_ACCESS_ISS) {
    throw new Error("Cloudflare Access issuer and audience must both be configured.");
  }
  let issuer = new URL(env.CF_ACCESS_ISS);
  if (issuer.protocol !== "https:" || issuer.username || issuer.password || issuer.search
      || issuer.hash || (issuer.pathname !== "" && issuer.pathname !== "/")) {
    throw new Error("Cloudflare Access issuer must be an HTTPS origin.");
  }
  return issuer;
}

async function verifyToken(
    token: string, env: CfAccessEnv, fetchIdentity: CfAccessFetch = globalThis.fetch): Promise<JWTPayload> {
  let issuer = accessIssuerOrigin(env);
  let issuerJwks = remoteJwkSets.get(fetchIdentity) ?? new Map();
  remoteJwkSets.set(fetchIdentity, issuerJwks);
  let jwks = issuerJwks.get(issuer.origin);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer), {
      [customFetch]: (url, options) => fetchIdentity(url, options),
    });
    issuerJwks.set(issuer.origin, jwks);
  }
  return (await jwtVerify(token, jwks, {
    issuer: issuer.origin,
    audience: env.CF_ACCESS_AUD,
  })).payload;
}

/** Returns verified Cloudflare Access claims, or null when the assertion cannot be trusted. */
export async function verifyCfAccessJwt(
    request: Request,
    env: CfAccessEnv,
    verifier?: AccessTokenVerifier,
    fetchIdentity: CfAccessFetch = globalThis.fetch): Promise<JWTPayload | null> {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  try {
    return await (verifier ? verifier(token, env) : verifyToken(token, env, fetchIdentity));
  } catch {
    return null;
  }
}

function accessAuthorizationCookie(request: Request): string | null {
  let cookies = request.headers.get("Cookie")?.split(";") ?? [];
  let authorization = cookies.find((cookie) => cookie.trim().startsWith("CF_Authorization="))
      ?.trim();
  return authorization && authorization.length > "CF_Authorization=".length ? authorization : null;
}

/**
 * Reads the Access global-login timestamp after the application assertion has been verified.
 * The injected transport is shared with JWT verification; parsing and identity checks remain here.
 */
export async function readCfAccessLoginIdentity(
    request: Request,
    env: CfAccessEnv,
    verifiedPayload: JWTPayload,
    fetchIdentity: CfAccessFetch = globalThis.fetch): Promise<number | null> {
  let cookie = accessAuthorizationCookie(request);
  if (!cookie || typeof verifiedPayload.email !== "string" || typeof verifiedPayload.sub !== "string") {
    return null;
  }
  try {
    let issuer = accessIssuerOrigin(env);
    let response = await fetchIdentity(new URL("/cdn-cgi/access/get-identity", issuer), {
      headers: { Cookie: cookie, Accept: "application/json" },
      redirect: "manual",
    });
    if (response.redirected || (response.status >= 300 && response.status < 400)
        || !response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
    let identity: unknown = await response.json();
    if (!identity || typeof identity !== "object") return null;
    // Production Access returns `user_uuid` (see CloudflareAccessIdentity). Local emulators and
    // older fixtures may still use `id` / `sub`; accept any of them as the JWT subject.
    let { email, id, sub, user_uuid, iat } = identity as Record<string, unknown>;
    let identitySubject = id ?? sub ?? user_uuid;
    if (email !== verifiedPayload.email || identitySubject !== verifiedPayload.sub) {
      return null;
    }
    return typeof iat === "number" && Number.isFinite(iat) && Number.isInteger(iat) && iat > 0
      ? iat
      : null;
  } catch {
    return null;
  }
}

/** Returns a privacy-preserving limiter key derived only from verified Access claims. */
export async function accessRateLimitKey(payload: JWTPayload): Promise<string | null> {
  if (payload.sub) return `access-sub:${payload.sub}`;
  if (typeof payload.email !== "string" || payload.email.length === 0) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload.email));
  return `access-email:${new Uint8Array(digest).toHex()}`;
}
