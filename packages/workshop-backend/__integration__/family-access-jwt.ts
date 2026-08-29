import { importJWK, SignJWT, type JWK } from "jose";

/** Shared Access-emulator identity for Family OS integration tests. Kept in one place so the
 * `local-access-emulator.js` / `scripts/sign-family-dev-jwt.mjs` keys don't drift across the
 * test files that sign JWTs against them. */
export const FAMILY_ACCESS_ISSUER = "https://access.integration.test";
export const FAMILY_ACCESS_AUDIENCE = "family-integration-audience";
// local-access-emulator.js hardcodes this identity for every login-<iat> cookie value.
export const FAMILY_ACCESS_ADULT = { sub: "family-integration-adult", email: "adult@integration.test" };

const FAMILY_ACCESS_PRIVATE_JWK: JWK = {
  kty: "RSA", n: "sYECP43MmvP-e65qnw-Tj7HY1waghWpua7W_jb9TmFix3PSzJ__V4K04dBtP-5j3Z7nqoKm5OI7L85oc2v_ANHvAmazt76v3SkVgk92z1sCnCPjVSPqeZb6onA-2l34QouGH__tgLuPDCdc51d5F98SS87WrP7u2Mt_-hZ00Gl49R4YFZknAcPYgjnyx7_lcrJXeIo7FdswXGAUsreUkf6LQqy7yjQZoapIQkuWO43kltvMcjFBLnp69m7YKhKJT1UVQrrN2j8M-sgau4NCTheX1T6krZcL-rchewQH6M-tiMv3OJyukf_LnEJPHF2IAd9TZ-G0Yuiqt7OiyyQypcQ", e: "AQAB",
  d: "BGg7yT6M32ZKWdFq3uoG57cCh3S3-rYJubGGmPcwlPhTSrVV5yrnSVu9qobU054wut3jKyPpqBOGEXVgrOiTke4Gaj5gnj44nqrGLweut9ja0NqGR6iG0yeCpdTPS5e_A59KRlccRE_GA34ZNtPc7H3gSO4oW0XOrFjSx8gfX33vro2npj_PPK9oLgFNLnRibZROWGKDcCohj_dVdMuiCPz33r7yL0s6K8s3x-tjuZTC9-x0WO9u57iILTtd0JwJO6uUfiaXn6-yihSLhThry_lu8v_V6qlDdhDqKZOXWg1ZRJC_q2IdTKZGg9WlaD25U13oWxKu9DfH86U5HqAGIQ",
  p: "98rHDM8uW5_TSiCXfgiY8eu2KWSw1mfhn5660aTh_d0GFRoHq4OfzgNFsXh1SP-KerVuFGUOgcJcd6pYwyDPRM1Z6USwwYKIffD5LxttXzcWXSXHUjJkbrFt3Izf8OyFM8tDJhBrIOTv-na11FOmD2GRYq3jACNkxFdCn7mUDWE", q: "t2I0AAJwlBqxci1GvtUHIgZnqHCuXEsrwsnZJEtwdesrNtuWibwoTCZcCxG4LZaHmfS9OUGxYL3vKW9dzW-gsxmb3o2A_M7Mh57ZtABGtzXUHqYvOh_Nk5T4WZhW8tjdgysqY_IW7TBuNHjhtzHhq4O-8TZqRcHafFe0DfOXhhE",
  dp: "KI3xgfEunyRLSmiHIsN5dK6lQ6UNJCogTSWHYeRgcFIKOs3lz3ZdYzQ55c_XMjlQisDC4Wegti__Pj6NBHKMObB6NKlfXGxmtmYIAmO0xM6ZRGl4c8V3ln5Hgr8zr5SmQFHWDZbGUb3mYNGo9LU0CnRnfQUEj_M6_L9jUgznZEE", dq: "k1ze3IMZZGpu3Yl0qDUXnkf3VGv4MUJW0BjT3U6h-KAaAeNDfTsuRsMsg9ihYEDuhtEcnb4kg9EdNva_Mi7ZvBKAJr8fQAgOY41K9FKkgOVIp7hziwmzcTzstVKtzEho-NbfIaGQutmINbJN76Ct793Wuo83pwa4Q-NWVT_CK4E", qi: "c6pzZHHA337JbvAIKZnuqcpu2TUapW1axG94MsSkDJ6xFvC5FvQCTDYCiICSaS2NfQK3Ws4kr_HKYfxQPtaeukdSH07enQR2e668xQfrioow0_yu8h0gR8g-DcoX404Bcy6FGFh7ZuVXDRv32D83hGNIfLDTbB7LiMzwYpEsopQ",
};

/** Signs an Access assertion JWT accepted by `local-access-emulator.js` for the shared test adult. */
export async function signFamilyAccessJwt(appIat: number): Promise<string> {
  let key = await importJWK(FAMILY_ACCESS_PRIVATE_JWK, "RS256");
  return new SignJWT(FAMILY_ACCESS_ADULT).setProtectedHeader({ alg: "RS256", kid: "family-integration-key" })
    .setIssuer(FAMILY_ACCESS_ISSUER).setAudience(FAMILY_ACCESS_AUDIENCE)
    .setIssuedAt(appIat).setExpirationTime("1h").sign(key);
}

/** Signs an Access service-token assertion for non-interactive MCP integration tests. */
export async function signFamilyServiceJwt(appIat: number): Promise<string> {
  let key = await importJWK(FAMILY_ACCESS_PRIVATE_JWK, "RS256");
  return new SignJWT({ sub: "family-integration-service", common_name: "family-mcp.integration" })
    .setProtectedHeader({ alg: "RS256", kid: "family-integration-key" })
    .setIssuer(FAMILY_ACCESS_ISSUER).setAudience(FAMILY_ACCESS_AUDIENCE)
    .setIssuedAt(appIat).setExpirationTime("1h").sign(key);
}
