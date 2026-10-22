/**
 * Lists the workspace packages whose tests a change can affect, for CI to
 * test only those. Prints GitHub Actions step outputs:
 *
 *   packages=all | none | <name> <name> …
 *   browser=true | false   (whether core's browser tests run)
 *
 * Usage: node scripts/affected.js <base-ref>
 */
import {execFileSync} from "node:child_process";
import {pathToFileURL} from "node:url";

/**
 * Sorts changed paths into the package folders they touch. Documentation
 * (Markdown) changes nothing a test reads; a change anywhere else outside a
 * package (shared config, test helpers, scripts, the lockfile, CI) can affect
 * every package.
 * @param {string[]} files changed paths, relative to the repo root
 * @returns {{all: boolean, dirs: string[]}}
 */
export function classifyChanges(files) {
  const dirs = new Set();
  for (const file of files) {
    if (file.endsWith(".md")) continue;
    const match = /^packages\/[^/]+(?=\/)/.exec(file);
    if (!match) return {all: true, dirs: []};
    dirs.add(match[0]);
  }
  return {all: false, dirs: [...dirs].sort()};
}

/**
 * Formats the step outputs for a set of affected package names.
 * @param {string[] | "all"} names
 * @returns {string}
 */
export function formatOutputs(names) {
  if (names === "all") return "packages=all\nbrowser=true\n";
  const list = names.length ? names.join(" ") : "none";
  return `packages=${list}\nbrowser=${names.includes("@d3plus/core")}\n`;
}

/**
 * The packages in `dirs` and every package that depends on one of them,
 * since a package's tests run against its dependencies' source.
 * @param {string[]} dirs
 * @returns {string[]}
 */
export function withDependents(dirs) {
  if (!dirs.length) return [];
  const filters = dirs.flatMap(dir => ["--filter", `...{${dir}}`]);
  const out = execFileSync(
    "pnpm",
    ["ls", "-r", "--depth", "-1", "--json", ...filters],
    {
      encoding: "utf8",
    },
  );
  return [...new Set(JSON.parse(out).map(p => p.name))].sort();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const base = process.argv[2];
  const files = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const {all, dirs} = classifyChanges(files);
  process.stdout.write(formatOutputs(all ? "all" : withDependents(dirs)));
}
