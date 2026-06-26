import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execSync, spawnSync} from "node:child_process";
import {createInterface} from "node:readline";
import {Octokit} from "@octokit/rest";

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
  const result = spawnSync(editor, [...editorArgs, tmpFile], {stdio: "inherit"});
  if (result.status !== 0) {
    fs.unlinkSync(tmpFile);
    throw new Error("editor exited with a non-zero status");
  }
  const edited = fs.readFileSync(tmpFile, "utf8");
  fs.unlinkSync(tmpFile);
  return edited;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("missing GITHUB_TOKEN in env");
  process.exit(1);
}

import Logger from "./utils/log.js";
let log;

try {
  // ── Version ──────────────────────────────────────────────────────────────
  const packageJSON = JSON.parse(fs.readFileSync("package.json", "utf8"));
  let version = packageJSON.version;
  while (version === packageJSON.version) {
    version = await prompt(
      `Version to release? [${packageJSON.version} is latest]`,
      packageJSON.version,
    );
    if (version === packageJSON.version) {
      rl.output.write("Version must be different from the current version.\n");
    }
  }
  log = Logger(`release v${version}`);

  packageJSON.version = version;
  fs.writeFileSync("package.json", JSON.stringify(packageJSON, null, 2));

  // Bump every workspace package to the release version. pnpm rewrites the
  // `workspace:*` inter-package deps to this version at publish time, so the
  // version field is all that needs syncing here. Done unconditionally (not as
  // a side effect of the optional docs/build step below) so a release can never
  // ship packages still pinned to the previous version.
  for (const dir of fs.readdirSync("packages")) {
    const pkgPath = path.join("packages", dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  const shellOpts = {
    env: {...process.env, FORCE_COLOR: "1", SUBPROCESS: "true"},
    shell: true,
    stdio: "inherit",
  };

  function run(cmd) {
    try {
      execSync(cmd, shellOpts);
    } catch {
      log.fail();
      log.exit();
      process.exit(1);
    }
  }

  // ── Tests & builds ─────────────────────────────────────────────────────
  if (await confirm("Run tests and build?")) {
    run("pnpm test --if-present");
    run("pnpm -r --if-present run build:umd");
    run("pnpm -r --if-present run build:types");
    run("pnpm run docs");
  }

  // ── Release notes ──────────────────────────────────────────────────────
  log.timer("compiling release notes");
  let commits = execSync(
    "git log --pretty=format:'* %s (%h)' `git describe --tags --abbrev=0`...HEAD",
    {encoding: "utf8"},
  );
  log.done();

  let notesConfirmed = false;
  while (!notesConfirmed) {
    console.log("\n── Release notes ──────────────────────────────────────");
    console.log(commits);
    console.log("──────────────────────────────────────────────────────\n");

    const editChoice = await ask("Accept release notes? [Y/e(dit)] ");
    if (editChoice.trim().toLowerCase() === "e") {
      commits = editInEditor(commits);
    } else {
      notesConfirmed = true;
    }
  }

  // ── Commit & tag ───────────────────────────────────────────────────────
  console.log(
    `\nThis will commit all changes, tag as v${version}, and push to origin.`,
  );
  if (!(await confirm("Proceed with commit, tag, and push?"))) {
    log.warn("aborted by user");
    log.exit();
    process.exit(0);
  }

  log.timer("committing all modified files for release");
  execSync("git add --all", shellOpts);
  execSync(`git commit -m "compiles v${version}"`, shellOpts);
  log.done();

  log.timer("tagging latest commit");
  execSync(`git tag v${version}`, shellOpts);
  log.done();

  log.timer("pushing commit and tag to the repository");
  execSync("git push origin --follow-tags", shellOpts);
  log.done();

  // ── GitHub release ─────────────────────────────────────────────────────
  const prerelease = version.includes("-");
  console.log(`\n── GitHub release ─────────────────────────────────────`);
  console.log(`  Tag:        v${version}`);
  console.log(`  Prerelease: ${prerelease}`);
  console.log(`  Body:\n${commits}`);
  console.log(`──────────────────────────────────────────────────────\n`);

  if (!(await confirm("Publish GitHub release?"))) {
    log.warn("skipped GitHub release");
  } else {
    log.timer("publishing release notes");
    const github = new Octokit({auth: token});
    await github.repos.createRelease({
      owner: "d3plus",
      repo: "d3plus",
      tag_name: `v${version}`,
      name: `v${version}`,
      body: commits,
      prerelease,
    });
    log.done();
  }

  // ── npm publish ────────────────────────────────────────────────────────
  if (!(await confirm("Publish npm packages?"))) {
    log.warn("skipped npm publish");
  } else {
    // Verify we have an active npm session, logging in if needed, so the
    // publish below doesn't fail on an expired login.
    function npmLoggedIn() {
      return spawnSync("npm", ["whoami"], {stdio: "ignore"}).status === 0;
    }
    while (!npmLoggedIn()) {
      console.log("\nNot logged in to npm.");
      const result = spawnSync("npm", ["login"], {stdio: "inherit"});
      if (result.status !== 0 && !(await confirm("npm login failed. Try again?"))) {
        throw new Error("npm login required to publish");
      }
    }

    log.timer("publishing npm packages");
    execSync("pnpm -r publish --access=public", shellOpts);
    log.done();
  }

  log.exit();
} catch (err) {
  if (log) {
    log.fail(err.message);
    log.exit();
  } else {
    console.error(err.message);
  }
  process.exit(1);
} finally {
  rl.close();
}
