import {describe, it, vi} from "vitest";
import assert from "node:assert/strict";

const entries = [
  {
    name: "Viz",
    package: "core",
    category: "charts",
    kind: "class",
    description: "",
    extends: [],
    config: {},
    flavors: [],
  },
  {
    name: "BarChart",
    package: "core",
    category: "charts",
    kind: "class",
    description: "Bars.",
    extends: ["Viz", "BaseClass"],
    config: {
      stacked: {
        type: "boolean",
        description: "Stacks the *bars*.",
        control: "boolean",
        default: "false",
      },
      x: {
        type: "string | function",
        description: "",
        default: "function",
        defaultDetail: "d => d.x",
      },
    },
    flavors: ["javascript"],
  },
  {
    name: "Rect",
    package: "core",
    category: "shapes",
    kind: "class",
    description: "",
    extends: [],
    config: {},
    flavors: [],
  },
  {
    name: "formatAbbreviate",
    package: "format",
    category: "",
    kind: "function",
    description: "Formats.",
    params: [
      {name: "n", type: "number", optional: false, description: "The number."},
      {
        name: "locale",
        type: "string",
        optional: true,
        default: "en-US",
        description: "",
      },
    ],
    flavors: ["javascript"],
  },
  {
    name: "colorAssign",
    package: "color",
    category: "",
    kind: "function",
    description: "",
    params: [],
    flavors: [],
  },
  {
    name: "zeta",
    package: "zeta",
    category: "",
    kind: "function",
    description: "",
    params: [],
    flavors: [],
  },
];

vi.mock("../src/lib/api.ts", async importOriginal => ({
  ...(await importOriginal()),
  loadApi: () => entries,
}));

const {apiSidebar, entryId, kebab} = await import("../src/lib/api.ts");
const {referenceHeading, renderReference} =
  await import("../src/lib/reference.ts");

describe("api", () => {
  it("kebab-cases names", () => {
    assert.equal(kebab("BarChart"), "bar-chart");
    assert.equal(kebab("formatAbbreviate"), "format-abbreviate");
  });
  it("puts each export at package/category/name", () => {
    assert.equal(entryId(entries[1]), "core/charts/bar-chart");
    assert.equal(entryId(entries[3]), "format/format-abbreviate");
  });
  it("groups the sidebar by package, core first, split by category", () => {
    const sidebar = apiSidebar(entries);
    assert.deepEqual(
      sidebar.map(g => g.label),
      ["@d3plus/core", "@d3plus/format", "@d3plus/color", "@d3plus/zeta"],
    );
    const core = sidebar[0];
    assert.equal(core.collapsed, false);
    assert.deepEqual(
      core.items.map(g => g.label),
      ["Charts", "Shapes"],
    );
    assert.deepEqual(core.items[0].items, [
      {slug: "core/charts/bar-chart", label: "BarChart"},
      {slug: "core/charts/viz", label: "Viz"},
    ]);
    assert.equal(core.items[1].collapsed, true);
    assert.deepEqual(sidebar[1].items, [
      {slug: "format/format-abbreviate", label: "formatAbbreviate"},
    ]);
  });
});

describe("reference", () => {
  it("documents a class's import, ancestry, and config", () => {
    const html = renderReference(entries[1]);
    assert.ok(html.includes(`import {BarChart} from "@d3plus/core";`));
    assert.ok(
      html.includes(
        `Extends <a href="/core/charts/viz/"><code>Viz</code></a> → <code>BaseClass</code>.`,
      ),
    );
    assert.ok(html.includes("Filter 2 config keys"));
    assert.ok(
      html.includes(
        `<dt id="config-stacked"><a href="#config-stacked"><code>stacked</code></a>`,
      ),
    );
    assert.ok(html.includes("Stacks the <em>bars</em>."));
    assert.ok(
      html.includes(
        `<details><summary><code>function</code></summary><pre><code>d =&gt; d.x</code></pre></details>`,
      ),
    );
  });
  it("documents a function's parameters", () => {
    const html = renderReference(entries[3]);
    assert.ok(
      html.includes(
        `<dt id="param-n"><a href="#param-n"><code>n</code></a><span class="d3p-required">required</span>`,
      ),
    );
    assert.ok(html.includes(`Default <code>en-US</code>`));
    assert.ok(!html.includes("Filter"));
  });
  it("says when a function takes nothing", () => {
    assert.ok(renderReference(entries[4]).includes("Takes no parameters."));
  });
  it("names the reference's heading by kind", () => {
    assert.equal(referenceHeading(entries[1]), "Configuration");
    assert.equal(referenceHeading(entries[3]), "Parameters");
  });
});
