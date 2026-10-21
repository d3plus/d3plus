import path from "node:path";

const source = /^(.*\/packages\/[^/]+)\/(src\/.*|index|internal)\.(tsx?)$/;

/**
 * A Vite plugin that runs tests against each package's built `es/` output
 * instead of its source: every import that resolves to a package's
 * `index.ts`, `internal.ts` or `src/` file loads the file built from it.
 * `@d3plus/*` imports resolve through the packages' exports, which also
 * point at `es/`.
 */
export function builtOutput() {
  return {
    name: "d3plus-built-output",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (id.startsWith("\0")) return null;
      const resolved = await this.resolve(id, importer, {...options, skipSelf: true});
      const match = resolved && resolved.id.match(source);
      if (!match) return null;
      return path.join(match[1], "es", `${match[2]}.${match[3] === "tsx" ? "jsx" : "js"}`);
    },
  };
}
