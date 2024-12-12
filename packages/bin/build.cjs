#! /usr/bin/env node

/**
    @module d3plus-build
    @summary Compiles all files for distribution.
    @desc This script will compile 2 builds, one with all dependencies includes (full) and one with only the core code. Next, each of those builds is minified using uglifyjs. Finally, all those builds, along with the LICENSE and README, are compressed into a .zip file.
*/

const babel = require("@babel/core"),
      execAsync = require("./utils/execAsync.cjs"),
      fs = require("fs"),
      log = require("./utils/log.cjs")("build compile"),
      path = require("path"),
      rollup = require("./utils/rollup.cjs"),
      shell = require("shelljs"),
      {name} = JSON.parse(shell.cat("package.json"));

shell.config.silent = true;

log.timer("transpiling ES6 for modules");
shell.rm("-rf", "build");
shell.mkdir("-p", "build");
shell.rm("-rf", "es");
shell.mkdir("-p", "es");

const babelRC = JSON.parse(shell.cat(path.join(__dirname, "utils/.babelrc")));

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

rollup()
  .then(() => rollup({deps: true}))
  .then(() => {
    log.timer("uglifying builds");
    return execAsync(`uglifyjs build/${name}.js -m --comments -o build/${name}.min.js`);
  })
  .then(() => execAsync(`uglifyjs build/${name}.full.js -m --comments -o build/${name}.full.min.js`))
  .then(() => {
    log.timer("creating .zip distribution");
    const files = ["LICENSE", "README.md",
      `build/${name}.js`, `build/${name}.min.js`,
      `build/${name}.full.js`, `build/${name}.full.min.js`
    ];
    return execAsync(`rm -f build/${name}.zip && zip -j -q build/${name}.zip -- ${files.join(" ")}`);
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
