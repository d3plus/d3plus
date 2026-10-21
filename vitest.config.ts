import react from "@vitejs/plugin-react";
import {playwright} from "@vitest/browser-playwright";
import {defineConfig} from "vitest/config";

import {aliases} from "./test/aliases.js";
import {commands} from "./test/browser/commands.ts";
import {builtOutput} from "./test/builtOutput.js";

// `D3PLUS_TEST_TARGET=es` (`pnpm test:built`) runs against the built es/
// output instead of the source.
const built = process.env.D3PLUS_TEST_TARGET === "es";

const canvasSetup = "test/canvas-setup.js";

/** A Node project running `packages/<name>/test/**\/*-test.js`. */
const node = (name: string, test = {}) => ({
  extends: true,
  test: {name, include: [`packages/${name}/test/**/*-test.js`], ...test},
});

export default defineConfig({
  root: import.meta.dirname,
  plugins: built ? [builtOutput()] : [],
  resolve: {alias: built ? aliases.filter(a => String(a.find).includes("~test")) : aliases},
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
      node("core", {
        exclude: ["**/*.browser-test.js"],
        setupFiles: [canvasSetup],
        testTimeout: 60000,
        hookTimeout: 60000,
      }),
      {
        extends: true,
        test: {
          name: "core-browser",
          include: ["packages/core/test/**/*.browser-test.js"],
          testTimeout: 60000,
          hookTimeout: 60000,
          // After the Node projects, so they don't compete for the CPU.
          sequence: {groupOrder: 1},
          maxWorkers: "50%",
          provide: {
            updateSnapshots: process.argv.some(arg => arg === "-u" || arg === "--update"),
          },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // Only the test server resolves: map tiles and other remote
              // requests fail at once instead of reaching the network.
              launchOptions: {
                args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1"],
              },
              contextOptions: {deviceScaleFactor: 1},
            }),
            instances: [{browser: "chromium"}],
            viewport: {width: 1280, height: 720},
            screenshotFailures: false,
            commands,
          },
        },
      },
      {
        extends: true,
        test: {name: "docs-scripts", include: ["scripts/docs/test/**/*-test.js"]},
      },
    ],
  },
});
