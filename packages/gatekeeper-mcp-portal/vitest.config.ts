import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/*.test.ts"],
    environment: "node",
    alias: {
      "cloudflare:workers": fileURLToPath(
        new URL("../mcp-shared/__tests__/stubs/cloudflare-workers.ts", import.meta.url)),
    },
  },
});
