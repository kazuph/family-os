const origin = "https://family-os.kazu-san.workers.dev";
const sqlite = {type: "durable-object", storage: "sqlite"};

/** Declarative lifecycle preserves every deployed class by its original export name. */
export const productionConfigs = {
  "workshop-backend": {
    name: "family-os",
    main: "../../validate/src/production.ts",
    compatibility_date: "2026-09-04",
    compatibility_flags: ["allow_irrevocable_stub_storage", "enhanced_error_serialization", "global_fetch_strictly_public", "nodejs_compat"],
    keep_vars: true,
    observability: {
      enabled: true, head_sampling_rate: 1, redact_query_string: false,
      logs: {enabled: true, head_sampling_rate: 1, persist: true, invocation_logs: false},
      traces: {enabled: true, persist: true, head_sampling_rate: 0.5},
    },

    vars: {
      ADMINS: ["kazu.homma@gmail.com"],
      CF_ACCESS_ISS: "https://kazu-san.cloudflareaccess.com",
      CF_ACCESS_AUD: "b888b2f59c461fd85f1d9c262711df7864e0067adc0074d9eb0f779cfe4031df",
      PUBLIC_BASE_URL: origin,
    },
    kv_namespaces: [
      {binding: "AVATARS", id: "72c513889144428cba1ad7a35798dae7"},
      {binding: "BLUEPRINTS", id: "6700e8d763b74ba382ca9946527756c6"},
    ],
    r2_buckets: [{binding: "BLUEPRINT_CONTENT", bucket_name: "home-os-blueprint-content"}],
    browser: {binding: "BROWSER"},
    ai: {binding: "WORKERS_AI"},
    worker_loaders: [{binding: "LOADER"}],
    services: [
      {binding: "GATEKEEPER_CONTEXT", service: "family-os-context", entrypoint: "GatekeeperVendor"},
      {binding: "CONTEXT_HTTP", service: "family-os-context"},
    ],
    exports: Object.fromEntries([
      "UserDurableObject", "OverseerDurableObject", "PendingLogin", "AdminSettings",
      "FamilyDurableObject", "LanguageModelGatekeeper", "AgentSpawnerGatekeeper",
      "BrowserVerificationLimiterDurableObject", "UserDirectoryDurableObject",
      // Retained so the deployed namespace is not dropped (see legacy-family.ts).
      "BookDataFacet",
    ].map(name => [name, sqlite])),
    assets: {directory: "../../../../workshop-frontend/dist", binding: "ASSETS", not_found_handling: "single-page-application",
      run_worker_first: ["/api", "/api/*", "/mcp", "/gatekeeper/context", "/gatekeeper/context/*", "/blueprint-screenshot/*"]},
  },
  "gatekeeper-context": {
    name: "family-os-context",
    main: "../../validate/src/index.ts",
    compatibility_date: "2026-09-04",
    compatibility_flags: ["nodejs_compat", "allow_irrevocable_stub_storage"],
    keep_vars: true,
    observability: {
      enabled: true, head_sampling_rate: 1, redact_query_string: false,
      logs: {enabled: true, head_sampling_rate: 1, persist: true, invocation_logs: false},
      traces: {enabled: false, persist: true, head_sampling_rate: 1},
    },

    vars: {BASE_URL: `${origin}/gatekeeper/context`},
    kv_namespaces: [{binding: "CONTEXT_COLLECTIONS", id: "51a16236b98147f0a566fe4f4f296646"}],
    exports: Object.fromEntries([
      "ContextCollectionDurableObject", "ContextGatekeeper", "LibraryRegistryDurableObject", "UserLibraryDurableObject",
    ].map(name => [name, sqlite])),
    rules: [{type: "Text", globs: ["**/*.txt", "**/*.svg"], fallthrough: false}],
  },
};
