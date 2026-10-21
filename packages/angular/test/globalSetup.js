import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Builds the ng-packagr bundle the tests drive, from the current source.
 */
export default function setup() {
  try {
    execFileSync("pnpm", ["run", "build"], {cwd: dir, stdio: "pipe"});
  } catch (err) {
    throw new Error(`ng-packagr build failed:\n${err.stdout}${err.stderr}`, {cause: err});
  }
}
