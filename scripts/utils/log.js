import chalk from "chalk";
import shell from "shelljs";

const {name, version} = JSON.parse(shell.cat("package.json"));

const frames = ["▁", "▄", "▆", "█", "█", "▆", "▅", "▁"].map(d => chalk.dim(d));
const color = [36, 114, 200];

export default function(script) {

  const Logger = {};

  if (process.env.SUBPROCESS) {
    shell.echo(`
${chalk.bold.rgb(...color)(name)} - ${chalk.rgb(...color)(script)}`);
  }
  else {
    shell.echo(`
  
      ${chalk.bold.rgb(...color)(`${name} v${version}`)}
      ${chalk.rgb(...color)(script)}
  
    `);
  }

  let interval, message = "";

  Logger.done = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.rgb(...color)("done")} ] ${message}`);
  };

  Logger.fail = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.red("fail")} ] ${message}`);
  };

  Logger.exit = msg => {
    if (interval) Logger.done(msg);
    shell.echo("\n");
  };

  Logger.timer = (msg = chalk.gray("please pass a process name to .start()")) => {

    if (interval) Logger.done();

    message = msg;

    process.stdout.write(`\r[ ${chalk.dim("····")} ] ${message}`);

    if (process.env.GITHUB_ACTIONS !== "true") {
      let tick = 0;
  
      interval = setInterval(() => {
        const arr = Array(4);
        frames.forEach((f, i) => {
          const index = (i + tick % frames.length) % frames.length;
          if (index < arr.length) arr[index] = f;
        });
        process.stdout.write(`\r[ ${chalk.rgb(...color)(arr.join(""))} ] ${message}`);
        tick++;
      }, 50);
    }
    else {
      interval = true;
    }

  };

  Logger.update = msg => {
    if (msg) message = msg;
    process.stdout.write(`\r[ ${chalk.gray("····")} ] ${message}`);
  };

  Logger.warn = msg => {
    if (msg) message = msg;
    interval = clearInterval(interval);
    shell.echo(`\r[ ${chalk.yellow("warn")} ] ${message}`);
  };

  return Logger;

}
