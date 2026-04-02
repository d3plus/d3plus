import fs from "node:fs";
import yoctoSpinner from "yocto-spinner";

const {name, version} = JSON.parse(fs.readFileSync("package.json", "utf8"));

const rgb = (r, g, b, text) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
const bold = text => `\x1b[1m${text}\x1b[22m`;

export default function (script) {
  const header = process.env.SUBPROCESS
    ? `${bold(rgb(36, 114, 200, name))} - ${rgb(36, 114, 200, script)}`
    : `${bold(rgb(36, 114, 200, `${name} v${version}`))}\n      ${rgb(36, 114, 200, script)}`;

  yoctoSpinner().info(header);

  let spinner = null;

  const Logger = {};

  Logger.done = msg => {
    if (spinner) {
      spinner.success(msg || spinner.text);
      spinner = null;
    }
  };

  Logger.fail = msg => {
    if (spinner) {
      spinner.error(msg || spinner.text);
      spinner = null;
    }
  };

  Logger.exit = msg => {
    if (spinner) Logger.done(msg);
    console.log();
  };

  Logger.timer = msg => {
    if (spinner) Logger.done();
    spinner = yoctoSpinner({
      text: msg || "please pass a process name to .start()",
      color: "cyan",
    }).start();
  };

  Logger.update = msg => {
    if (spinner) {
      spinner.text = msg;
    } else {
      spinner = yoctoSpinner({text: msg, color: "cyan"}).start();
    }
  };

  Logger.warn = msg => {
    if (spinner) {
      spinner.warning(msg || spinner.text);
      spinner = null;
    }
  };

  return Logger;
}
