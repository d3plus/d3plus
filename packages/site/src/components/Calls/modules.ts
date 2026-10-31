/**
 * The modules example code may import, each loaded only when an example on
 * the page imports it. Node-only packages (`@d3plus/ssr`, `@d3plus/export`)
 * aren't here: their examples show as code without running.
 */
export const MODULES: Record<string, () => Promise<Record<string, unknown>>> = {
  "@d3plus/color": () => import("@d3plus/color"),
  "@d3plus/core": () => import("@d3plus/core"),
  "@d3plus/data": () => import("@d3plus/data"),
  "@d3plus/dom": () => import("@d3plus/dom"),
  "@d3plus/format": () => import("@d3plus/format"),
  "@d3plus/locales": () => import("@d3plus/locales"),
  "@d3plus/math": () => import("@d3plus/math"),
  "@d3plus/text": () => import("@d3plus/text"),
  "d3-selection": () => import("d3-selection"),
  "d3-time-format": () => import("d3-time-format"),
};

/** Loads the modules an example imports; rejects for one it can't load. */
export async function load(
  names: string[],
): Promise<Record<string, Record<string, unknown>>> {
  const entries = await Promise.all(
    names.map(async name => {
      const loader = MODULES[name];
      if (!loader) throw new Error(`Can't load ${name} here.`);
      return [name, await loader()] as const;
    }),
  );
  return Object.fromEntries(entries);
}
