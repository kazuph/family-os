const publicJwk = {
  kty: "RSA",
  n: "sYECP43MmvP-e65qnw-Tj7HY1waghWpua7W_jb9TmFix3PSzJ__V4K04dBtP-5j3Z7nqoKm5OI7L85oc2v_ANHvAmazt76v3SkVgk92z1sCnCPjVSPqeZb6onA-2l34QouGH__tgLuPDCdc51d5F98SS87WrP7u2Mt_-hZ00Gl49R4YFZknAcPYgjnyx7_lcrJXeIo7FdswXGAUsreUkf6LQqy7yjQZoapIQkuWO43kltvMcjFBLnp69m7YKhKJT1UVQrrN2j8M-sgau4NCTheX1T6krZcL-rchewQH6M-tiMv3OJyukf_LnEJPHF2IAd9TZ-G0Yuiqt7OiyyQypcQ",
  e: "AQAB", kid: "family-integration-key", alg: "RS256", use: "sig",
};

function loginIat(request) {
  let value = request.headers.get("Cookie")?.split(";").find(
      cookie => cookie.trim().startsWith("CF_Authorization="))?.trim().slice(17);
  return value && /^login-\d+$/.test(value) ? Number(value.slice(6)) : undefined;
}

export default {
  fetch(request) {
    let pathname = new URL(request.url).pathname;
    if (pathname === "/cdn-cgi/access/certs") return Response.json({ keys: [publicJwk] });
    if (pathname === "/cdn-cgi/access/get-identity") {
      let iat = loginIat(request);
      return iat
        ? Response.json({ id: "family-integration-adult", email: "adult@integration.test", iat })
        : new Response("Unauthorized", { status: 401 });
    }
    return new Response("Not Found", { status: 404 });
  },
};
