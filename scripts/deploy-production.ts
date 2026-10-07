#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { productionConfigs } from "./production-config.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.some(arg => !["--dry-run", "--execute", "--config-only"].includes(arg))
    || (args.includes("--execute") && args.length !== 1)) {
  throw new Error("Use --dry-run (default), --config-only, or --execute alone.");
}
for (const [pkg, config] of Object.entries(productionConfigs)) {
  const directory = join(root, "packages", pkg, ".wrangler", "production", "config");
  mkdirSync(directory, {recursive: true});
  writeFileSync(join(directory, "wrangler.json"), JSON.stringify(config, null, 2) + "\n");
}
if (!args.includes("--config-only")) {
  const run = (cwd: string, command: string[], env = process.env) => {
    const result = spawnSync(command[0], command.slice(1), {cwd, env, stdio: "inherit"});
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  };
  run(root, ["pnpm", "build"], {...process.env, VITE_CF_ACCESS_MODE: "true"});
  for (const pkg of ["gatekeeper-context", "workshop-backend"] as const) {
    const cwd = join(root, "packages", pkg);
    run(cwd, ["pnpm", "exec", "capnweb-validate", "build", "--out", ".wrangler/validate"]);
    run(cwd, ["pnpm", "exec", "wrangler", "deploy", "--config", ".wrangler/production/config/wrangler.json",
      ...(args.includes("--execute") ? [] : ["--dry-run"])]);
  }
}
