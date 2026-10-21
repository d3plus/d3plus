import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execSync, spawn, spawnSync} from "node:child_process";
import {createInterface} from "node:readline";

import Logger from "./utils/log.js";

// ── CLI helpers ──────────────────────────────────────────────────────────────

const rl = createInterface({input: process.stdin, output: process.stdout});
const ask = q => new Promise(resolve => rl.question(q, resolve));

async function confirm(question) {
  const answer = await ask(`${question} [Y/n] `);
  return answer.trim().toLowerCase() !== "n";
}

async function prompt(question, defaultValue) {
  const answer = await ask(`${question} [${defaultValue}] `);
  return answer.trim() || defaultValue;
}

function editInEditor(text) {
  const tmpFile = path.join(
    os.tmpdir(),
    `d3plus-release-notes-${Date.now()}.md`,
  );
  fs.writeFileSync(tmpFile, text, "utf8");
  const [editor, ...editorArgs] = (process.env.EDITOR || process.env.VISUAL || "vi").split(/\s+/);
  // Release the terminal while the editor owns it.
  rl.pause();
  const result = spawnSync(editor, [...editorArgs, tmpFile], {stdio: "inherit"});
  rl.resume();
  if (result.status !== 0) {
    fs.unlinkSync(tmpFile);
    throw new Error("editor exited with a non-zero status");
  }
  const edited = fs.readFileSync(tmpFile, "utf8");
  fs.unlinkSync(tmpFile);
  return edited;
}

const git = cmd => execSync(`git ${cmd}`, {encoding: "utf8"}).trim();

