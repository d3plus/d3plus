import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const coreDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Builds the full UMD bundle the dev pages load, from the current source.
 */
export default function setup() {
  try {
    execFileSync("node", ["../../scripts/build-umd.js"], {cwd: coreDir, stdio: "pipe"});
  } catch (err) {
    throw new Error(`UMD build failed:\n${err.stdout}${err.stderr}`, {cause: err});
  }
}
