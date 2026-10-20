/* global describe */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {scopedDoc} from "../stubs/args.js";
import {
  injectChartConfig,
  parseChartDef,
  publicChartDefs,
  splitDoc,
} from "../stubs/chartDefs.js";
import {tocSummary, typeToNames, typeToString} from "../typedoc.js";

const union = (...types) => ({type: "union", types});
const str = {type: "intrinsic", name: "string"};
const num = {type: "intrinsic", name: "number"};
const pair = {type: "tuple", elements: [union(str, num), union(str, num)]};

describe("typeToString tuples", () => {
  it("renders a tuple's elements, joining their unions without spaces", () => {
    assert.equal(typeToString(pair), "[string|number, string|number]");
  });
  it("renders arrays of tuples", () => {
    assert.equal(
      typeToString({type: "array", elementType: pair}),
      "Array.&lt;[string|number, string|number]&gt;",
    );
  });
  it("renders named, optional, and rest members", () => {
    const tuple = {
      type: "tuple",
      elements: [
        {type: "namedTupleMember", name: "x", isOptional: false, element: num},
        {type: "namedTupleMember", name: "y", isOptional: true, element: num},
        {type: "optional", elementType: str},
        {type: "rest", elementType: {type: "array", elementType: str}},
      ],
    };
    assert.equal(typeToString(tuple), "[number, number?, string?, ...Array.&lt;string&gt;]");
  });
  it("keeps the top-level union split for typeToNames", () => {
    const fillBetween = union(
      {type: "intrinsic", name: "boolean"},
      pair,
      {type: "array", elementType: pair},
    );
    assert.deepEqual(typeToNames(fillBetween), [
      "boolean",
      "[string|number, string|number]",
      "Array.&lt;[string|number, string|number]&gt;",
    ]);
  });
});

describe("tocSummary", () => {
  it("takes the first sentence and joins wrapped lines", () => {
    assert.equal(
      tocSummary("Creates a bar chart based on an array of data. When stacked, each bar's\nfraction is shown."),
      "Creates a bar chart based on an array of data.",
    );
    assert.equal(
      tocSummary("Draws a hierarchy as concentric rings, one per level, where each\nnode's arc is its value. More."),
      "Draws a hierarchy as concentric rings, one per level, where each node's arc is its value.",
    );
  });
  it("doesn't end a sentence at e.g. or a decimal", () => {
    assert.equal(
      tocSummary("Pads bars, e.g. by 0.5 px. Then more."),
      "Pads bars, e.g. by 0.5 px.",
    );
  });
  it("keeps a period-less first paragraph whole and escapes pipes", () => {
    assert.equal(tocSummary("A `a | b` union\nof things\n\nSecond."), "A `a \\| b` union of things");
    assert.equal(tocSummary(undefined), "");
  });
});

describe("splitDoc", () => {
  it("pulls out @default and @type tags", () => {
    assert.deepEqual(splitDoc("Hides the legend. @default polarLegend @type {boolean}"), {
      description: "Hides the legend.",
      type: "boolean",
      defaultTag: "polarLegend",
    });
    assert.deepEqual(splitDoc("Each bar's width. @default the bar's total"), {
      description: "Each bar's width.",
      type: null,
      defaultTag: "the bar's total",
    });
    assert.equal(splitDoc("No tags.").defaultTag, null);
  });
});

describe("scopedDoc", () => {
  const stories = [
    {name: "Viz"},
    {name: "Plot", augments: ["Viz"]},
    {name: "LinePlot", augments: ["Plot"]},
    {name: "FanChart", augments: ["LinePlot"]},
    {name: "BarChart", augments: ["Plot"]},
    {name: "Marimekko", augments: ["BarChart"]},
    {name: "Bullet", augments: ["Viz"]},
    {name: "Timeline"},
    {name: "ParallelCoordinates", augments: ["Viz"]},
  ];
  const forecast = {
    names: ["string"],
    description: "Marks a forecast.\nMore on lines.\n\nBullet: each row's forecast bar.",
  };
  it("keeps the general paragraphs for a chart no paragraph names", () => {
    assert.equal(scopedDoc(forecast, "FanChart", stories).description, "Marks a forecast.\nMore on lines.");
    assert.equal(scopedDoc(forecast, "Plot", stories).description, "Marks a forecast.\nMore on lines.");
  });
  it("keeps only the paragraphs scoped to the chart when there are some", () => {
    assert.equal(scopedDoc(forecast, "Bullet", stories).description, "Bullet: each row's forecast bar.");
  });
  it("matches scopes naming several charts or an ancestor", () => {
    const doc = {description: "BarChart/Marimekko with `barWidth`: shows shares."};
    assert.equal(scopedDoc(doc, "Marimekko", stories).description, doc.description);
    assert.equal(scopedDoc({description: "BarChart and Bullet: x."}, "Marimekko", stories).description, "BarChart and Bullet: x.");
  });
  it("drops a doc scoped only to other classes", () => {
    assert.equal(scopedDoc({description: "ParallelCoordinates: brushes."}, "Timeline", stories), undefined);
  });
  it("treats a colon after unknown words as general text", () => {
    const doc = {description: "Styles: fill and stroke."};
    assert.equal(scopedDoc(doc, "Plot", stories).description, doc.description);
  });
});

