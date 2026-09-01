import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import capnwebValidate from "capnweb-validate/vite";
import { defineConfig } from "vitest/config";

const EXPECTED_OPEN_ERROR_CODES = new Set([
  "WORKSPACE_NOT_FOUND",
  "WORKSPACE_ACCESS_DENIED",
]);

function isExpectedFamilySocketClose(error: unknown): boolean {
  return error instanceof Error
    && error.message.includes("Peer closed WebSocket: 1008 family profile capability revoked");
}

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
      if (typeof code === "string" && EXPECTED_OPEN_ERROR_CODES.has(code)) return true;
      if (isExpectedFamilySocketClose(error)) return true;
      if (error instanceof Error
          && error.message.includes("execution context which hosts this callback is no longer running")) {
        return true;
      }
      // The reset-recovery tests abort every Durable Object mid-session; capabilities that were
      // held across the abort (e.g. the fire-and-forget AdminSettings install kicked off by the
      // fetch handler) reject on their own schedule, independent of any awaited call.
      if (error.message?.includes("abortAllDurableObjects")) return true;
      // Same, for the test that aborts only the user DO (state.abort with this reason).
      if (error.message?.includes("user-DO flag probe reset")) return true;
      if (error.message?.includes("user-DO reset injected by test")) return true;
    },
  },
});
