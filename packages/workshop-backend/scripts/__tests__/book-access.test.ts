import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyCfAccessJwt } from "../../src/access.ts";

const audience = "book-local-audience";
const key = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(key.publicKey), kid: "local-book-key", alg: "RS256", use: "sig" };
const server = createServer((req, res) => {
  if (req.url !== "/cdn-cgi/access/certs") { res.writeHead(404).end(); return; }
  res.writeHead(200, {"content-type": "application/json"}).end(JSON.stringify({keys: [jwk]}));
});
let issuer: string;
before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No server port.");
  issuer = `http://127.0.0.1:${address.port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

async function signed(overrides: {issuer?: string; audience?: string; expired?: boolean; foreignKey?: boolean} = {}) {
  const signingKey = overrides.foreignKey ? (await generateKeyPair("RS256")).privateKey : key.privateKey;
  return new SignJWT({email: "BookOwner@local.test"})
    .setProtectedHeader({alg: "RS256", kid: jwk.kid})
    .setIssuer(overrides.issuer ?? issuer).setAudience(overrides.audience ?? audience)
    .setExpirationTime(overrides.expired ? 1 : "5m").sign(signingKey);
}
async function verify(token: string, settings = {CF_ACCESS_ISS: issuer, CF_ACCESS_AUD: audience}) {
  return verifyCfAccessJwt(new Request("http://localhost/mcp", {headers: {"cf-access-jwt-assertion": token}}), settings);
}
test("real JWKS validates signature and retains identity spelling", async () => {
  const payload = await verify(await signed());
  assert.equal(payload?.email, "BookOwner@local.test");
});
for (const [name, overrides] of [
  ["wrong signing key", {foreignKey: true}], ["wrong issuer", {issuer: "http://different-issuer"}],
  ["wrong audience", {audience: "different-audience"}], ["expired", {expired: true}],
] as const) {
  test(`real JWKS refuses ${name}`, async () => assert.equal(await verify(await signed(overrides)), null));
}
test("missing issuer and audience disable assertion authentication", async () => {
  assert.equal(await verify(await signed(), {CF_ACCESS_ISS: "", CF_ACCESS_AUD: ""}), null);
});
