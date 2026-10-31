import fs from "node:fs";
import path from "node:path";

/** One config key of a documented class, from the API manifest. */
export interface ConfigField {
  type: string;
  description: string;
  control?: string;
  options?: unknown[];
  default?: string;
  defaultDetail?: string;
  defaultValue?: unknown;
}

/** One parameter of a documented function. */
export interface Param {
  name: string;
  type: string;
  optional: boolean;
  default?: string;
  description: string;
}

/** One documented export, as `scripts/docs/docs.js --manifest` writes it. */
export interface ApiEntry {
  name: string;
  package: string;
  category: string;
  kind: "class" | "function" | "member";
  description: string;
  extends?: string[];
  config?: Record<string, ConfigField>;
  params?: Param[];
  flavors: string[];
}

// Resolved from the site's folder, where Astro runs: the bundled page code
// that calls this lives elsewhere at build time.
const MANIFEST = path.resolve("src/data/api.json");
let cache: ApiEntry[] | null = null;

/**
 * The API manifest. It is generated, not committed: run
 * `pnpm --filter @d3plus/site run manifest` after building the packages.
 */
export function loadApi(): ApiEntry[] {
  if (cache) return cache;
  if (!fs.existsSync(MANIFEST))
    throw new Error(
      "src/data/api.json is missing: build the packages' ESM and types, then run `pnpm --filter @d3plus/site run manifest`.",
    );
  cache = linkEntries(
    JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as ApiEntry[],
  );
  return cache;
}

/**
 * Points the descriptions' links to another export (`[formatDate](#formatDate)`,
 * written for a single API page) at that export's own page.
 */
export function linkEntries(entries: ApiEntry[]): ApiEntry[] {
  const pages = new Map(entries.map(e => [e.name, `/${entryId(e)}/`]));
  const link = (text: string) =>
    text.replace(/\]\(#([A-Za-z_$][\w$]*)\)/g, (all, name: string) =>
      pages.has(name) ? `](${pages.get(name)})` : all,
    );
  return entries.map(entry => ({
    ...entry,
    description: link(entry.description),
    ...(entry.config && {
      config: Object.fromEntries(
        Object.entries(entry.config).map(([key, field]) => [
          key,
          {...field, description: link(field.description)},
        ]),
      ),
    }),
    ...(entry.params && {
      params: entry.params.map(p => ({...p, description: link(p.description)})),
    }),
  }));
}

/** Finds a documented export by name (and package, when names repeat). */
export function findEntry(name: string, pkg?: string): ApiEntry {
  const entry = loadApi().find(
    d => d.name === name && (!pkg || d.package === pkg),
  );
  if (!entry) throw new Error(`no API manifest entry for ${pkg ?? ""} ${name}`);
  return entry;
}

/** `BarChart` → `bar-chart`, `formatAbbreviate` → `format-abbreviate`. */
export function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** The docs page id an export lives at: `core/charts/treemap`. */
export function entryId(entry: ApiEntry): string {
  return [entry.package, entry.category, kebab(entry.name)]
    .filter(Boolean)
    .join("/");
}

const PACKAGE_ORDER = [
  "core",
  "format",
  "color",
  "data",
  "dom",
  "math",
  "text",
];
const CATEGORY_LABELS: Record<string, string> = {
  charts: "Charts",
  components: "Components",
  shapes: "Shapes",
  utils: "Utilities",
};

type SidebarItem =
  | {slug: string; label: string}
  | {label: string; collapsed: boolean; items: SidebarItem[]};

/**
 * The reference half of the sidebar: a group per package (core split by
 * category), each export linking to its page.
 */
export function apiSidebar(entries: ApiEntry[]): SidebarItem[] {
  const packages = [...new Set(entries.map(d => d.package))].sort(
    (a, b) =>
      (PACKAGE_ORDER.indexOf(a) + 1 || 99) -
        (PACKAGE_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b),
  );
  const link = (d: ApiEntry) => ({slug: entryId(d), label: d.name});
  const byName = (a: ApiEntry, b: ApiEntry) => a.name.localeCompare(b.name);
  return packages.map(pkg => {
    const own = entries.filter(d => d.package === pkg).sort(byName);
    const categories = [...new Set(own.map(d => d.category))];
    const items =
      categories.length > 1
        ? categories
            .sort(
              (a, b) =>
                Object.keys(CATEGORY_LABELS).indexOf(a) -
                Object.keys(CATEGORY_LABELS).indexOf(b),
            )
            .map(category => ({
              label: CATEGORY_LABELS[category] || category || "Other",
              collapsed: category !== "charts",
              items: own.filter(d => d.category === category).map(link),
            }))
        : own.map(link);
    return {label: `@d3plus/${pkg}`, collapsed: pkg !== "core", items};
  });
}
