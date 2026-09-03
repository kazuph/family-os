#!/usr/bin/env node
/**
 * Generate gitignored wrangler.prod.jsonc files for the household Family OS Workers.
 *
 * Account-specific values come from the process environment (GitHub Environment
 * secrets/variables in CD, or a local shell). Tokens are never written into the
 * generated files. Resource ids are required so Wrangler cannot auto-provision
 * duplicate KV/R2.
 *
 * Usage: node scripts/generate-wrangler-prod.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "jsonc-parser";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const GENERATED_CONFIG_NAME = "wrangler.prod.jsonc";

export const REQUIRED_ENV = Object.freeze([
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_ACCESS_AUD",
  "CF_ACCESS_ISS",
  "FAMILY_ADMINS",
  "FAMILY_PUBLIC_BASE_URL",
  "FAMILY_WORKSHOP_WORKER",
  "FAMILY_CONTEXT_WORKER",
  "KV_BLUEPRINTS_ID",
  "KV_AVATARS_ID",
  "KV_CONTEXT_COLLECTIONS_ID",
  "R2_BLUEPRINT_CONTENT_BUCKET",
]);

const HEX_32 = /^[0-9a-f]{32}$/i;

export function generatedConfigPaths(root = ROOT) {
  return {
    workshop: join(root, "packages/workshop-backend", GENERATED_CONFIG_NAME),
    context: join(root, "packages/gatekeeper-context", GENERATED_CONFIG_NAME),
  };
}

export function missingRequiredEnv(env) {
  return REQUIRED_ENV.filter((name) => !String(env[name] ?? "").trim());
}

function required(env, name) {
  const value = String(env[name] ?? "").trim();
  if (!value) throw new Error(`${name} is required; refusing to auto-provision`);
  return value;
}

function hex32(env, name) {
  const value = required(env, name);
  if (!HEX_32.test(value)) throw new Error(`${name} must be a 32-character hex id`);
  return value.toLowerCase();
}

function httpsOrigin(raw, name) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be an https origin`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error(`${name} must be an https origin`);
  }
  return url.origin;
}

export function loadProductionDeployment(env) {
  const missing = missingRequiredEnv(env);
  if (missing.length) {
    throw new Error(`missing production env: ${missing.join(", ")}`);
  }

  const admins = required(env, "FAMILY_ADMINS")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (admins.length === 0 || admins.some((email) => !email.includes("@"))) {
    throw new Error("FAMILY_ADMINS must be a comma-separated list of emails");
  }

  const sharingDomain = httpsOrigin(required(env, "FAMILY_PUBLIC_BASE_URL"), "FAMILY_PUBLIC_BASE_URL");

  return {
    accountId: hex32(env, "CLOUDFLARE_ACCOUNT_ID"),
    workers: {
      workshop: required(env, "FAMILY_WORKSHOP_WORKER"),
      context: required(env, "FAMILY_CONTEXT_WORKER"),
    },
    access: {
      issuer: httpsOrigin(required(env, "CF_ACCESS_ISS"), "CF_ACCESS_ISS"),
      audience: required(env, "CF_ACCESS_AUD"),
      admins,
    },
    context: {
      sharingDomain,
    },
    resources: {
      blueprintsKvNamespaceId: hex32(env, "KV_BLUEPRINTS_ID"),
      avatarsKvNamespaceId: hex32(env, "KV_AVATARS_ID"),
      contextCollectionsKvNamespaceId: hex32(env, "KV_CONTEXT_COLLECTIONS_ID"),
      blueprintContentBucket: required(env, "R2_BLUEPRINT_CONTENT_BUCKET"),
    },
  };
}

export function generateWranglerProd(deployment, { workshopBase, contextBase }) {
  const workshop = structuredClone(workshopBase);
  delete workshop.$schema;
  workshop.name = deployment.workers.workshop;
  workshop.account_id = deployment.accountId;
  workshop.workers_dev = true;
  workshop.ai = { binding: "WORKERS_AI" };
  workshop.vars = {
    ADMINS: deployment.access.admins,
    CF_ACCESS_ISS: deployment.access.issuer,
    CF_ACCESS_AUD: deployment.access.audience,
  };
  workshop.services = [
    {
      binding: "GATEKEEPER_CONTEXT",
      service: deployment.workers.context,
      entrypoint: "GatekeeperVendor",
      props: { sharingDomain: deployment.context.sharingDomain },
    },
  ];
  workshop.kv_namespaces = [
    { binding: "BLUEPRINTS", id: deployment.resources.blueprintsKvNamespaceId },
    { binding: "AVATARS", id: deployment.resources.avatarsKvNamespaceId },
  ];
  workshop.r2_buckets = [
    { binding: "BLUEPRINT_CONTENT", bucket_name: deployment.resources.blueprintContentBucket },
  ];
  workshop.assets = {
    directory: "../workshop-frontend/dist",
    not_found_handling: "single-page-application",
    run_worker_first: ["/mcp", "/api", "/api/*", "/blueprint-screenshot/*"],
  };

  const context = structuredClone(contextBase);
  delete context.$schema;
  context.name = deployment.workers.context;
  context.account_id = deployment.accountId;
  context.workers_dev = false;
  context.kv_namespaces = [
    {
      binding: "CONTEXT_COLLECTIONS",
      id: deployment.resources.contextCollectionsKvNamespaceId,
    },
  ];
  context.vars = {
    BASE_URL: `${deployment.context.sharingDomain}/gatekeeper/context`,
  };

  return { workshop, context };
}

export function redactConfigForLog(config) {
  const copy = structuredClone(config);
  if (copy.account_id) copy.account_id = "<redacted>";
  if (copy.vars?.CF_ACCESS_AUD) copy.vars.CF_ACCESS_AUD = "<redacted>";
  if (copy.vars?.CF_ACCESS_ISS) copy.vars.CF_ACCESS_ISS = "<redacted>";
  if (copy.vars?.ADMINS) copy.vars.ADMINS = ["<redacted>"];
  if (copy.vars?.BASE_URL) copy.vars.BASE_URL = "<redacted>";
  if (copy.services) {
    copy.services = copy.services.map((service) => {
      if (!service.props?.sharingDomain) return service;
      return { ...service, props: { ...service.props, sharingDomain: "<redacted>" } };
    });
  }
  return copy;
}

export function readPackageWranglerConfig(pkgDir) {
  const errors = [];
  const parsed = parse(readFileSync(join(pkgDir, "wrangler.jsonc"), "utf8"), errors);
  if (errors.length) throw new Error(`${pkgDir}/wrangler.jsonc: parse error at ${errors[0].offset}`);
  return parsed;
}

export function writeGeneratedConfigs(root, generated) {
  const paths = generatedConfigPaths(root);
  writeFileSync(paths.workshop, JSON.stringify(generated.workshop, null, 2) + "\n");
  writeFileSync(paths.context, JSON.stringify(generated.context, null, 2) + "\n");
  return paths;
}

function isMain() {
  try {
    return fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
  } catch {
    return false;
  }
}

if (isMain()) {
  const deployment = loadProductionDeployment(process.env);
  const generated = generateWranglerProd(deployment, {
    workshopBase: readPackageWranglerConfig(join(ROOT, "packages/workshop-backend")),
    contextBase: readPackageWranglerConfig(join(ROOT, "packages/gatekeeper-context")),
  });
  writeGeneratedConfigs(ROOT, generated);
  console.log("Wrote gitignored wrangler.prod.jsonc (Access/admin/account identity redacted):");
  console.log(JSON.stringify({
    workshop: redactConfigForLog(generated.workshop),
    context: redactConfigForLog(generated.context),
  }, null, 2));
}
