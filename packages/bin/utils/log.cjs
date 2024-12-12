const chalk = require("chalk"),
      logo = require("./logo.cjs"),
      shell = require("shelljs");

module.exports = function(name) {

  if (!process.env.D3PLUS_SCRIPT_LOGO) logo(name);
  process.env.D3PLUS_SCRIPT_LOGO = true;

  const frames = ["▁", "▄", "▆", "█", "█", "▆", "▅", "▁"].map(d => chalk.dim(d));
  let interval, message = "";

  this.done = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.rgb(55, 125, 71)("done")} ] ${message}`);
  };

  this.fail = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.red("fail")} ] ${message}`);
  };

  this.exit = msg => {
    if (interval) this.done(msg);
    shell.echo("\n");
  };

  this.timer = (msg = chalk.gray("please pass a process name to .start()")) => {

    if (interval) this.done();

    message = msg;

    process.stdout.write(`[ ${chalk.dim("wait")} ] ${message}`);

    let tick = 0;

    interval = setInterval(() => {
      const arr = Array(4);
      frames.forEach((f, i) => {
        const index = (i + tick % frames.length) % frames.length;
        if (index < arr.length) arr[index] = f;
      });
      process.stdout.write(`\r[ ${chalk.yellow(arr.join(""))} ] ${message}`);
      tick++;
    }, 50);

  };

  this.update = msg => {
    if (msg) message = msg;
    process.stdout.write(`\r[ ${chalk.gray("wait")} ] ${message}`);
  };

  this.warn = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.yellow("warn")} ] ${message}`);
  };

  return this;

};
