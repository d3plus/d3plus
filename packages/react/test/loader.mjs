/**
 * Node.js ESM loader hook registered via --import.
 * Treats .jsx files as ES modules (the build step compiles JSX to plain JS
 * but preserves the .jsx extension).
 */
import {register} from "node:module";
import {pathToFileURL} from "node:url";

register(
  "data:text/javascript," + encodeURIComponent(`
    export async function load(url, context, nextLoad) {
      if (url.endsWith(".jsx")) return nextLoad(url, {...context, format: "module"});
      return nextLoad(url, context);
    }
  `),
  pathToFileURL("./"),
);
