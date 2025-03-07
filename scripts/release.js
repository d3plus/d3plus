// export GITHUB_TOKEN=xxx
// git config --global credential.helper osxkeychain

/**
    @module d3plus-release
    @summary Publishes a release for a module.
    @desc If the version number in the package.json has been bumped, this script will compile the release, publish it to NPM, update README documentation, and tag and publish release notes on Github.
**/

import {Octokit} from "@octokit/rest";
import execAsync from "./utils/execAsync.js";
import {execSync} from "child_process";
import fs from "fs";
import shell from "shelljs";
const token = shell.env.GITHUB_TOKEN;
const {name, version} = JSON.parse(shell.cat("package.json"));

shell.config.silent = true;

import Logger from "../utils/log.js";
const log = Logger(`release v${version}`);

let minor = version.split(".");
const prerelease = parseFloat(minor[0]) === 0;
minor = minor.slice(0, minor.length - 1).join(".");

execSync("npm run test", {stdio: "inherit"});
execSync("d3plus-build", {stdio: "inherit"});

/**
    Final steps for release.
    @private
**/
function finishRelease() {

  const github = new Octokit({auth: token});

  log.done();
  execSync("d3plus-docs", {stdio: "inherit"});
  let commits = "", releaseUrl = "", zipSize = 0;

  log.timer("compiling release notes");
  execAsync("git log --pretty=format:'* %s (%h)' `git describe --tags --abbrev=0`...HEAD")
    .then(stdout => {
      commits = stdout;
      log.timer("publishing npm package");
      return execAsync("npm publish ./");
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
      log.timer("pushing to repository");
      return execAsync("git push origin --follow-tags");
    })
    .then(() => {
      log.timer("publishing release notes");
      return github.repos.createRelease({
        owner: "d3plus",
        repo: name,
        tag_name: `v${version}`,
        name: `v${version}`,
        body: commits,
        prerelease
      });
    })
    .then(() => {
      log.timer("attaching .zip distribution to release");
      return github.repos.getReleaseByTag({
        owner: "d3plus",
        repo: name,
        tag: `v${version}`
      });
    })
    .then(release => {
      releaseUrl = release.data.upload_url;
      zipSize = fs.statSync(`build/${name}.zip`).size;

      return github.repos.uploadReleaseAsset({
        url: releaseUrl,
        headers: {
          "content-length": zipSize,
          "content-type": "application/zip"
        },
        data: fs.createReadStream(`build/${name}.zip`),
        name: `${name}.zip`,
        label: `${name}.zip`
      });

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

}

log.done();
finishRelease();