describe("parseChartDef", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "d3plus-chartdef-"));
  const file = path.join(dir, "index.ts");
  fs.writeFileSync(
    file,
    `
import Base from "../Base/index.js";
const def = {
  name: "Demo",
  defaults: {groupPadding: 1, hoverOutline: true},
  setup: viz => {
    viz._stackOffset = resolveStackOffset("expand");
    viz._stackOrder = customOrder(viz);
    viz.padding(4);
    viz._internal = "x";
  },
  fields: [
    /**
        Legend doc.
        @default polarLegend
    */
    {key: "legend", factory: viz => polarLegend(viz, () => true)},
    {key: "padding", default: 2},
  ],
};
export default makeChart(def, Base);
`,
  );
  const parsed = parseChartDef(file);
  const byKey = Object.fromEntries(parsed.fields.map(f => [f.key, f]));
  fs.rmSync(dir, {recursive: true, force: true});

  it("reads the base class and declared fields with their tags", () => {
    assert.equal(parsed.base, "Base");
    assert.equal(byKey.legend.defaultTag, "polarLegend");
    assert.equal(byKey.legend.description, "Legend doc.");
  });
  it("adds the keys def.defaults sets, with their literal values", () => {
    assert.equal(byKey.groupPadding.value, 1);
    assert.equal(byKey.groupPadding.default, "1");
    assert.equal(byKey.groupPadding.inherited, true);
    assert.equal(byKey.hoverOutline.value, true);
  });
  it("adds setup's setter calls and resolver assignments, not other private state", () => {
    assert.equal(byKey.stackOffset.value, "expand");
    assert.equal(byKey.stackOffset.default, '"expand"');
    assert.equal(byKey.stackOrder, undefined);
    assert.equal(byKey._internal, undefined);
    assert.equal(byKey.internal, undefined);
  });
  it("lets a declared field win over a setup default", () => {
    assert.equal(byKey.padding.default, "2");
    assert.equal(byKey.padding.inherited, undefined);
  });
});

describe("publicChartDefs", () => {
  class Demo {
    groupPadding() {}
  }
  const defs = {
    Demo: {
      base: "Viz",
      fields: [
        {key: "own"},
        {key: "groupPadding", inherited: true},
        {key: "hoverOutline", inherited: true},
      ],
    },
    Missing: {base: "Viz", fields: [{key: "own"}, {key: "x", inherited: true}]},
  };
  it("keeps declared fields and the defaults that name an accessor", () => {
    const out = publicChartDefs(defs, {Demo});
    assert.deepEqual(out.Demo.fields.map(f => f.key), ["own", "groupPadding"]);
    assert.deepEqual(out.Missing.fields.map(f => f.key), ["own"]);
  });
});

describe("injectChartConfig", () => {
  const defs = {
    Demo: {
      base: "Plot",
      fields: [
        {key: "a", default: "1"},
        {key: "legend", default: null, defaultTag: "polarLegend"},
        {key: "b", default: null},
      ],
    },
  };
  const table =
    "Extends [`Plot`](#plot) — accepts all of its configuration. Adds or overrides these defaults:\n\n" +
    "| Method | Default |\n| --- | --- |\n| `a` | `1` |\n| `legend` | `polarLegend` |\n| `b` | — |\n";
  it("replaces a source-read chart's VizCtor line", () => {
    const readme = "### Demo\n\n> **Demo**: `VizCtor`\n\nDefined in: x\n";
    assert.equal(injectChartConfig(readme, defs), `### Demo\n\n${table}\n\nDefined in: x\n`);
  });
  it("replaces a declaration-read chart's constructor line and its Returns block", () => {
    const readme =
      "### Demo\n\n> `const` **Demo**: () => `any`\n\nDefined in: x\n\nCreates a demo.\n\n#### Returns\n\n`any`\n\n***\n\n### Next\n\n#### Returns\n\n`any`\n";
    assert.equal(
      injectChartConfig(readme, defs),
      `### Demo\n\n${table}\n\nDefined in: x\n\nCreates a demo.\n\n***\n\n### Next\n\n#### Returns\n\n\`any\`\n`,
    );
  });
  it("leaves another section's Returns block alone", () => {
    const readme = "### Demo\n\n> `const` **Demo**: () => `any`\n\nText.\n\n## Interfaces\n\n#### Returns\n\n`any`\n";
    assert.equal(
      injectChartConfig(readme, defs),
      `### Demo\n\n${table}\n\nText.\n\n## Interfaces\n\n#### Returns\n\n\`any\`\n`,
    );
  });
});
