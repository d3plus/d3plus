// export GITHUB_TOKEN=xxx
// git config --global credential.helper osxkeychain

/**
    @module d3plus-release
    @summary Publishes a release for a module.
    @desc If the version number in the package.json has been bumped, this script will compile the release, publish it to NPM, update README documentation, and tag and publish release notes on Github.
**/

import fs from "node:fs";
import {Octokit} from "@octokit/rest";
import execAsync from "./utils/execAsync.js";
import shell from "shelljs";

const version = process.argv[2];
if (!version) {
  shell.echo("missing new version number as argument");
  shell.exit(1);
}

const token = shell.env.GITHUB_TOKEN;
if (!token) {
  shell.echo("missing GITHUB_TOKEN in env");
  shell.exit(1);
}

import Logger from "./utils/log.js";
shell.config.silent = true;
const log = Logger(`release v${version}`);

const github = new Octokit({auth: token});
const prerelease = version.split(".")[2].includes("alpha") || version.split(".")[2].includes("beta");

const packageJSON = JSON.parse(shell.cat("package.json"));

let commits = "";

log.timer("running linting and tests");
execAsync("npm test")
  .then(() => {
    log.timer("compiling documentation");
    if (packageJSON.version !== version) {
      packageJSON.version = version;
      fs.writeFileSync("package.json", JSON.stringify(packageJSON, null, 2));
    }
    return execAsync("npm run docs");
  })
  .then(() => {
    log.timer("compiling release notes");
    return execAsync("git log --pretty=format:'* %s (%h)' `git describe --tags --abbrev=0`...HEAD");
  })
  .then(() => {
    log.timer("commiting all modified files for release");
    return execAsync("git add --all");
  })
  .then(() => execAsync(`git commit -m "compiles v${version}"`))
  .then(() => {
    log.timer("tagging latest commit");
    return execAsync(`git tag v${version}`);
  })
  .then(() => {
    log.timer("pushing to commit and tag to the repository");
    return execAsync("git push origin --follow-tags");
  })
  .then(() => {
    log.timer("publishing release notes");
    return github.repos.createRelease({
      owner: "d3plus",
      repo: "d3plus",
      tag_name: `v${version}`,
      name: `v${version}`,
      body: commits,
      prerelease
    });
  })
  .then(() => {
    log.timer("publishing npm package");
    return execAsync("npm publish ./");
  })
  .then(() => {
    log.exit();
    shell.exit(0);
  })
  .catch(err => {
    log.fail(err);
    log.exit();
    shell.exit(1);
  });
