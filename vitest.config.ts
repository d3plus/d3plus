import {defineConfig} from "vitest/config";

import {aliases} from "./test/aliases.js";

const canvasSetup = "test/canvas-setup.js";

/** A Node project running `packages/<name>/test/**\/*-test.js`. */
const node = (name: string, test = {}) => ({
  extends: true,
  test: {name, include: [`packages/${name}/test/**/*-test.js`], ...test},
});

export default defineConfig({
  root: import.meta.dirname,
  resolve: {alias: aliases},
  test: {
    silent: "passed-only",
    reporters: process.env.GITHUB_ACTIONS ? ["default", "github-actions"] : ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: ["packages/*/{index,internal,umd-entry}.{ts,tsx}", "packages/*/src/**"],
    },
    projects: [
      ...["color", "data", "format", "locales", "math"].map(name => node(name)),
      node("dom", {setupFiles: [canvasSetup], testTimeout: 10000}),
      node("text", {setupFiles: [canvasSetup]}),
      node("render", {setupFiles: [canvasSetup]}),
      {
        extends: true,
        test: {name: "docs-scripts", include: ["scripts/docs/test/**/*-test.js"]},
      },
    ],
  },
});
