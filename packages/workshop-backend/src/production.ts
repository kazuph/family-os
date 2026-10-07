import workshop from "./server";
export * from "./server";

/** Keeps the deployed Workshop and Context paths on their existing public origin. */
export default {
  async fetch(request: Request, env: Cloudflare.Env & {CONTEXT_HTTP: Fetcher}, ctx: ExecutionContext) {
    let path = new URL(request.url).pathname;
    if (path === "/gatekeeper/context" || path.startsWith("/gatekeeper/context/")) {
      return env.CONTEXT_HTTP.fetch(request);
    }
    return workshop.fetch(request, env, ctx);
  },
};
