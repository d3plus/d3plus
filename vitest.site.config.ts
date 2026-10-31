import {defineConfig} from "vitest/config";

// `pnpm test:site`: builds the docs site and loads every page in Chromium,
// then checks a few pages on the dev server.
// Kept out of the main config because it builds the site first.
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ["packages/site/test/pages.js", "packages/site/test/dev.js"],
    globalSetup: ["packages/site/test/pages.setup.js"],
  },
});
