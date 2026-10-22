import {execFileSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args, cwd) {
  try {
    execFileSync("pnpm", args, {cwd, stdio: "pipe"});
  } catch (err) {
    throw new Error(`pnpm ${args.join(" ")} failed:\n${err.stdout}${err.stderr}`, {cause: err});
  }
}

/**
 * Builds the ng-packagr bundle the tests drive, from the current source.
 * ng-packagr type-checks against @d3plus/dom's declarations, so those are
 * built first when missing (e.g. in a fresh checkout).
 */
export default function setup() {
  const dom = path.join(dir, "..", "dom");
  if (!fs.existsSync(path.join(dom, "types", "index.d.ts"))) run(["run", "build:types"], dom);
  run(["run", "build"], dir);
}
