import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "jsonc-parser";

import {
  GENERATED_CONFIG_NAME,
  generatedConfigPaths,
  generateWranglerProd,
  loadProductionDeployment,
  missingRequiredEnv,
  redactConfigForLog,
  REQUIRED_ENV,
} from "./generate-wrangler-prod.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const VALID_ENV = {
  CLOUDFLARE_ACCOUNT_ID: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  CF_ACCESS_AUD: "audience-value",
  CF_ACCESS_ISS: "https://example.cloudflareaccess.com/",
  FAMILY_ADMINS: " adult@example.com , other@example.com ",
  FAMILY_PUBLIC_BASE_URL: "https://home-os.example.workers.dev/",
  FAMILY_WORKSHOP_WORKER: "home-os",
  FAMILY_CONTEXT_WORKER: "home-os-context",
  KV_BLUEPRINTS_ID: "11111111111111111111111111111111",
  KV_AVATARS_ID: "22222222222222222222222222222222",
  KV_CONTEXT_COLLECTIONS_ID: "33333333333333333333333333333333",
  R2_BLUEPRINT_CONTENT_BUCKET: "home-os-blueprint-content",
};

const WORKSHOP_BASE = {
  $schema: "./ignored.json",
  name: "workshop-backend",
  main: ".wrangler/validate/src/server.ts",
  compatibility_date: "2026-02-02",
  compatibility_flags: ["nodejs_compat"],
  migrations: [{ tag: "v3", new_sqlite_classes: ["FamilyDurableObject"] }],
  kv_namespaces: [{ binding: "BLUEPRINTS", preview_id: "dev-only" }],
  r2_buckets: [{ binding: "BLUEPRINT_CONTENT", bucket_name: "gadgets-blueprint-content" }],
  browser: { binding: "BROWSER" },
  worker_loaders: [{ binding: "LOADER" }],
};

const CONTEXT_BASE = {
  $schema: "./ignored.json",
  name: "gatekeeper-context",
  main: ".wrangler/validate/src/index.ts",
  compatibility_date: "2026-02-02",
  migrations: [{ tag: "v0", new_sqlite_classes: ["ContextCollectionDurableObject"] }],
  kv_namespaces: [{ binding: "CONTEXT_COLLECTIONS", preview_id: "dev-only" }],
};

describe("loadProductionDeployment", () => {
  it("requires every production identity env var", () => {
    assert.deepEqual(missingRequiredEnv({}), [...REQUIRED_ENV]);
    assert.deepEqual(missingRequiredEnv(VALID_ENV), []);
  });

  it("rejects missing resource ids instead of auto-provisioning", () => {
    const env = { ...VALID_ENV, KV_BLUEPRINTS_ID: "" };
    assert.throws(() => loadProductionDeployment(env), /KV_BLUEPRINTS_ID/);
  });

  it("normalizes admins and public origin from env", () => {
    const deployment = loadProductionDeployment(VALID_ENV);
    assert.deepEqual(deployment.access.admins, ["adult@example.com", "other@example.com"]);
    assert.equal(deployment.context.sharingDomain, "https://home-os.example.workers.dev");
    assert.equal(deployment.access.issuer, "https://example.cloudflareaccess.com");
    assert.equal(deployment.resources.blueprintsKvNamespaceId, VALID_ENV.KV_BLUEPRINTS_ID);
  });

  it("does not copy API tokens into the deployment object", () => {
    const deployment = loadProductionDeployment({
      ...VALID_ENV,
      CLOUDFLARE_API_TOKEN: "token-must-not-be-copied",
      OPENCODE_GO_API_TOKEN: "opencode-must-not-be-copied",
    });
    const dumped = JSON.stringify(deployment);
    assert.equal(dumped.includes("token-must-not-be-copied"), false);
    assert.equal(dumped.includes("opencode-must-not-be-copied"), false);
  });
});

