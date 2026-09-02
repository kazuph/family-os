import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pnpmCommand } from "./pnpm-command.mjs";

describe("pnpmCommand", () => {
  it("runs pnpm's JavaScript entry directly on Windows", () => {
    assert.deepEqual(
      pnpmCommand(["install"], { npm_execpath: "C:\\tools\\pnpm.cjs" }, "win32"),
      [process.execPath, ["C:\\tools\\pnpm.cjs", "install"]],
    );
  });

  it("does not substitute npm's entry point", () => {
    assert.deepEqual(
      pnpmCommand(["install"], { npm_execpath: "C:\\tools\\npm-cli.js" }, "win32"),
      ["pnpm", ["install"]],
    );
  });

  it("uses PATH lookup on non-Windows platforms", () => {
    assert.deepEqual(
      pnpmCommand(["test"], { npm_execpath: "/tools/pnpm.cjs" }, "darwin"),
      ["pnpm", ["test"]],
    );
  });
});
