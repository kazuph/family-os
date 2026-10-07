import { defineConfig, mergeConfig } from "vitest/config";
import bookConfig from "./vitest.book.config";

export default mergeConfig(bookConfig, defineConfig({
  test: {include: ["__book_tests__/cutover.test.ts"]},
}));
