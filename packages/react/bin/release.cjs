const {Octokit} = require("@octokit/rest");
const babel = require("@babel/core");
const execAsync = require("./execAsync.cjs");
const {execSync} = require("child_process");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const logFactory = require("d3plus-dev/bin/log.cjs");

const token = shell.env.GITHUB_TOKEN;
const {name, version} = JSON.parse(shell.cat("package.json"));

const github = new Octokit({auth: token});
shell.config.silent = true;
const log = logFactory(`release v${version}`);

let minor = version.split(".");
const prerelease = parseFloat(minor[0]) === 0;
minor = minor.slice(0, minor.length - 1).join(".");

execSync("npm test", {stdio: "inherit"});
log.done();
execSync("npm run docs", {stdio: "inherit"});

log.timer("transpiling ES6 for modules");
shell.rm("-rf", "es");
shell.mkdir("-p", "es");

const babelRC = JSON.parse(shell.cat(path.join(process.cwd(), "node_modules/d3plus-dev/bin/.babelrc")));
babelRC.presets.push("@babel/preset-react");

shell.ls("-R", "src/**/*.js").concat(["index.js"])
  .forEach(file => {
    const {code} = babel.transformFileSync(file, babelRC);
    file.split("/")
      .filter(name => !name.includes("."))
      .reduce((dir, folder) => {
        dir = path.join(dir, folder);
        !fs.existsSync(dir) && fs.mkdirSync(dir);
        return dir;
      }, "es/");
    fs.writeFileSync(`es/${file}`, code);
  });

log.timer("compiling release notes");
let commits = "";

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
  .then(() => execAsync(`git commit -m \"compiles v${version}\"`))
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
    log.exit();
    shell.exit(0);
  })
  .catch(err => {
    log.fail(err);
    log.exit();
    shell.exit(1);
  });
