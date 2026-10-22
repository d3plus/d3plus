import fs from "node:fs";
import yoctoSpinner from "yocto-spinner";

const rgb = (r, g, b, text) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
const bold = text => `\x1b[1m${text}\x1b[22m`;

// Under `pnpm -r` (piped stdio) or in CI a spinner can't redraw in place, so
// each step would print a start line and an end line. Print only the result.
const interactive = Boolean(process.stderr.isTTY) && !process.env.CI;

/** Whether per-step detail (e.g. each transpiled file) should be printed. */
export const verbose = Boolean(process.env.VERBOSE);

/**
 * A static stand-in for a yocto-spinner that prints only its final state.
 * @private
 */
function quietSpinner(text) {
  const print = (symbol, msg) =>
    process.stderr.write(`${symbol} ${msg || spinner.text}\n`);
  const spinner = {
    text,
    start: () => spinner,
    success: msg => print("\x1b[32m✔\x1b[39m", msg),
    error: msg => print("\x1b[31m✖\x1b[39m", msg),
    warning: msg => print("\x1b[33m⚠\x1b[39m", msg),
    info: msg => print("\x1b[34mℹ\x1b[39m", msg),
  };
  return spinner;
}

const createSpinner = (opts = {}) =>
  interactive
    ? yoctoSpinner({color: "cyan", ...opts})
    : quietSpinner(opts.text);

export default function (script) {
  // Read at call time, not import time, so a script that bumps the version
  // (release.js) shows the new one.
  const {name, version} = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const header = process.env.SUBPROCESS
    ? `${bold(rgb(36, 114, 200, name))} - ${rgb(36, 114, 200, script)}`
    : `${bold(rgb(36, 114, 200, `${name} v${version}`))}\n      ${rgb(36, 114, 200, script)}`;

  // Piped output (pnpm -r) already prefixes every line with the package.
  if (interactive || verbose) createSpinner().info(header);

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
    } else if (msg) createSpinner().error(msg);
  };

  Logger.exit = msg => {
    if (spinner) Logger.done(msg);
    if (interactive) console.log();
  };

  Logger.timer = msg => {
    if (spinner) Logger.done();
    spinner = createSpinner({
      text: msg || "please pass a process name to .start()",
    }).start();
  };

  Logger.update = msg => {
    if (spinner) {
      spinner.text = msg;
    } else {
      spinner = createSpinner({text: msg}).start();
    }
  };

  Logger.warn = msg => {
    if (spinner) {
      const {text} = spinner;
      spinner.warning(msg || text);
      spinner = createSpinner({text}).start();
    } else createSpinner().warning(msg);
  };

  return Logger;
}