// Extract the CHANGELOG.md section for `version` — the text between its
// `## <version>` heading and the next `##` heading (or end of file). The
// heading matches when its first token equals the version, so `## 4.1.0` and
// `## 4.1.0 - 2026-07-09` both resolve. Returns null when there is no file or
// no matching section, so the caller can fall back to the commit list.
function changelogNotes(version) {
  let text;
  try {
    text = fs.readFileSync("CHANGELOG.md", "utf8");
  } catch {
    return null;
  }
  const lines = text.split("\n");
  const isHeading = line => /^##\s+/.test(line);
  const headingVersion = line => line.replace(/^##\s+/, "").trim().split(/\s+/)[0];

  const start = lines.findIndex(l => isHeading(l) && headingVersion(l) === version);
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (isHeading(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim() || null;
}

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

// ── Main ─────────────────────────────────────────────────────────────────────

let log = Logger("release");
// Set once package.json files are rewritten, so a failure or abort before the
// release commit puts the (verified clean) tree back.
let dirty = false;

function restoreTree() {
  if (!dirty) return;
  execSync("git checkout -- .", {stdio: "ignore"});
  dirty = false;
  log.warn("restored the working tree");
}

/**
 * Runs a shell command behind one spinner line. Its output is captured and
 * printed (the last 200 lines) only if it fails.
 */
async function run(label, cmd, {input} = {}) {
  log.timer(label);
  const output = [];
  const code = await new Promise(resolve => {
    const child = spawn(cmd, {
      env: {...process.env, FORCE_COLOR: "1", SUBPROCESS: "true"},
      shell: true,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    child.stdout.on("data", d => output.push(d));
    child.stderr.on("data", d => output.push(d));
    child.on("close", resolve);
    if (input !== undefined) child.stdin.end(input);
  });
  if (code !== 0) {
    log.fail(`${label} (exit ${code})`);
    const lines = Buffer.concat(output).toString("utf8").trimEnd().split("\n");
    if (lines.length > 200) console.error(`… ${lines.length - 200} earlier lines omitted`);
    console.error(lines.slice(-200).join("\n"));
    throw Object.assign(new Error(`${cmd} failed`), {logged: true});
  }
  log.done();
}

try {
  // ── Preflight ────────────────────────────────────────────────────────────
  // Everything that can make a release fail half-way is checked before any
  // file is touched.
  log.timer("checking the repository");
  if (git("status --porcelain")) throw new Error("the working tree is not clean");
  const branch = git("rev-parse --abbrev-ref HEAD");
  if (branch !== "main") throw new Error(`releases are cut from main (on ${branch})`);
  execSync("git fetch origin main --tags --quiet");
  if (git("rev-parse HEAD") !== git("rev-parse origin/main")) {
    throw new Error("main is not in sync with origin/main");
  }
  log.done();

  log.timer("checking GitHub and npm sessions");
  if (spawnSync("gh", ["auth", "status"], {stdio: "ignore"}).status !== 0) {
    throw new Error("the GitHub CLI is not logged in (run `gh auth login`)");
  }
  log.done();
  while (spawnSync("npm", ["whoami"], {stdio: "ignore"}).status !== 0) {
    console.log("\nNot logged in to npm.");
    rl.pause();
    const result = spawnSync("npm", ["login"], {stdio: "inherit"});
    rl.resume();
    if (result.status !== 0 && !(await confirm("npm login failed. Try again?"))) {
      throw new Error("npm login required to publish");
    }
  }

  // ── Version ──────────────────────────────────────────────────────────────
  const packageJSON = JSON.parse(fs.readFileSync("package.json", "utf8"));
  let version;
  for (;;) {
    version = (await prompt("Version to release?", packageJSON.version)).replace(/^v/, "");
    if (version === packageJSON.version) {
      console.log(`${version} is the current version; pick a new one.`);
    } else if (!SEMVER.test(version)) {
      console.log(`${version} is not a semver version (e.g. 4.9.0 or 4.9.0-beta.1).`);
    } else if (git(`tag --list v${version}`)) {
      console.log(`tag v${version} already exists.`);
    } else break;
  }
  const prerelease = version.includes("-");

  // Bump every workspace package to the release version. pnpm rewrites the
  // `workspace:*` inter-package deps to this version at publish time, so the
  // version field is all that needs syncing here.
  dirty = true;
  for (const file of ["package.json", ...fs.readdirSync("packages").map(dir => path.join("packages", dir, "package.json"))]) {
    if (!fs.existsSync(file)) continue;
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    pkg.version = version;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
  }
  log = Logger(`release v${version}`);

  // ── Builds, docs & tests ───────────────────────────────────────────────
  // Every publishable output is gitignored, so it is always rebuilt: the
  // publish below must never pick up stale or missing files.
  await run("building ESM", "pnpm -r --if-present run build:esm");
  await run("building types", "pnpm -r --if-present run build:types");
  await run("building UMD bundles", "pnpm -r --if-present run build:umd");
  await run("generating docs", "pnpm run docs");
  // The suite runs against the source, so a few suites always run against
  // the es/ output just built.
  await run("testing the built output", "pnpm test:built");
  if (await confirm("Run the test suite?")) await run("running tests", "pnpm test");

  // ── Release notes ──────────────────────────────────────────────────────
  // Prefer the CHANGELOG.md section for this version; fall back to the commit
  // list since the previous tag when there is no matching section.
  let notes = changelogNotes(version);
  if (!notes) {
    log.warn(`no CHANGELOG.md section for ${version}; using the commit log`);
    notes = git("log --pretty=format:'* %s (%h)' `git describe --tags --abbrev=0`...HEAD");
  }

  for (;;) {
    console.log("\n── Release notes ──────────────────────────────────────");
    console.log(notes);
    console.log("──────────────────────────────────────────────────────\n");
    const choice = await ask("Accept release notes? [Y/e(dit)] ");
    if (choice.trim().toLowerCase() !== "e") break;
    notes = editInEditor(notes);
  }

  // ── Commit, publish, push, release ─────────────────────────────────────
  const tag = prerelease ? "next" : "latest";
  console.log(
    `v${version} will be committed and tagged, published to npm under "${tag}",` +
      " pushed to origin, and released on GitHub.",
  );
  if (!(await confirm("Proceed?"))) {
    log.warn("aborted by user");
    restoreTree();
    log.exit();
    process.exit(0);
  }

  // Build output is gitignored, so this stages only the version bumps and
  // the regenerated docs.
  await run("committing release", `git add -- package.json packages && git commit -m "compiles v${version}"`);
  dirty = false;
  await run("tagging release", `git tag v${version}`);
  // npm first: if publishing fails, nothing is public yet and the local
  // commit + tag can be dropped and retried.
  await run("publishing npm packages", `pnpm -r publish --access=public --tag ${tag}`);
  await run("pushing commit and tag", "git push origin --follow-tags");
  await run(
    "creating GitHub release",
    `gh release create v${version} --title v${version} --notes-file - --verify-tag${prerelease ? " --prerelease" : ""}`,
    {input: notes},
  );

  log.exit();
} catch (err) {
  if (!err.logged) log.fail(err.message);
  restoreTree();
  log.exit();
  process.exitCode = 1;
} finally {
  rl.close();
}
