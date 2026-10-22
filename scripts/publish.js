/**
 * Publishes every public workspace package at the repo's version to npm.
 * Runs in the "Publish to npm" workflow, which npm trusts to publish (OIDC):
 * each package is packed with pnpm (resolving `workspace:` and `catalog:`
 * ranges) and published with npm, which signs it with provenance. Versions
 * already on npm are skipped, so a failed run can be retried.
 *
 * Usage: node scripts/publish.js <tag, e.g. v4.9.0>
 */
import {execFileSync, spawnSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";

/**
 * The npm dist-tag a version publishes under: `next` for a prerelease
 * (`5.0.0-beta.1`), else `latest`.
 * @param {string} version
 * @returns {"next" | "latest"}
 */
export function distTag(version) {
  return version.includes("-") ? "next" : "latest";
}

/**
 * The public packages, each after the workspace packages it depends on, so a
 * package never lands on npm before a dependency's matching version.
 * @param {{name: string, private?: boolean, dir: string,
 *   dependencies?: object, peerDependencies?: object}[]} packages
 * @returns {typeof packages}
 */
export function publishOrder(packages) {
  const byName = new Map(packages.map(p => [p.name, p]));
  const ordered = [],
    seen = new Set();
  const visit = pkg => {
    if (seen.has(pkg.name)) return;
    seen.add(pkg.name);
    const deps = {...pkg.peerDependencies, ...pkg.dependencies};
    for (const name of Object.keys(deps).sort())
      if (byName.has(name)) visit(byName.get(name));
    ordered.push(pkg);
  };
  [...packages].sort((a, b) => a.name.localeCompare(b.name)).forEach(visit);
  return ordered.filter(p => !p.private);
}

/**
 * Every package under `packages/`, with its folder.
 * @param {string} root the repo root
 */
export function workspacePackages(root) {
  const dir = path.join(root, "packages");
  return fs
    .readdirSync(dir)
    .map(name => path.join(dir, name))
    .filter(pkgDir => fs.existsSync(path.join(pkgDir, "package.json")))
    .map(pkgDir => ({
      ...JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")),
      dir: pkgDir,
    }));
}

function published(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
    encoding: "utf8",
  });
  return result.status === 0 && result.stdout.trim() === version;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const root = path.resolve(import.meta.dirname, "..");
  const {version} = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const tag = process.argv[2];
  if (tag !== `v${version}`)
    throw new Error(`tag ${tag} doesn't match the repo version v${version}`);

  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "d3plus-publish-"));
  for (const pkg of publishOrder(workspacePackages(root))) {
    if (pkg.version !== version)
      throw new Error(`${pkg.name} is at ${pkg.version}, not ${version}`);
    if (published(pkg.name, version)) {
      console.log(`${pkg.name}@${version} is already on npm`);
      continue;
    }
    const out = execFileSync("pnpm", ["pack", "--pack-destination", dest], {
      cwd: pkg.dir,
      encoding: "utf8",
    });
    const tarball = out.trim().split("\n").pop();
    execFileSync(
      "npm",
      ["publish", tarball, "--access", "public", "--tag", distTag(version)],
      {stdio: "inherit"},
    );
  }
}
