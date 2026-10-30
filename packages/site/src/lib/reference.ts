import type {ApiEntry} from "./api.js";
import {entryId, loadApi} from "./api.js";
import {markdown} from "./markdown.js";

const escape = (s: string) =>
  s.replace(
    /[&<>"]/g,
    c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]!,
  );

/** A link to another export's page when it is documented, else its name. */
function classLink(name: string): string {
  const entry = loadApi().find(d => d.name === name && d.kind === "class");
  return entry
    ? `<a href="/${entryId(entry)}/"><code>${name}</code></a>`
    : `<code>${escape(name)}</code>`;
}

/** A type: each member of a union in its own `code`. */
const typeList = (type: string) =>
  type
    .split(" | ")
    .map(t => `<code>${escape(t)}</code>`)
    .join(" | ");

/** A default value; a long one (an accessor's source) folds open. */
function defaultValue(summary?: string, detail?: string): string {
  if (!summary) return "";
  const value = detail
    ? `<details><summary><code>${escape(summary)}</code></summary><pre><code>${escape(detail)}</code></pre></details>`
    : `<code>${escape(summary)}</code>`;
  return `<span class="d3p-default">Default ${value}</span>`;
}

/**
 * One documented name: its name (linking to itself), type, default, and a
 * note, over its description. A list reads better than a table at the
 * content column's width, with descriptions that run to paragraphs.
 */
function item(
  anchor: string,
  name: string,
  {type = "", note = "", summary = "", detail = "", description = ""},
): string {
  return `<div class="d3p-item" data-name="${escape(name.toLowerCase())}">
<dt id="${escape(anchor)}"><a href="#${escape(anchor)}"><code>${escape(name)}</code></a>${note}${type ? `<span class="d3p-type">${typeList(type)}</span>` : ""}${defaultValue(summary, detail)}</dt>
<dd>${markdown(description)}</dd>
</div>`;
}

/** A class's config keys, with a filter box for its long key lists. */
function configList(entry: ApiEntry): string {
  const config = entry.config || {};
  const keys = Object.keys(config);
  const items = keys
    .map(key =>
      item(`config-${key}`, key, {
        type: config[key].type,
        summary: config[key].default,
        detail: config[key].defaultDetail,
        description: config[key].description,
      }),
    )
    .join("\n");
  return `<div class="d3p-reference">
<label class="d3p-filter">Filter ${keys.length} config keys <input type="search" placeholder="e.g. legend" data-d3p-filter /></label>
<dl>
${items}
</dl>
</div>`;
}

/** A function's parameters. */
function paramsList(entry: ApiEntry): string {
  const params = entry.params || [];
  if (!params.length) return "<p>Takes no parameters.</p>";
  const items = params
    .map(p =>
      item(`param-${p.name}`, p.name, {
        type: p.type,
        note: p.optional ? "" : `<span class="d3p-required">required</span>`,
        summary: p.default,
        description: p.description,
      }),
    )
    .join("\n");
  return `<div class="d3p-reference"><dl>
${items}
</dl></div>`;
}

/** The `import` line a reader copies to use the export. */
const importLine = (entry: ApiEntry) =>
  `<pre class="d3p-import"><code>import {${escape(entry.name)}} from "@d3plus/${escape(entry.package)}";</code></pre>`;

/**
 * The generated API reference for one export, as HTML: how to import it,
 * what it extends, and its config keys (a class) or parameters (a function).
 */
export function renderReference(entry: ApiEntry): string {
  const parts = [importLine(entry)];
  if (entry.kind === "class") {
    if (entry.extends?.length)
      parts.push(`<p>Extends ${entry.extends.map(classLink).join(" → ")}.</p>`);
    parts.push(configList(entry));
  } else if (entry.kind === "function") parts.push(paramsList(entry));
  return parts.join("\n");
}

/** The headings `renderReference` content sits under, for the page's table of contents. */
export const referenceHeading = (entry: ApiEntry) =>
  entry.kind === "class" ? "Configuration" : "Parameters";
