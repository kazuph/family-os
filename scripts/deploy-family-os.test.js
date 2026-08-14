import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertRequiredDeploySecrets,
  DEPLOY_ORDER,
  interpretExistingState,
  parseDeployArgs,
  redactSensitiveOutput,
  wranglerDeployArgs,
  wranglerSecretPutArgs,
} from "./deploy-family-os.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKOUT_PIN = "actions/checkout@11d5960a326750d5838078e36cf38b85af677262";
const SETUP_NODE_PIN = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020";

const deployment = {
  accountId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  workers: { workshop: "home-os", context: "home-os-context" },
  resources: {
    blueprintsKvNamespaceId: "11111111111111111111111111111111",
    avatarsKvNamespaceId: "22222222222222222222222222222222",
    contextCollectionsKvNamespaceId: "33333333333333333333333333333333",
    blueprintContentBucket: "home-os-blueprint-content",
  },
};

function settings(bindings) {
  return { success: true, result: { bindings } };
}

function runPinnedWrangler(args, cwd = ROOT) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], {
    cwd,
    encoding: "utf8",
    env: process.env,
    timeout: 30_000,
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function optionNamesFromHelp(help) {
  const names = new Set();
  for (const match of String(help).matchAll(/(?:^|\s)(--[A-Za-z][\w-]*)/g)) {
    names.add(match[1]);
  }
  return names;
}

function flagsFromArgs(args) {
  return args.filter((arg) => arg.startsWith("--"));
}

describe("parseDeployArgs", () => {
  it("defaults to verify, dry-run, then production deploy", () => {
    assert.deepEqual(parseDeployArgs([]), {
      verify: true,
      dryRun: true,
      deploy: true,
      updateSecret: true,
    });
  });

  it("stops after dry-run when --dry-run is set", () => {
    assert.deepEqual(parseDeployArgs(["--dry-run"]), {
      verify: true,
      dryRun: true,
      deploy: false,
      updateSecret: false,
    });
  });

  it("stops after existing-state checks when --verify-only is set", () => {
    assert.deepEqual(parseDeployArgs(["--verify-only"]), {
      verify: true,
      dryRun: false,
      deploy: false,
      updateSecret: false,
    });
  });
});

describe("wrangler argument construction", () => {
  it("deploys context before workshop", () => {
    assert.deepEqual(DEPLOY_ORDER, ["context", "workshop"]);
  });

  it("passes config path and dry-run via argv without token values", () => {
    const args = wranglerDeployArgs({ dryRun: true });
    assert.deepEqual(args, ["deploy", "--config", "wrangler.prod.jsonc", "--dry-run"]);
    const dumped = args.join(" ");
    assert.equal(dumped.includes("CLOUDFLARE_API_TOKEN"), false);
    assert.equal(dumped.includes("OPENCODE_GO_API_TOKEN"), false);
    assert.equal(dumped.includes("log-level"), false);
    assert.equal(dumped.includes("logLevel"), false);
  });

  it("requires the OpenCode token before any production Worker upload", () => {
    assert.throws(
      () => assertRequiredDeploySecrets(
        { CLOUDFLARE_API_TOKEN: "cf-token" },
        { updateSecret: true },
      ),
      /OPENCODE_GO_API_TOKEN/,
    );
    assert.doesNotThrow(() => assertRequiredDeploySecrets(
      { CLOUDFLARE_API_TOKEN: "cf-token" },
      { updateSecret: false },
    ));
  });

  it("puts OPENCODE_GO_API_TOKEN by name only, value stays on stdin", () => {
    const args = wranglerSecretPutArgs();
    assert.deepEqual(args, ["secret", "put", "OPENCODE_GO_API_TOKEN", "--config", "wrangler.prod.jsonc"]);
    assert.equal(args.includes("--log-level"), false);
    assert.equal(args.includes("--logLevel"), false);
  });
});

describe("pinned wrangler CLI contract", () => {
  const workshopDir = join(ROOT, "packages/workshop-backend");

  it("documents deploy --help without --log-level and accepts constructed dry-run argv", () => {
    const help = runPinnedWrangler(["deploy", "--help"]);
    assert.equal(help.status, 0, help.output);
    const options = optionNamesFromHelp(help.output);
    assert.equal(options.has("--config"), true);
    assert.equal(options.has("--dry-run"), true);
    assert.equal(options.has("--log-level"), false);
    assert.equal(options.has("--logLevel"), false);

    const args = wranglerDeployArgs({ dryRun: true });
    for (const flag of flagsFromArgs(args)) {
      assert.equal(options.has(flag), true, `${flag} must be a wrangler deploy option`);
    }

    // Same argv as CD before upload. Missing generated config is later than CLI parse;
    // Wrangler 4.119.0 rejected --log-level here (run 31774001566).
    const probe = runPinnedWrangler(args, workshopDir);
    assert.equal(/Unknown arguments/i.test(probe.output), false, probe.output);
    assert.match(probe.output, /Could not read file: wrangler\.prod\.jsonc/);
  });

  it("accepts constructed secret put argv on the pinned CLI", () => {
    const help = runPinnedWrangler(["secret", "put", "--help"]);
    assert.equal(help.status, 0, help.output);
    const options = optionNamesFromHelp(help.output);
    assert.equal(options.has("--config"), true);
    assert.equal(options.has("--log-level"), false);

    const args = wranglerSecretPutArgs();
    for (const flag of flagsFromArgs(args)) {
      assert.equal(options.has(flag), true, `${flag} must be a wrangler secret put option`);
    }

    const probe = runPinnedWrangler(args, workshopDir);
    assert.equal(/Unknown arguments/i.test(probe.output), false, probe.output);
    assert.match(probe.output, /Could not read file: wrangler\.prod\.jsonc/);
  });
});

describe("redactSensitiveOutput", () => {
  it("redacts Access audience, issuer, admins, and extra secrets from wrangler-like logs", () => {
    const redacted = redactSensitiveOutput(
      "AUD=audience-secret-value ISS=https://example.cloudflareaccess.com admin=adult@example.com token=super-secret-token",
      {
        accountId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        access: {
          audience: "audience-secret-value",
          issuer: "https://example.cloudflareaccess.com",
          admins: ["adult@example.com"],
        },
      },
      ["super-secret-token"],
    );
    assert.equal(redacted.includes("audience-secret-value"), false);
    assert.equal(redacted.includes("adult@example.com"), false);
    assert.equal(redacted.includes("super-secret-token"), false);
    assert.equal(redacted.includes("https://example.cloudflareaccess.com"), false);
    assert.ok(redacted.includes("<redacted>"));
  });
});

describe("interpretExistingState", () => {
  it("accepts live workers bound to the configured KV/R2 identities", () => {
    const result = interpretExistingState(deployment, {
      workshop: settings([
        { type: "kv_namespace", name: "BLUEPRINTS", namespace_id: "11111111111111111111111111111111" },
        { type: "kv_namespace", name: "AVATARS", namespace_id: "22222222222222222222222222222222" },
        { type: "r2_bucket", name: "BLUEPRINT_CONTENT", bucket_name: "home-os-blueprint-content" },
        { type: "service", name: "GATEKEEPER_CONTEXT", service: "home-os-context" },
      ]),
      context: settings([
        { type: "kv_namespace", name: "CONTEXT_COLLECTIONS", namespace_id: "33333333333333333333333333333333" },
      ]),
      kv: {
        blueprints: { success: true, result: { id: "11111111111111111111111111111111", title: "home-os-blueprints" } },
        avatars: { success: true, result: { id: "22222222222222222222222222222222", title: "home-os-avatars" } },
        contextCollections: { success: true, result: { id: "33333333333333333333333333333333", title: "home-os-context-context-collections" } },
      },
      r2: { success: true, result: { name: "home-os-blueprint-content" } },
    });
    assert.equal(result.ok, true);
  });

  it("fails closed when a live Worker is bound to a different KV namespace", () => {
    assert.throws(() => interpretExistingState(deployment, {
      workshop: settings([
        { type: "kv_namespace", name: "BLUEPRINTS", namespace_id: "99999999999999999999999999999999" },
        { type: "kv_namespace", name: "AVATARS", namespace_id: "22222222222222222222222222222222" },
        { type: "r2_bucket", name: "BLUEPRINT_CONTENT", bucket_name: "home-os-blueprint-content" },
        { type: "service", name: "GATEKEEPER_CONTEXT", service: "home-os-context" },
      ]),
      context: settings([
        { type: "kv_namespace", name: "CONTEXT_COLLECTIONS", namespace_id: "33333333333333333333333333333333" },
      ]),
      kv: {
        blueprints: { success: true, result: { id: "11111111111111111111111111111111" } },
        avatars: { success: true, result: { id: "22222222222222222222222222222222" } },
        contextCollections: { success: true, result: { id: "33333333333333333333333333333333" } },
      },
      r2: { success: true, result: { name: "home-os-blueprint-content" } },
    }), /BLUEPRINTS/);
  });

  it("fails closed when a configured KV namespace is missing", () => {
    assert.throws(() => interpretExistingState(deployment, {
      workshop: settings([
        { type: "kv_namespace", name: "BLUEPRINTS", namespace_id: "11111111111111111111111111111111" },
        { type: "kv_namespace", name: "AVATARS", namespace_id: "22222222222222222222222222222222" },
        { type: "r2_bucket", name: "BLUEPRINT_CONTENT", bucket_name: "home-os-blueprint-content" },
        { type: "service", name: "GATEKEEPER_CONTEXT", service: "home-os-context" },
      ]),
      context: settings([
        { type: "kv_namespace", name: "CONTEXT_COLLECTIONS", namespace_id: "33333333333333333333333333333333" },
      ]),
      kv: {
        blueprints: { success: false, errors: [{ message: "not found" }] },
        avatars: { success: true, result: { id: "22222222222222222222222222222222" } },
        contextCollections: { success: true, result: { id: "33333333333333333333333333333333" } },
      },
      r2: { success: true, result: { name: "home-os-blueprint-content" } },
    }), /refusing to auto-provision/);
  });
});

describe("CI production deploy job", () => {
  const workflow = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");

  it("keeps existing action pins and does not add a Wrangler GitHub Action", () => {
    assert.equal(workflow.includes(CHECKOUT_PIN), true);
    assert.equal(workflow.includes(SETUP_NODE_PIN), true);
    assert.equal(/uses:\s*cloudflare\/wrangler-action/i.test(workflow), false);
    assert.equal(/uses:\s*pnpm\/action-setup/i.test(workflow), false);
    assert.equal(/cloudflare\/pages-action/i.test(workflow), false);
  });

  it("deploys only kazuph/family-os main push after lint and test, never on pull_request", () => {
    assert.match(workflow, /deploy-production:[\s\S]*needs:\s*\[lint, test\]/);
    assert.match(workflow, /if:\s*github\.repository == 'kazuph\/family-os' && github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
    assert.match(workflow, /environment:\s*production/);
    assert.match(workflow, /group:\s*production/);
    assert.match(workflow, /cancel-in-progress:\s*false/);
    const deployBlock = workflow.split("deploy-production:")[1];
    assert.equal(deployBlock.includes("pull_request"), false);
    assert.match(deployBlock, /persist-credentials:\s*false/);
    assert.match(deployBlock, /permissions:\s*\n\s+contents:\s*read/);
  });

  it("builds Access frontend and deploys via the local script", () => {
    const deployBlock = workflow.split("deploy-production:")[1];
    assert.match(deployBlock, /VITE_CF_ACCESS_MODE:\s*"true"/);
    assert.match(deployBlock, /node scripts\/deploy-family-os\.mjs/);
    assert.match(deployBlock, /secrets\.CLOUDFLARE_API_TOKEN/);
    assert.match(deployBlock, /secrets\.OPENCODE_GO_API_TOKEN/);
    assert.match(deployBlock, /vars\.KV_BLUEPRINTS_ID/);
  });
});
