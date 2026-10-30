/** What every flavor's template is built from. */
export interface SnippetInput {
  /** The d3plus class, e.g. `Treemap`. */
  name: string;
  /** The playground's code: declarations ending in `const config = {…};`. */
  code: string;
  /** The d3plus helpers the code calls, by package: `{format: ["formatAbbreviate"]}`. */
  helpers?: Record<string, string[]>;
  /** The chart's height in pixels. */
  height?: number;
}

export const DEFAULT_HEIGHT = 400;

/** Indents every non-empty line of `code` by `spaces`. */
export function indent(code: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map(line => (line.trim() ? pad + line : line))
    .join("\n");
}

/** One `import {…} from "@d3plus/<pkg>";` line per package, sorted. */
export function helperImports(helpers: Record<string, string[]> = {}): string {
  return Object.keys(helpers)
    .sort()
    .filter(pkg => helpers[pkg].length)
    .map(
      pkg =>
        `import {${[...helpers[pkg]].sort().join(", ")}} from "@d3plus/${pkg}";`,
    )
    .join("\n");
}

/** Joins import lines, skipping empty ones. */
export function imports(...lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

/**
 * The helpers `code` uses, by package, given every helper name and the
 * package that exports it. A name counts when it appears as a whole
 * identifier (called, or passed as a value like `tickFormat:
 * formatAbbreviate`), not as a property (`d.formatAbbreviate`) or an
 * object key (`max: 10`).
 */
export function usedHelpers(
  code: string,
  available: Record<string, string>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [name, pkg] of Object.entries(available)) {
    if (!new RegExp(`(^|[^\\w$.])${name}(?![\\w$]|\\s*:)`).test(code)) continue;
    (out[pkg] = out[pkg] || []).push(name);
  }
  return out;
}

/** A PascalCase class name as a custom-element suffix: `BarChart` → `bar-chart`. */
export function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
