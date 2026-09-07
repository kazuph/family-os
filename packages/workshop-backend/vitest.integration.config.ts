import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import capnwebValidate from "capnweb-validate/vite";
import { defineConfig } from "vitest/config";
import { unstable_getMiniflareWorkerOptions, unstable_readConfig } from "wrangler";

// Replace this one KV binding with the local fault-capable emulator. Miniflare merges
// binding maps additively, so remove the native binding before composing worker options.
const runtimeConfig = unstable_readConfig({config: "./wrangler.jsonc"});
runtimeConfig.kv_namespaces = runtimeConfig.kv_namespaces.filter(binding => binding.binding !== "BLUEPRINTS");
const {workerOptions, externalWorkers, define} = unstable_getMiniflareWorkerOptions(
    runtimeConfig, undefined, {overrides: {enableContainers: false}});

const EXPECTED_RPC_ERROR_CODES = new Set([
  "WORKSPACE_NOT_FOUND",
  "WORKSPACE_ACCESS_DENIED",
  "FAMILY_PROFILE_CAPABILITY_REVOKED",
]);

export default defineConfig({
  define,
  esbuild: {
    target: "es2022",
  },
  plugins: [
    capnwebValidate(),
    cloudflareTest({
      main: "./src/server.ts",
      remoteBindings: false,
      miniflare: {
        ...workerOptions,
        compatibilityFlags: workerOptions.compatibilityFlags,
        wrappedBindings: {
          BLUEPRINTS: {
            scriptName: "local-blueprints-kv-emulator",
            bindings: {NAMESPACE: "gadgets-blueprint-metadata"},
          },
        },
        bindings: {
          ...workerOptions.bindings,
          CF_ACCESS_AUD: "family-integration-audience",
          CF_ACCESS_ISS: "https://access.integration.test",
          OPENCODE_GO_API_TOKEN: "integration-opencode-go-token",
        },
        serviceBindings: {
          ...workerOptions.serviceBindings,
          ACCESS_IDENTITY: "local-access-emulator",
          LOCAL_ACTION_PROVIDER: "local-action-provider",
          LOCAL_HOOK_CONTROLLER: "local-hook-controller-emulator",
        },
        workers: [...externalWorkers, {
          name: "local-blueprints-kv-emulator",
          modules: true,
          scriptPath: "./__integration__/local-blueprints-kv-emulator.js",
          kvNamespaces: {STORE: "gadgets-blueprint-metadata"},
        }, {
          name: "local-action-provider",
          modules: true,
          scriptPath: "./__integration__/local-action-provider.js",
          compatibilityDate: "2026-02-02",
          compatibilityFlags: ["allow_irrevocable_stub_storage"],
          durableObjects: {PROVIDER: {className: "LocalActionProvider", useSQLite: true}},
        }, {
          name: "local-hook-controller-emulator",
          modules: true,
          scriptPath: "./__integration__/local-hook-controller-emulator.js",
          compatibilityDate: "2026-02-02",
          compatibilityFlags: ["allow_irrevocable_stub_storage"],
          durableObjects: {CALLBACK: {className: "HookCallback", useSQLite: true}},
        }, {
          name: "local-access-emulator",
          modules: true,
          scriptPath: "./__integration__/local-access-emulator.js",
        }],
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
