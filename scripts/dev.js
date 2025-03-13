import {join} from "node:path";
import chokidar from "chokidar";
import liveServer from "live-server";
import shell from "shelljs";
import rollup from "./utils/rollup.js";
import Logger from "./utils/log.js";
const log = Logger("development environment");
const port = 4000;

const name = JSON.parse(shell.cat("package.json")).name.split("/")[1];

chokidar.watch(join(process.env.INIT_CWD, "packages"), {
    ignored: (path, stats) => (stats?.isFile() && !path.match(/packages\/[a-z]+\/src\//) && !path.match(/packages\/[a-z]+\/index.js/)), // only watch js files
  })
  .on("all", (event, path) => {
    if (event === "change") {
      const folder = path.match(/packages\/([a-z]+)\//)[1];
      if (folder !== name) {
        const filename = path.split("d3plus/packages/")[1];
        log.update(`change detected in ${filename}`);

        const shellOpts = {
          async: false, 
          env: {...process.env, FORCE_COLOR: true, SUBPROCESS: true},
          shell: true, 
          stdio: "inherit"
        };
        
        const {stdout} = shell.exec(`npm run build:esm -w @d3plus/${folder}`, shellOpts);
        log.done();
        console.log(stdout);
        log.timer("watching for changes...");
      }
    }

  })

if (name === "react") {
  log.timer(`running Vite on port ${port}`);
  const shellOpts = {async: true, stdio: "inherit"};
  shell.exec(`vite serve dev --port=${port}`, shellOpts);
  log.done();
  log.timer("watching for changes...");
}
else {
  log.timer(`running live-server on port ${port}`);
  liveServer
    .start({
      logLevel: 0,
      root: "dev",
      port,
      watch: ["umd", "dev"]
    })
    .on("listening", () => {
      log.done();
      rollup({deps: true, watch: true, env: "development", log});
    });
}
