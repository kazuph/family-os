const FAILURE_KEY = ".integration.local-blueprints-kv-emulator.failure";

export default function localBlueprintsKv(env) {
  let assertHealthy = async () => {
    if (await env.STORE.get(FAILURE_KEY) === "1") throw new Error("KV unavailable");
  };

  return {
    async get(key, options) {
      await assertHealthy();
      return env.STORE.get(key, options);
    },
    async getWithMetadata(key, options) {
      await assertHealthy();
      return env.STORE.getWithMetadata(key, options);
    },
    async put(key, value, options) {
      await assertHealthy();
      return env.STORE.put(key, value, options);
    },
    async delete(key) {
      await assertHealthy();
      return env.STORE.delete(key);
    },
    async list(options) {
      await assertHealthy();
      return env.STORE.list(options);
    },
    setFailure(value) {
      return value
        ? env.STORE.put(FAILURE_KEY, "1")
        : env.STORE.delete(FAILURE_KEY);
    },
  };
}
