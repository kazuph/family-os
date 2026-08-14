#!/usr/bin/env node
/**
 * Deploy Family OS to the existing personal Cloudflare Workers.
 *
 * home-os-context is deployed before home-os. CLOUDFLARE_API_TOKEN and
 * OPENCODE_GO_API_TOKEN stay in the process environment / stdin and are never
 * passed as argv or written to generated config files.
 *
 * Usage:
 *   node scripts/deploy-family-os.mjs --verify-only
 *   node scripts/deploy-family-os.mjs --dry-run
 *   node scripts/deploy-family-os.mjs
 */

import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GENERATED_CONFIG_NAME,
  generateWranglerProd,
  generatedConfigPaths,
  loadProductionDeployment,
  readPackageWranglerConfig,
  redactConfigForLog,
  writeGeneratedConfigs,
} from "./generate-wrangler-prod.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.cloudflare.com/client/v4";

export const DEPLOY_ORDER = Object.freeze(["context", "workshop"]);

export function parseDeployArgs(argv) {
  const verifyOnly = argv.includes("--verify-only");
  const dryRunOnly = argv.includes("--dry-run");
  if (verifyOnly && dryRunOnly) {
    throw new Error("use either --verify-only or --dry-run");
  }
  return {
    verify: true,
    dryRun: !verifyOnly,
    deploy: !verifyOnly && !dryRunOnly,
    updateSecret: !verifyOnly && !dryRunOnly,
  };
}

export function wranglerDeployArgs({ dryRun }) {
  const args = ["deploy", "--config", GENERATED_CONFIG_NAME, "--log-level", "warn"];
  if (dryRun) args.push("--dry-run");
  return args;
}

export function wranglerSecretPutArgs() {
  return ["secret", "put", "OPENCODE_GO_API_TOKEN", "--config", GENERATED_CONFIG_NAME, "--log-level", "warn"];
}

export function assertRequiredDeploySecrets(env, args) {
  if (!String(env.CLOUDFLARE_API_TOKEN ?? "").trim()) {
    throw new Error("CLOUDFLARE_API_TOKEN must be set in the environment");
  }
  if (args.updateSecret && !String(env.OPENCODE_GO_API_TOKEN ?? "").trim()) {
    throw new Error("OPENCODE_GO_API_TOKEN must be set in the environment");
  }
}

export function redactSensitiveOutput(text, deployment, extraSecrets = []) {
  const secrets = [
    ...extraSecrets,
    deployment.accountId,
    deployment.access?.audience,
    deployment.access?.issuer,
    ...(deployment.access?.admins ?? []),
  ].filter((value) => typeof value === "string" && value.length >= 8);

  let out = String(text ?? "");
  for (const secret of secrets) {
    out = out.split(secret).join("<redacted>");
    if (secret.length > 16) out = out.split(secret.slice(0, 16)).join("<redacted>");
  }
  return out;
}

function binding(bindings, type, name) {
  return (bindings ?? []).find((item) => item.type === type && item.name === name);
}

function assertCfOk(payload, what) {
  if (!payload?.success) {
    const detail = payload?.errors?.map((error) => error.message).join("; ") || "unknown error";
    throw new Error(`${what} missing; refusing to auto-provision (${detail})`);
  }
}

function assertBindingId(actual, expected, label) {
  if (!actual) throw new Error(`live ${label} binding missing; refusing to auto-provision`);
  if (actual !== expected) {
    throw new Error(`live ${label} identity does not match configured vars`);
  }
}

export function interpretExistingState(deployment, payloads) {
  assertCfOk(payloads.kv.blueprints, "KV BLUEPRINTS");
  assertCfOk(payloads.kv.avatars, "KV AVATARS");
  assertCfOk(payloads.kv.contextCollections, "KV CONTEXT_COLLECTIONS");
  assertCfOk(payloads.r2, "R2 BLUEPRINT_CONTENT");
  const r2Name = payloads.r2.result?.name;
  if (r2Name && r2Name !== deployment.resources.blueprintContentBucket) {
    throw new Error("live BLUEPRINT_CONTENT identity does not match configured vars");
  }
  assertCfOk(payloads.workshop, `Worker ${deployment.workers.workshop}`);
  assertCfOk(payloads.context, `Worker ${deployment.workers.context}`);

  const workshopBindings = payloads.workshop.result.bindings ?? [];
  const contextBindings = payloads.context.result.bindings ?? [];

  assertBindingId(
    binding(workshopBindings, "kv_namespace", "BLUEPRINTS")?.namespace_id,
    deployment.resources.blueprintsKvNamespaceId,
    "BLUEPRINTS",
  );
  assertBindingId(
    binding(workshopBindings, "kv_namespace", "AVATARS")?.namespace_id,
    deployment.resources.avatarsKvNamespaceId,
    "AVATARS",
  );
  assertBindingId(
    binding(workshopBindings, "r2_bucket", "BLUEPRINT_CONTENT")?.bucket_name,
    deployment.resources.blueprintContentBucket,
    "BLUEPRINT_CONTENT",
  );
  assertBindingId(
    binding(workshopBindings, "service", "GATEKEEPER_CONTEXT")?.service,
    deployment.workers.context,
    "GATEKEEPER_CONTEXT",
  );
  assertBindingId(
    binding(contextBindings, "kv_namespace", "CONTEXT_COLLECTIONS")?.namespace_id,
    deployment.resources.contextCollectionsKvNamespaceId,
    "CONTEXT_COLLECTIONS",
  );

  return { ok: true };
}

