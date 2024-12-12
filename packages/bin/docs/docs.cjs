#! /usr/bin/env node

/**
    @module d3plus-docs
    @summary Generates documentation based on code comments.
    @desc Generates the READEME.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
*/

const log = require("../utils/log.cjs")("documentation"),
      shell = require("shelljs");

shell.config.silent = true;
const {description, name, version} = JSON.parse(shell.cat("package.json"));

const versions = version.split(".").map(Number);
const major = versions[0];

log.timer("writing JSDOC comments to README.md");

const docs = shell.cat(`${__dirname}/partials/docs.hbs`),
      toc = shell.cat(`${__dirname}/partials/toc.hbs`);

const template = `${shell.tempdir()}/README.hbs`;

const contents = `# ${name}

${description}

## Installing

If using npm, \`npm install ${name}\`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/${name}/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/${name}@${major}).

\`\`\`js
import modules from "${name}";
\`\`\`

${name} can be loaded as a standalone library or bundled as part of [D3plus](https://github.com/d3plus/d3plus). ES modules, AMD, CommonJS, and vanilla environments are supported. In vanilla, a \`d3plus\` global is exported:

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/${name}@${major}"></script>
<script>
  console.log(d3plus);
</script>
\`\`\`

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [d3plus-react](https://github.com/d3plus/d3plus-react/). These examples are powered by the [d3plus-storybook](https://github.com/d3plus/d3plus-storybook/) repo, and PRs are always welcome. :beers:

## API Reference

${toc}

---

${docs}

###### <sub>Documentation generated on {{currentDate}}</sub>
`;
new shell.ShellString(contents).to(template);

/**
    @function errorHandler
    @summary Handles exec/promise errors.
    @param {Function} [cb] Callback function.
    @private
*/
function errorHandler(cb) {

  return (code, stdout) => {

    if (code) {
      log.fail();
      shell.echo(code, stdout);
      shell.exit(code);
    }
    else if (cb) cb(code, stdout);
    else {
      log.exit();
      shell.exit(0);
    }

  };
}

const jsdocConfig = `--separators --helper ${ __dirname }/helpers.cjs --partial '${ __dirname }/partials/*.hbs'`;
shell.exec(`jsdoc2md '+(bin|src)/**/*.+(js|jsx)' ${jsdocConfig} -t ${ template } > README.md`, errorHandler(() => {

  shell.exec("git add README.md && git commit -m \"updates documentation\" && git push", () => {

    log.exit();
    shell.exit(0);

  });

}));
