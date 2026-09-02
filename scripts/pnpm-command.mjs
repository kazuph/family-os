// Spawn pnpm without a shell. On Windows, npm_execpath identifies pnpm's JavaScript entry point,
// avoiding the unspawnable .cmd shim while preserving every argument verbatim.
const PNPM_JS_ENTRY = /[\\/]pnpm\.[cm]?js$/i;

/** Return the executable and arguments for a portable pnpm child process. */
export function pnpmCommand(args, env = process.env, platform = process.platform) {
  const execPath = env.npm_execpath ?? "";
  return platform === "win32" && PNPM_JS_ENTRY.test(execPath)
    ? [process.execPath, [execPath, ...args]]
    : ["pnpm", args];
}