describe("generateWranglerProd", () => {
  it("writes explicit KV/R2 identities onto existing package configs", () => {
    const generated = generateWranglerProd(loadProductionDeployment(VALID_ENV), {
      workshopBase: WORKSHOP_BASE,
      contextBase: CONTEXT_BASE,
    });

    assert.equal(generated.workshop.name, "home-os");
    assert.equal(generated.context.name, "home-os-context");
    assert.equal(generated.workshop.account_id, VALID_ENV.CLOUDFLARE_ACCOUNT_ID);
    assert.equal(generated.workshop.workers_dev, true);
    assert.equal(generated.context.workers_dev, false);
    assert.deepEqual(generated.workshop.kv_namespaces, [
      { binding: "BLUEPRINTS", id: VALID_ENV.KV_BLUEPRINTS_ID },
      { binding: "AVATARS", id: VALID_ENV.KV_AVATARS_ID },
    ]);
    assert.deepEqual(generated.workshop.r2_buckets, [
      { binding: "BLUEPRINT_CONTENT", bucket_name: VALID_ENV.R2_BLUEPRINT_CONTENT_BUCKET },
    ]);
    assert.deepEqual(generated.context.kv_namespaces, [
      { binding: "CONTEXT_COLLECTIONS", id: VALID_ENV.KV_CONTEXT_COLLECTIONS_ID },
    ]);
    assert.deepEqual(generated.workshop.vars.ADMINS, ["adult@example.com", "other@example.com"]);
    assert.equal(generated.workshop.vars.CF_ACCESS_AUD, "audience-value");
    assert.equal(generated.workshop.services[0].service, "home-os-context");
    assert.equal(generated.workshop.services[0].props.sharingDomain,
      "https://home-os.example.workers.dev");
    assert.equal(generated.context.vars.BASE_URL,
      "https://home-os.example.workers.dev/gatekeeper/context");
    assert.equal(generated.workshop.ai.binding, "WORKERS_AI");
    assert.equal(generated.workshop.$schema, undefined);
    assert.deepEqual(generated.workshop.migrations, WORKSHOP_BASE.migrations);
    for (const ns of [...generated.workshop.kv_namespaces, ...generated.context.kv_namespaces]) {
      assert.equal(typeof ns.id, "string");
      assert.ok(ns.id.length > 0);
      assert.equal("preview_id" in ns, false);
    }
    for (const bucket of generated.workshop.r2_buckets) {
      assert.equal(typeof bucket.bucket_name, "string");
      assert.ok(bucket.bucket_name.length > 0);
    }
  });

  it("keeps Family Durable Object migrations from the real workshop wrangler.jsonc", () => {
    const workshopBase = parse(readFileSync(join(ROOT, "packages/workshop-backend/wrangler.jsonc"), "utf8"));
    const contextBase = parse(readFileSync(join(ROOT, "packages/gatekeeper-context/wrangler.jsonc"), "utf8"));
    const generated = generateWranglerProd(loadProductionDeployment(VALID_ENV), {
      workshopBase,
      contextBase,
    });
    const tags = generated.workshop.migrations.map((m) => m.tag);
    assert.ok(tags.includes("v3"));
    assert.ok(tags.includes("v4"));
    const v3 = generated.workshop.migrations.find((m) => m.tag === "v3");
    assert.ok(v3.new_sqlite_classes.includes("FamilyDurableObject"));
  });

  it("never embeds Worker secrets in generated config", () => {
    const generated = generateWranglerProd(loadProductionDeployment({
      ...VALID_ENV,
      CLOUDFLARE_API_TOKEN: "cf-token",
      OPENCODE_GO_API_TOKEN: "oc-token",
    }), {
      workshopBase: WORKSHOP_BASE,
      contextBase: CONTEXT_BASE,
    });
    const dumped = JSON.stringify(generated);
    assert.equal(dumped.includes("cf-token"), false);
    assert.equal(dumped.includes("oc-token"), false);
    assert.equal(dumped.includes("OPENCODE_GO_API_TOKEN"), false);
    assert.equal(dumped.includes("CLOUDFLARE_API_TOKEN"), false);
  });

  it("redacts household identity from logs", () => {
    const generated = generateWranglerProd(loadProductionDeployment(VALID_ENV), {
      workshopBase: WORKSHOP_BASE,
      contextBase: CONTEXT_BASE,
    });
    const redacted = JSON.stringify(redactConfigForLog(generated.workshop));
    assert.equal(redacted.includes(VALID_ENV.CLOUDFLARE_ACCOUNT_ID), false);
    assert.equal(redacted.includes("audience-value"), false);
    assert.equal(redacted.includes("adult@example.com"), false);
    assert.ok(redacted.includes("<redacted>"));
  });

  it("writes gitignored wrangler.prod.jsonc paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "family-os-cd-"));
    try {
      const paths = generatedConfigPaths(dir);
      assert.equal(paths.workshop.endsWith(join("packages/workshop-backend", GENERATED_CONFIG_NAME)), true);
      assert.equal(paths.context.endsWith(join("packages/gatekeeper-context", GENERATED_CONFIG_NAME)), true);
      writeFileSync(join(ROOT, ".gitignore"), readFileSync(join(ROOT, ".gitignore")));
      const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
      assert.match(gitignore, /^wrangler\.prod\.jsonc$/m);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
