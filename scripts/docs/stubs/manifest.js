import fs from "node:fs";
import path from "node:path";

/**
 * The wrapper packages whose components are listed one per class, keyed by
 * the flavor name the site's code panel uses. Svelte's action and Angular's
 * component take any class, so they aren't listed.
 */
const LISTED_WRAPPERS = {
  react: "packages/react/index.tsx",
  vue: "packages/vue/index.ts",
  element: "packages/element/index.ts",
};

/**
 * The names a wrapper's entry imports from `@d3plus/core`, one per class it
 * wraps (`Treemap as TreemapClass` reads as `Treemap`).
 */
export function wrappedClasses(source) {
  const block = source.match(/import\s*{([^}]+)}\s*from\s*"@d3plus\/core"/);
  if (!block) return new Set();
  return new Set(
    block[1]
      .split(",")
      .map(d => d.trim().split(/\s+as\s+/)[0])
      .filter(d => d && !d.startsWith("type ")),
  );
}

/** Reads every listed wrapper's classes from its entry point under `root`. */
export function readWrappers(root = ".") {
  return Object.fromEntries(
    Object.entries(LISTED_WRAPPERS).map(([flavor, file]) => {
      const full = path.resolve(root, file);
      const source = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
      return [flavor, wrappedClasses(source)];
    }),
  );
}

/**
 * The code-panel flavors a documented export can be shown in: plain
 * JavaScript always, and for a class every wrapper that renders it.
 */
export function flavorsFor(entry, wrappers) {
  if (entry.kind !== "class") return ["javascript"];
  const listed = flavor => wrappers[flavor] && wrappers[flavor].has(entry.name);
  return [
    "javascript",
    ...["react", "vue"].filter(listed),
    "svelte",
    ...["element"].filter(listed),
    "angular",
  ];
}

const isObject = v => v && typeof v === "object" && !Array.isArray(v);

/** A deep merge where later objects win and arrays are replaced, like `assign`. */
export function merge(...objects) {
  const target = {};
  for (const source of objects) {
    if (!isObject(source)) continue;
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value))
        target[key] = merge(isObject(target[key]) ? target[key] : {}, value);
      else if (Array.isArray(value)) target[key] = value.slice();
      else target[key] = value;
    }
  }
  return target;
}

/**
 * Resolves a class's full argTypes by walking up its parents: each parent's
 * argTypes, minus the keys the child hides, merged under the child's own.
 * `own` maps a class name to its `buildArgTypes` result.
 */
export function flattenArgTypes(name, own, seen = new Set()) {
  const entry = own[name];
  if (!entry || seen.has(name)) return {};
  seen.add(name);
  const {argTypes, parentClass, disabledMethods = []} = entry;
  if (!parentClass) return merge(argTypes);
  const hide = disabledMethods.length
    ? new RegExp(`^(${disabledMethods.join("|")})$`)
    : null;
  const inherited = Object.fromEntries(
    Object.entries(flattenArgTypes(parentClass, own, seen)).filter(
      ([key]) => !hide || !hide.test(key),
    ),
  );
  return merge(inherited, argTypes);
}

/** One config key as the site documents it, read from its generated argType. */
export function configField(arg) {
  const field = {
    type: (arg.type && arg.type.summary) || "",
    description: arg.description || "",
  };
  const control = arg.control && arg.control.type;
  if (control) field.control = control;
  if (arg.options) field.options = arg.options;
  const summary = arg.table && arg.table.defaultValue;
  if (summary && summary.summary !== "undefined") {
    field.default = summary.summary;
    if (summary.detail) field.defaultDetail = summary.detail;
  }
  if (arg.defaultValue !== undefined) field.defaultValue = arg.defaultValue;
  return field;
}

/** A class's ancestors, nearest first, from the `buildArgTypes` results. */
export function lineage(name, own) {
  const out = [];
  for (let p = own[name] && own[name].parentClass; p;) {
    if (out.includes(p)) break;
    out.push(p);
    p = own[p] && own[p].parentClass;
  }
  return out;
}

/**
 * The manifest entry for one documented export. `category` is the first
 * folder under the package's `src/` (`charts`, `shapes`, …), empty for an
 * export at its root.
 */
export function manifestEntry(
  story,
  {pkg, category, argTypes = {}, ancestors = [], wrappers},
) {
  const entry = {
    name: story.name,
    package: pkg,
    category,
    kind: story.kind,
    description: story.description || "",
  };
  if (story.kind === "class") {
    entry.extends = ancestors;
    entry.config = Object.fromEntries(
      Object.keys(argTypes)
        .sort()
        .map(key => [key, configField(argTypes[key])]),
    );
  } else {
    entry.params = (story.params || []).map(p => ({
      name: p.name,
      type: p.type.names.join(" | "),
      optional: Boolean(p.optional),
      ...(p.defaultvalue !== undefined ? {default: p.defaultvalue} : {}),
      description: p.description || "",
    }));
  }
  entry.flavors = flavorsFor(entry, wrappers);
  return entry;
}
