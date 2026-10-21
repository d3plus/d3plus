import react from "@vitejs/plugin-react";
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
    },
    projects: [
      ...["color", "data", "format", "locales", "math", "svelte", "vue", "element"].map(name => node(name)),
      // Server renders pay for transforming core on first use.
      node("ssr", {testTimeout: 20000}),
      node("dom", {setupFiles: [canvasSetup], testTimeout: 10000}),
      node("text", {setupFiles: [canvasSetup]}),
      node("render", {setupFiles: [canvasSetup]}),
      node("export"),
      node("angular", {globalSetup: ["packages/angular/test/globalSetup.js"]}),
      {
        extends: true,
        plugins: [react()],
        test: {name: "react", include: ["packages/react/test/**/*-test.mjs"]},
      },
      {
        extends: true,
        test: {name: "docs-scripts", include: ["scripts/docs/test/**/*-test.js"]},
      },
    ],
  },
});
