import {test} from "node:test";
import assert from "node:assert/strict";
import {productionConfigs} from "./production-config.ts";

test("cutover keeps every deployed SQLite namespace live, with no destructive lifecycle entries", () => {
  const deployed = {
    "workshop-backend": ["UserDurableObject", "OverseerDurableObject", "PendingLogin", "AdminSettings",
      "FamilyDurableObject", "LanguageModelGatekeeper", "AgentSpawnerGatekeeper", "BrowserVerificationLimiterDurableObject"],
    "gatekeeper-context": ["ContextCollectionDurableObject", "ContextGatekeeper", "LibraryRegistryDurableObject", "UserLibraryDurableObject"],
  };
  for (const [pkg, names] of Object.entries(deployed)) {
    const config = productionConfigs[pkg as keyof typeof productionConfigs];
    assert.equal("migrations" in config, false);
    for (const name of names) assert.deepEqual(config.exports[name], {type: "durable-object", storage: "sqlite"});
    assert.ok(Object.values(config.exports).every(entry => !("state" in entry)));
  }
  assert.equal(productionConfigs["workshop-backend"].name, "family-os");
  assert.equal(productionConfigs["gatekeeper-context"].name, "family-os-context");
});

test("cutover retains storage and service bindings and never declares a Go secret value", () => {
  const backend=productionConfigs["workshop-backend"];
  assert.deepEqual(backend.kv_namespaces,[{binding:"AVATARS",id:"72c513889144428cba1ad7a35798dae7"},{binding:"BLUEPRINTS",id:"6700e8d763b74ba382ca9946527756c6"}]);
  assert.deepEqual(backend.r2_buckets,[{binding:"BLUEPRINT_CONTENT",bucket_name:"home-os-blueprint-content"}]);
  assert.ok(backend.services.some(service=>service.binding==="GATEKEEPER_CONTEXT"&&service.service==="family-os-context"&&service.entrypoint==="GatekeeperVendor"));
  assert.ok(backend.keep_vars);
  assert.equal("OPENCODE_GO_API_TOKEN" in backend.vars,false);
  assert.ok(backend.assets.run_worker_first.includes("/gatekeeper/context/*"));
  assert.deepEqual(productionConfigs["gatekeeper-context"].kv_namespaces,[{binding:"CONTEXT_COLLECTIONS",id:"51a16236b98147f0a566fe4f4f296646"}]);
});

test("cutover retains each deployed Worker's observability settings", () => {
  assert.deepEqual(productionConfigs["workshop-backend"].observability, {
    enabled: true, head_sampling_rate: 1, redact_query_string: false,
    logs: {enabled: true, head_sampling_rate: 1, persist: true, invocation_logs: false},
    traces: {enabled: true, persist: true, head_sampling_rate: 0.5},
  });
  assert.deepEqual(productionConfigs["gatekeeper-context"].observability, {
    enabled: true, head_sampling_rate: 1, redact_query_string: false,
    logs: {enabled: true, head_sampling_rate: 1, persist: true, invocation_logs: false},
    traces: {enabled: false, persist: true, head_sampling_rate: 1},
  });
});
