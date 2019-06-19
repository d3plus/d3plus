#! /usr/bin/env node
const shell = require("shelljs");

/** Shared function to kill the process on error */
function kill(code, stdout) {
  shell.echo(stdout);
  shell.exit(code);
}

if (shell.test("-d", "../../d3plus/d3plus-workshop")) {
  shell.echo("uploading builds to d3plus-workshop");
  shell.cp("build/d3plus.full.min.js", "../../d3plus/d3plus-workshop/d3plus.v2.js");
  shell.cd("../../d3plus/d3plus-workshop");
  shell.exec("git add d3plus.v2.js", (code, stdout) => {
    if (code) kill(code, stdout);

    shell.exec("git commit -m \"updates d3plus\"", (code, stdout) => {
      if (code) kill(code, stdout);

      shell.exec("git pull && git push", (code, stdout) => {
        if (code) kill(code, stdout);

        shell.cd("-");
        shell.exit(0);

      });

    });

  });
}
else {
  shell.echo("d3plus-workshop repository folder not found in parent directory, builds cannot be uploaded to d3plus.org");
  shell.exit(0);
}
