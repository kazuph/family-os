import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default async function setup() {
  let result = spawnSync("pnpm", ["exec", "capnweb-validate", "build", "--out", ".wrangler/validate"], {
    cwd: packageRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error("capnweb-validate build failed before integration tests.");
  }
}
