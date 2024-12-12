#! /usr/bin/env node

/**
    @module d3plus-dev
    @summary Spins up the development environment.
    @desc Initializes the development server, which will open a connection on `localhost:4000` and continuously watch the `./src` directory for file changes. When a change is detected, it will rebundle the full javascript build and refresh any open web browsers.
**/

const log = require("./utils/log.cjs")("development environment"),
      port = 4000,
      rollup = require("./rollup.cjs");

log.timer(`starting live-server on port ${port}`);
require("live-server").start({
  logLevel: 0,
  noBrowser: true,
  port,
  watch: ["build", "dev"]
}).on("listening", () => {
  log.done();
  rollup({deps: true, watch: true, env: "development"});
});
