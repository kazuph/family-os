import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import capnwebValidate from "capnweb-validate/vite";
import { defineConfig } from "vitest/config";

const EXPECTED_RPC_ERROR_CODES = new Set([
  "WORKSPACE_NOT_FOUND",
  "WORKSPACE_ACCESS_DENIED",
  "FAMILY_PROFILE_CAPABILITY_REVOKED",
]);

export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [
    capnwebValidate(),
    cloudflareTest({
      main: "./src/server.ts",
      remoteBindings: false,
      miniflare: {
        bindings: {
          CF_ACCESS_AUD: "family-integration-audience",
          CF_ACCESS_ISS: "https://access.integration.test",
          OPENCODE_GO_API_TOKEN: "integration-opencode-go-token",
        },
        serviceBindings: {
          ACCESS_IDENTITY: "local-access-emulator",
        },
        workers: [{
          name: "local-access-emulator",
          modules: true,
          scriptPath: "./__integration__/local-access-emulator.js",
        }],
      },
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
    }),
  ],
  test: {
    include: ["__integration__/*.test.ts"],
    globalSetup: ["./scripts/prepare-integration-test.mjs"],
    // Whichever test runs first pays for workerd booting and instantiating the whole backend
    // bundle -- ~6s on a dev machine and roughly 3x that on a CI runner, while every subsequent
    // test in the file finishes in tens of milliseconds. The timeout has to clear that cold
    // start, not the steady-state cost, or the first test fails wherever the runner is slow.
    testTimeout: 120_000,
    // A rejected future capability is reported independently from the awaited pipelined call.
    // The tests assert these exact rejections; all unrelated unhandled errors remain fatal.
    onUnhandledError(error) {
      const code = "code" in error ? error.code : undefined;
      const message = "message" in error && typeof error.message === "string" ? error.message : "";
      if (typeof code === "string" && EXPECTED_RPC_ERROR_CODES.has(code)) return false;
      if (message.includes("execution context which hosts this callback is no longer running")) {
        return false;
      }
      // The reset-recovery tests abort every Durable Object mid-session; capabilities that were
      // held across the abort (e.g. the fire-and-forget AdminSettings install kicked off by the
      // fetch handler) reject on their own schedule, independent of any awaited call.
      if (message.includes("abortAllDurableObjects")) return false;
      // Same, for the test that aborts only the user DO (state.abort with this reason).
      if (message.includes("user-DO flag probe reset")) return false;
      if (message.includes("user-DO reset injected by test")) return false;
    },
  },
});
