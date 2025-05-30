/**
    @module d3plus-docs
    @summary Generates documentation based on code comments.
    @desc Generates the READEME.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
*/

import fs from "node:fs";
import path from "node:path";
import jsdoc2md from "jsdoc-to-markdown";
import shell from "shelljs";

import Logger from "../utils/log.js";
const log = Logger("documentation");

import readmeStub from "./stubs/README.js";
import argsStub from "./stubs/args.js";
import packageStub from "./stubs/package.js";
import storiesStub from "./stubs/stories.js";

shell.config.silent = true;
const {version} = JSON.parse(shell.cat("package.json"));

async function generateMarkdown() {
  const folders = shell.ls("-d", "packages/*");
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    
    const template = `${shell.tempdir()}/README.hbs`;
    let packageJSON = JSON.parse(shell.cat(`${folder}/package.json`));
    const {name} = packageJSON;

    log.timer(`updating package.json for ${name}`);
    packageJSON.version = version;
    packageJSON = packageStub(packageJSON);
    fs.writeFileSync(`${folder}/package.json`, JSON.stringify(packageJSON, null, 2));

    if (name === "@d3plus/docs") {
      log.done();
      shell.echo("");
      continue;
    }

    log.timer(`writing JSDOC comments to README.md for ${name}`);
    const readmeContent = readmeStub(packageJSON);
    new shell.ShellString(readmeContent).to(template);

    const outputRender = await jsdoc2md
      .render({
        files: `${folder}/src/**/*.+(js|jsx)`,
        helper: "scripts/docs/helpers.cjs",
        noCache: true,
        partial: "scripts/docs/partials/*.hbs",
        separators: true,
        template: fs.readFileSync(template, "utf8")
      })
      .catch(err => {
        log.fail();
        shell.echo(err);
        shell.exit(1);
      });
    
    fs.writeFileSync(`${folder}/README.md`, outputRender);

    log.timer(`writing JSDOC comments to Storybook Args for ${name}`);
    const publicDocs = await jsdoc2md
      .getJsdocData({
        files: `${folder}/src/**/*.+(js|jsx)`,
        noCache: true
      })
      .then(arr => arr.filter(d => !["package"].includes(d.kind) && d.access !== "private" && !d.undocumented));

    const stories = publicDocs.filter(d => !d.memberof);
    stories.forEach(story => {

      const {kind, meta, name} = story;
      const regex = new RegExp(/packages\/([a-z].+)\/src(\/.*)?/g);
      const [, packageName, filePath] = regex.exec(meta.path);
      
      // if (kind === "class") {
        const argsPath = path.join(folder, `../docs/args/${packageName}${filePath || ""}/${name}.args.jsx`);
        const argsContent = argsStub(story, publicDocs, stories);
        const argsFolder = path.dirname(argsPath);
        shell.mkdir("-p", argsFolder);
        fs.writeFileSync(argsPath, argsContent);
      // }

      const storyPath = path.join(folder, `../docs/packages/${packageName}${filePath || ""}/${name}.stories.jsx`);
      const existingContent = fs.existsSync(storyPath) ? fs.readFileSync(storyPath, {encoding: "utf8"}) : "";
      const storyContent = storiesStub(story, packageName, filePath || "", existingContent);
      const storyFolder = path.dirname(storyPath);
      shell.mkdir("-p", storyFolder);
      fs.writeFileSync(storyPath, storyContent);

    });

    log.done();
    shell.echo("");
      
  }
  log.exit();
  shell.exit(0);

}

generateMarkdown();

