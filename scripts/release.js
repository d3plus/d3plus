import fs from "node:fs";
import {Octokit} from "@octokit/rest";
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
const log = Logger(`release v${version}`);

const packageJSON = JSON.parse(shell.cat("package.json"));
if (packageJSON.version !== version) {
  packageJSON.version = version;
  fs.writeFileSync("package.json", JSON.stringify(packageJSON, null, 2));
}

const shellOpts = {
  async: false, 
  env: {...process.env, FORCE_COLOR: true, SUBPROCESS: true},
  shell: true, 
  stdio: "inherit"
};

const catcher = ({code}) => {
  if (code) {
    log.fail();
    log.exit();
    shell.exit(1);
  }
};

catcher(shell.exec("npm test", shellOpts));
catcher(shell.exec("npm run docs", shellOpts));
catcher(shell.exec("npm run build:umd --workspaces --if-present", shellOpts));

log.timer("compiling release notes");
const {stdout: commits} = shell.exec("git log --pretty=format:'* %s (%h)' `git describe --tags --abbrev=0`...HEAD", {async: false, silent: true});

log.timer("commiting all modified files for release");
shell.exec("git add --all", shellOpts);
shell.exec(`git commit -m "compiles v${version}"`, shellOpts);

log.timer("tagging latest commit");
shell.exec(`git tag v${version}`, shellOpts);

log.timer("pushing commit and tag to the repository");
shell.exec("git push origin --follow-tags", shellOpts);

log.timer("publishing release notes");
const github = new Octokit({auth: token});
github.repos.createRelease({
    owner: "d3plus",
    repo: "d3plus",
    tag_name: `v${version}`,
    name: `v${version}`,
    body: commits,
    prerelease: version.includes("-")
  })
  .then(() => {
    log.timer("publishing npm package");
    return shell.exec("npm publish --workspaces --access=public", shellOpts);
  })
  .then(() => {
    log.exit();
    shell.exit(0);
  })
  .catch(catcher);
