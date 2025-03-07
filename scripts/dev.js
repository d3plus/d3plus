/**
    @module d3plus-dev
    @summary Spins up the development environment.
    @desc Initializes the development server, which will open a connection on `localhost:4000` and continuously watch the `./src` directory for file changes. When a change is detected, it will rebundle the full javascript build and refresh any open web browsers.
**/

import liveServer from "live-server";
import rollup from "./utils/rollup.js";
import Logger from "./utils/log.js";
const log = Logger("development environment");
const port = 4000;

log.timer(`starting live-server on port ${port}`);

liveServer
  .start({
    logLevel: 0,
    root: "dev",
    port,
    watch: ["build", "dev"]
  })
  .on("listening", () => {
    log.done();
    rollup({deps: true, watch: true, env: "development", log});
  });
