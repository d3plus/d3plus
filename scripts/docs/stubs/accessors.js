/**
    Documents the config accessors `installFluent` generates at runtime, which
    TypeDoc can't see as class members, in each class's API.md section.
*/

import {configArgType, scopedDoc} from "./args.js";

const hasParent = ({augments}) => (augments && augments.length ? augments[0] : false);

/** A short rendering of an accessor's default value for a table cell. */
function renderDefault(value) {
  if (value === undefined) return "—";
  if (typeof value === "function") return "`function`";
  if (Array.isArray(value)) {
    const text = JSON.stringify(value);
    return text && text.length <= 40 ? `\`${text}\`` : "`[…]`";
  }
  if (value && typeof value === "object") return "`{…}`";
  return `\`${JSON.stringify(value)}\``;
}

const cell = text =>
  text.replace(/\|/g, "\\|").replace(/\s*\n\s*\n\s*/g, "<br><br>").replace(/\n/g, " ");

/** The `[start, end)` of a class's `### Name` section in `readme`, or null. */
function sectionRange(readme, name) {
  const start = readme.search(new RegExp(`\\n### ${name}\\n`));
  if (start < 0) return null;
  const next = readme.slice(start + 4).search(/\n#{2,3} /);
  return [start, next < 0 ? readme.length : start + 4 + next];
}

/**
    Adds a "Config accessors" table to each class section of `readme` (before
    its "Methods" heading) for the accessors it adds to the class it extends,
    with each key's type and description from the config interfaces and its
    runtime default. Keys TypeDoc already documents as methods are left out, as
    are charts, whose fields `injectChartConfig` documents.
    @param readme The generated API markdown.
    @param context `{stories, configDefaults, interfaceDocs}`, as the args
    generator uses them.
*/
export function injectConfigAccessors(readme, {stories, configDefaults, interfaceDocs}) {
  const classes = stories.filter(s => s.kind === "class" && !s.chartDef);
  const byName = name => stories.find(d => d.name === name);

  // Each class's table keys: its accessors that its parent lacks, minus the
  // methods its section already documents.
  const tableKeys = {};
  for (const story of classes) {
    const own = configDefaults[story.name];
    const range = own && sectionRange(readme, story.name);
    if (!range) continue;
    const documented = new Set(
      [...readme.slice(...range).matchAll(/\n##### (\w+)\(\)/g)].map(m => m[1]),
    );
    const inherited = configDefaults[hasParent(story)] || {};
    tableKeys[story.name] = Object.keys(own)
      .filter(key => !key.startsWith("_") && !(key in inherited) && !documented.has(key))
      .sort((a, b) => a.localeCompare(b));
  }

  const specificDocs = name => interfaceDocs.byName?.[`${name}Config`] || {};
  for (const story of classes) {
    const keys = tableKeys[story.name];
    if (!keys) continue;
    let ancestor = byName(hasParent(story));
    while (ancestor && !tableKeys[ancestor.name]?.length) ancestor = byName(hasParent(ancestor));
    if (!keys.length && !ancestor) continue;

    let md = "#### Config accessors\n\n";
    md += "Each is a getter/setter: `.key(value)` sets it and returns the instance, `.key()` returns it.";
    if (ancestor)
      md += ` Also accepts the config accessors of [\`${ancestor.name}\`](#${ancestor.name.toLowerCase()}).`;
    md += "\n\n";
    if (keys.length) {
      md += "| Accessor | Type | Default | Description |\n| --- | --- | --- | --- |\n";
      for (const key of keys) {
        const value = configDefaults[story.name][key];
        const doc = scopedDoc(
          specificDocs(story.name)[key] || interfaceDocs.merged?.[key],
          story.name,
          stories,
        );
        const arg = configArgType(value, doc, key);
        const type = arg.type.summary ? `\`${cell(arg.type.summary)}\`` : "—";
        md += `| \`${key}\` | ${type} | ${renderDefault(value)} | ${cell(arg.description || "")} |\n`;
      }
      md += "\n";
    }

    const [start, end] = sectionRange(readme, story.name);
    const section = readme.slice(start, end);
    const methods = section.indexOf("\n#### Methods\n");
    const at = methods < 0 ? section.length : methods + 1;
    readme = readme.slice(0, start) + section.slice(0, at) + md + section.slice(at) + readme.slice(end);
  }
  return readme;
}
