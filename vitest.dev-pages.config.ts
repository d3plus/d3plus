import {defineConfig} from "vitest/config";

// `pnpm test:dev-pages`: loads every core dev page in Chromium against a
// fresh UMD build. Kept out of the main config because it takes minutes.
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ["packages/core/test/dev-pages.js"],
    globalSetup: ["packages/core/test/dev-pages.setup.js"],
  },
});
