import * as color from "@d3plus/color";
import * as data from "@d3plus/data";
import * as format from "@d3plus/format";

const PACKAGES = {format, color, data};

/** Every helper function playground code can call, mapped to its package. */
export const HELPERS: Record<string, string> = {};
const scope: Record<string, unknown> = {};
for (const [pkg, mod] of Object.entries(PACKAGES))
  for (const [name, value] of Object.entries(mod))
    if (typeof value === "function" && !(name in scope)) {
      scope[name] = value;
      HELPERS[name] = pkg;
    }

export type Evaluated =
  | {config: Record<string, unknown>; error?: undefined}
  | {config?: undefined; error: string};

/**
 * Runs playground code with the d3plus helpers in scope and returns the
 * `config` it declares. The code runs in a block of its own, so it may
 * declare names that shadow a helper.
 */
export function evaluate(code: string): Evaluated {
  const names = Object.keys(scope);
  try {
    const run = new Function(
      ...names,
      `{\n${code}\n;return typeof config === "undefined" ? undefined : config;\n}`,
    );
    const config = run(...names.map(n => scope[n]));
    if (!config || typeof config !== "object" || Array.isArray(config))
      return {error: "The code must declare `const config = {…}`."};
    return {config};
  } catch (e) {
    return {error: e instanceof Error ? e.message : String(e)};
  }
}
