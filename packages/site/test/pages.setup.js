import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/**
 * Builds the site from the current source. The API manifest must exist
 * (`pnpm --filter @d3plus/site run manifest`, after building the packages).
 */
export default function setup() {
  try {
    execFileSync("pnpm", ["run", "build"], {
      cwd: siteDir,
      stdio: "pipe",
      // Vitest sets NODE_ENV=test, which Astro would build with.
      env: {
        ...process.env,
        NODE_ENV: "production",
        ASTRO_TELEMETRY_DISABLED: "1",
      },
    });
  } catch (err) {
    throw new Error(`site build failed:\n${err.stdout}${err.stderr}`, {
      cause: err,
    });
  }
}
