#! /usr/bin/env node
const shell = require("shelljs"),
      {version} = JSON.parse(shell.cat("package.json"));

/** Shared function to kill the process on error */
function kill(code, stdout) {
  shell.echo(stdout);
  shell.exit(code);
}

if (shell.test("-d", "../../d3plus/d3plus-website")) {
  shell.echo("uploading builds to d3plus.org");
  shell.cp("build/d3plus.js", `../../d3plus/d3plus-website/js/d3plus.v${version}.js`);
  shell.cp("build/d3plus.full.js", `../../d3plus/d3plus-website/js/d3plus.v${version}.full.js`);
  shell.cp("build/d3plus.min.js", `../../d3plus/d3plus-website/js/d3plus.v${version}.min.js`);
  shell.cp("build/d3plus.full.min.js", `../../d3plus/d3plus-website/js/d3plus.v${version}.full.min.js`);
  shell.cp("build/d3plus.zip", "../../d3plus/d3plus-website/d3plus.zip");
  shell.cd("../../d3plus/d3plus-website");
  shell.exec(`git add d3plus.zip js/d3plus.v${version}.js js/d3plus.v${version}.min.js js/d3plus.v${version}.full.js js/d3plus.v${version}.full.min.js`, (code, stdout) => {
    if (code) kill(code, stdout);

    shell.exec(`git commit -m \"d3plus v${version}\"`, (code, stdout) => {
      if (code) kill(code, stdout);

      shell.exec("git push", (code, stdout) => {
        if (code) kill(code, stdout);

        shell.cd("-");
        shell.exit(0);

      });

    });

  });
}
else {
  shell.echo("d3plus-website repository folder not found in parent directory, builds cannot be uploaded to d3plus.org");
  shell.exit(0);
}
