import {it} from "vitest";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import net from "node:net";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {check} from "./browser.js";

/**
    Starts `astro dev` and draws the playgrounds on a few pages. Dev runs
    transforms the production build skips (Preact's Babel plugins), so a page
    that builds cleanly can still fail here.
*/

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const astro = path.join(siteDir, "node_modules/astro/bin/astro.mjs");

/** A port nothing is listening on. */
function freePort() {
  return new Promise(resolve => {
    const probe = net.createServer().listen(0, "127.0.0.1", () => {
      const {port} = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/**
 * This process's environment minus what Vitest sets: under `VITEST`, Astro's
 * dev server skips its page handler and answers every page with a 404.
 */
function devEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => key !== "NODE_ENV" && !key.startsWith("VITEST"),
    ),
  );
}

/**
 * Runs `astro dev` in the site folder and resolves once it is serving.
 * `--ignore-lock` keeps it in the foreground when an AI agent runs the tests
 * (Astro would otherwise move it to the background).
 */
async function startDev() {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    [astro, "dev", "--port", port, "--host", "127.0.0.1", "--ignore-lock"],
    {
      cwd: siteDir,
      env: {...devEnv(), ASTRO_TELEMETRY_DISABLED: "1"},
    },
  );
  let output = "";
  await new Promise((resolve, reject) => {
    const read = chunk => {
      output += chunk;
      if (output.includes(`127.0.0.1:${port}`)) resolve();
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.on("exit", code =>
      reject(new Error(`astro dev exited (${code}):\n${output}`)),
    );
  });
  return {origin: `http://127.0.0.1:${port}`, stop: () => child.kill()};
}

it(
  "the dev server renders playground pages without errors or warnings",
  {timeout: 10 * 60 * 1000},
  async () => {
    const server = await startDev();
    const browser = await chromium.launch();
    try {
      const failures = [];
      for (const url of ["/", "/core/charts/treemap/", "/guides/frameworks/"]) {
        // Dev compiles a page on its first request; warm it up first.
        await fetch(`${server.origin}${url}`);
        const problems = await check(browser, server.origin, url, {
          timeout: 120000,
        });
        if (problems.length)
          failures.push(`${url}\n    ${problems.join("\n    ")}`);
      }
      assert.equal(failures.length, 0, `\n  ${failures.join("\n  ")}`);
    } finally {
      await browser.close();
      server.stop();
    }
  },
);