async function cfGet(token, path) {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchExistingState(deployment, { token, get = cfGet }) {
  const account = deployment.accountId;
  const [workshop, context, blueprints, avatars, contextCollections, r2] = await Promise.all([
    get(token, `/accounts/${account}/workers/scripts/${deployment.workers.workshop}/settings`),
    get(token, `/accounts/${account}/workers/scripts/${deployment.workers.context}/settings`),
    get(token, `/accounts/${account}/storage/kv/namespaces/${deployment.resources.blueprintsKvNamespaceId}`),
    get(token, `/accounts/${account}/storage/kv/namespaces/${deployment.resources.avatarsKvNamespaceId}`),
    get(token, `/accounts/${account}/storage/kv/namespaces/${deployment.resources.contextCollectionsKvNamespaceId}`),
    get(token, `/accounts/${account}/r2/buckets/${deployment.resources.blueprintContentBucket}`),
  ]);
  return {
    workshop,
    context,
    kv: { blueprints, avatars, contextCollections },
    r2,
  };
}

function run(cmd, args, options) {
  console.log(`+ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: ["pipe", "pipe", "pipe"],
    input: options.input,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const extraSecrets = [
    process.env.CLOUDFLARE_API_TOKEN,
    process.env.OPENCODE_GO_API_TOKEN,
  ];
  if (options.deployment) {
    process.stdout.write(redactSensitiveOutput(output, options.deployment, extraSecrets));
  } else {
    process.stdout.write(output);
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args[0] ?? ""} failed with status ${result.status}`);
  }
  return result;
}

function packageDir(kind) {
  return kind === "context"
    ? join(ROOT, "packages/gatekeeper-context")
    : join(ROOT, "packages/workshop-backend");
}

function cleanupGenerated() {
  for (const path of Object.values(generatedConfigPaths(ROOT))) {
    rmSync(path, { force: true });
  }
}

async function main() {
  const args = parseDeployArgs(process.argv.slice(2));
  assertRequiredDeploySecrets(process.env, args);

  const deployment = loadProductionDeployment(process.env);
  if (args.verify) {
    const payloads = await fetchExistingState(deployment, { token: process.env.CLOUDFLARE_API_TOKEN });
    interpretExistingState(deployment, payloads);
    console.log("Existing production KV/R2/Workers match configured identities.");
  }
  if (!args.dryRun && !args.deploy) return;

  const generated = generateWranglerProd(deployment, {
    workshopBase: readPackageWranglerConfig(join(ROOT, "packages/workshop-backend")),
    contextBase: readPackageWranglerConfig(join(ROOT, "packages/gatekeeper-context")),
  });
  writeGeneratedConfigs(ROOT, generated);
  console.log("Generated wrangler.prod.jsonc (Access/admin/account identity redacted):");
  console.log(JSON.stringify({
    workshop: redactConfigForLog(generated.workshop),
    context: redactConfigForLog(generated.context),
  }, null, 2));

  try {
    const runOpts = { cwd: ROOT, deployment };
    run("pnpm", ["build"], {
      ...runOpts,
      env: { ...process.env, VITE_CF_ACCESS_MODE: "true" },
    });

    for (const kind of DEPLOY_ORDER) {
      run("pnpm", ["exec", "wrangler", ...wranglerDeployArgs({ dryRun: true })], {
        cwd: packageDir(kind),
        deployment,
      });
    }
    if (!args.deploy) {
      console.log("Dry-run OK (no Cloudflare mutations). Previous Worker versions remain rollbackable.");
      return;
    }

    for (const kind of DEPLOY_ORDER) {
      run("pnpm", ["exec", "wrangler", ...wranglerDeployArgs({ dryRun: false })], {
        cwd: packageDir(kind),
        deployment,
      });
    }

    if (args.updateSecret) {
      run("pnpm", ["exec", "wrangler", ...wranglerSecretPutArgs()], {
        cwd: packageDir("workshop"),
        input: process.env.OPENCODE_GO_API_TOKEN,
        deployment,
      });
    }
    console.log("Production deploy OK. On failure, wrangler rollback can restore the previous version.");
  } finally {
    cleanupGenerated();
  }
}

function isMain() {
  try {
    return fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
  } catch {
    return false;
  }
}

if (isMain()) {
  main().catch((error) => {
    cleanupGenerated();
    console.error(error.message);
    process.exit(1);
  });
}
