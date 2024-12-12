const chalk = require("chalk"),
      shell = require("shelljs");

const {name, version} = JSON.parse(shell.cat("package.json"));

module.exports = function(subtitle = "development script") {
  shell.exec("clear");

  shell.echo(chalk`

    {bold.rgb(55,125,71) ${name} v${version}}
    {rgb(55,125,71) ${subtitle}}

`);

};
