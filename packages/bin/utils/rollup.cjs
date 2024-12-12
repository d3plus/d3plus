const {getBabelOutputPlugin} = require("@rollup/plugin-babel"),
      commonjs = require("@rollup/plugin-commonjs"),
      {nodeResolve} = require("@rollup/plugin-node-resolve"),
      json = require("@rollup/plugin-json"),
      log = require("./log.cjs")("rollup"),
      replace = require("@rollup/plugin-replace"),
      rollup = require("rollup"),
      shell = require("shelljs"),
      {description, homepage, license, name, version} = JSON.parse(shell.cat("package.json"));

shell.config.silent = true;
module.exports = async function(opts = {}) {

  const polyfillBuild = await rollup.rollup({
    input: `${__dirname}/polyfills.js`,
    plugins: [commonjs(), nodeResolve({preferBuiltins: false})],
    onwarn: () => {}
  });
  const polyfillBundle = await polyfillBuild.generate({format: "umd"});
  const polyfills = polyfillBundle.output[0].code;

  const plugins = [
    replace({
      "process.env.NODE_ENV": JSON.stringify(opts.env || "production")
    }), 
    json()
  ];
  if (opts.deps) {
    plugins.push(commonjs());
    plugins.push(nodeResolve({mainFields: ["jsnext:main", "module", "main"], preferBuiltins: false}));
  }
  plugins.push(getBabelOutputPlugin({
    generatorOpts: {compact: false},
    allowAllFormats: true,
    configFile: `${__dirname}/.babelrc`
  }));

  const input = {
    input: "index.js",
    plugins,
    onwarn: () => {}
  };

  const output = {
    amd: {id: name},
    banner: `/*
  ${name} v${version}
  ${description}
  Copyright (c) ${new Date().getFullYear()} D3plus - ${homepage}
  @license ${license}
*/

${polyfills}`,
    file: `build/${name}${opts.deps ? ".full" : ""}.js`,
    format: "umd",
    name: "d3plus",
    sourcemap: true,
    sourcemapFile: `build/${name}${opts.deps ? ".full" : ""}.js`,
    strict: !opts.deps
  };

  /**
      @function output
      @desc Custom event handler for rollup watch bundle.
      @private
  */
  function onwarn(e) {
    switch (e.code) {
      case "BUNDLE_START":
        log.update(`bundling ${output.file}`);
        return undefined;
      case "BUNDLE_END":
        log.done(`bundled ${output.file} in ${e.duration}ms`);
        if (opts.watch) log.timer("watching for changes...");
        return undefined;
      case "CIRCULAR_DEPENDENCY":
          return undefined;
      case "ERROR":
      case "FATAL":
        log.fail();
        shell.echo(`bundle error in '${e.error.id}':`);
        return shell.echo(e.error);
      default:
        return undefined;
    }
  }

  log.timer(`bundling ${output.file}`);
  shell.mkdir("-p", "build");
  if (opts.watch) return rollup.watch(Object.assign(input, {output: [output]})).on("event", onwarn);
  else return rollup.rollup(input).then(bundle => bundle.write(output));

};
