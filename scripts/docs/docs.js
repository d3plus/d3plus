/**
    @module d3plus-docs
    @summary Generates documentation based on code comments.
    @desc Generates the READEME.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
*/

import fs from "node:fs";
import jsdoc2md from "jsdoc-to-markdown";
import shell from "shelljs";

import Logger from "../utils/log.js";
const log = Logger("documentation");

import readmeStub from "./stubs/README.js";
import argsStub from "./stubs/args.js";

shell.config.silent = true;
const {version} = JSON.parse(shell.cat("package.json"));

async function generateMarkdown() {
  const folders = shell.ls("-d", "packages/*");
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    
    const template = `${shell.tempdir()}/README.hbs`;
    const {name, description} = JSON.parse(shell.cat(`${folder}/package.json`));
    log.timer(`writing JSDOC comments to README.md for ${name}`);

    const contents = readmeStub(name, description, version);
    new shell.ShellString(contents).to(template);

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

    if (folder.includes("core")) {
      const outputObject = await jsdoc2md
        .getJsdocData({
          files: `${folder}/src/**/*.+(js|jsx)`,
          noCache: true
        })
        .then(arr => arr.filter(d => 
          d.params && d.params.length && 
          d.memberof && !d.memberof.includes("<anonymous>") && 
          d.access !== "private" && !d.undocumented)
        )
        .then(arr => arr.reduce((obj, d) => {
          if (!obj[d.memberof]) obj[d.memberof] = [];
          obj[d.memberof].push(d);
          return obj;
        }, {}));

      const keys = Object.keys(outputObject);
      for (let i = 0; i < keys.length; i++) {
        const methods = outputObject[keys[i]];
        const contents = argsStub(keys[i], methods);
        if (keys[i] === "Pie") console.log(contents);
      }

    }
      
  }
  log.exit();
  shell.exit(0);

}

generateMarkdown();

