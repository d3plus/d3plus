import {it} from "vitest";
import assert from "assert";
import {applyIcicleLayout} from "../../src/charts/Icicle/applyLayout.ts";
import {
  icicleInteraction,
  icicleNodeOf,
  icicleZoomOrigin,
} from "../../src/charts/Icicle/interaction.ts";
import {
  partitionClickable,
  partitionDefaultTbody,
  partitionDrillable,
  partitionHandlers,
  partitionHoverRows,
  partitionNodeOf,
  partitionParentShareRow,
  partitionZoomIn,
  partitionZoomOut,
} from "../../src/charts/partition/interaction.ts";

const key = k => d => d[k];
const rows = () => [
  {area: "A", module: "m1", file: "f1", value: 30},
  {area: "A", module: "m1", file: "f2", value: 10},
  {area: "A", module: "m2", file: "f3", value: 20},
  {area: "B", module: "m3", file: "f4", value: 40},
];

/** A viz stand-in recording hover, config, and render calls. */
function mockViz(extra = {}) {
  const log = {hover: [], config: [], renders: 0, cursor: [], tooltip: []};
  const tooltip = {
    data: () => tooltip,
    render: () => (log.tooltip.push("render"), tooltip),
    title: t => (log.tooltip.push(["title", t()]), tooltip),
    footer: f => (log.tooltip.push(["footer", f]), tooltip),
    tbody: b => (log.tooltip.push(["tbody", b]), tooltip),
    schema: {titleSwatch: false},
  };
  const viz = {
    log,
    schema: {
      width: 400,
      height: 300,
      groupBy: [key("area"), key("module"), key("file")],
      shapeConfig: {},
      sum: d => d.value,
      on: {
        mouseenter: () => log.hover.push("base"),
        "mousemove.shape": () => undefined,
      },
      tooltip: () => true,
      tooltipConfig: {},
      translate: s => s,
      locale: "en-US",
    },
    _margin: {top: 0, bottom: 0, left: 0, right: 0},
    _filteredData: rows(),
    _drawDepth: 2,
    _history: [],
    ctx: {},
    _tooltipClass: tooltip,
    _select: {style: (_k, v) => log.cursor.push(v)},
    _drawLabel: (d, i, depth) => `label@${depth}`,
    hover(fn) {
      log.hover.push(fn);
      return viz;
    },
    config(c) {
      log.config.push(c);
      Object.assign(viz.schema, c);
      return {render: () => log.renders++};
    },
    ...extra,
  };
  applyIcicleLayout({viz});
  return viz;
}

const nodeAt = (viz, path) =>
  viz.ctx.icicleLaid.find(n => n.id === JSON.stringify(path));

it("Icicle interaction: icicleZoomOrigin records a node's breadth extent and depth", () => {
  const viz = mockViz();
  const m1 = nodeAt(viz, ["A", "m1"]);
  assert.deepStrictEqual(icicleZoomOrigin(m1), {x0: m1.x0, x1: m1.x1, depth: 2});
  assert.strictEqual(icicleInteraction.prefix, "icicle");
  assert.strictEqual(icicleInteraction.origin, icicleZoomOrigin);
});

it("Icicle interaction: icicleNodeOf and partitionNodeOf resolve a row, or a label wrapping one", () => {
  const viz = mockViz();
  const m1 = nodeAt(viz, ["A", "m1"]);
  assert.strictEqual(icicleNodeOf(viz, m1.datum), m1);
  assert.strictEqual(icicleNodeOf(viz, {__d3plus__: true, data: m1.datum}), m1);
  assert.strictEqual(icicleNodeOf(viz, {other: true}), undefined);
  assert.strictEqual(partitionNodeOf(viz, m1.datum, "icicle"), m1);
  assert.strictEqual(partitionNodeOf(viz, m1.datum, "sunburst"), undefined);
});

it("Icicle interaction: partitionDrillable and partitionClickable", () => {
  const viz = mockViz();
  assert.strictEqual(partitionDrillable(viz, nodeAt(viz, ["A"])), true);
  assert.strictEqual(partitionDrillable(viz, nodeAt(viz, ["A", "m1", "f1"])), false);
  const bucket = {...nodeAt(viz, ["A"]), datum: {_isAggregation: true}};
  assert.strictEqual(partitionDrillable(viz, bucket), false);
  const shallow = mockViz({_drawDepth: 1});
  assert.strictEqual(partitionDrillable(shallow, nodeAt(shallow, ["A", "m1"])), true);
  const root = {...nodeAt(viz, ["A"]), depth: 0};
  assert.strictEqual(partitionClickable(viz, root), false);
  viz._history.push({});
  assert.strictEqual(partitionClickable(viz, root), true);
});

it("Icicle interaction: partitionHoverRows keeps the node and its ancestors", () => {
  const viz = mockViz();
  const f1 = nodeAt(viz, ["A", "m1", "f1"]);
  assert.deepStrictEqual(
    [...partitionHoverRows(f1)],
    [f1.datum, nodeAt(viz, ["A", "m1"]).datum, nodeAt(viz, ["A"]).datum],
  );
});

it("Icicle interaction: partitionParentShareRow and partitionDefaultTbody", () => {
  const viz = mockViz();
  assert.strictEqual(partitionParentShareRow(viz, nodeAt(viz, ["A"])), undefined);
  assert.deepStrictEqual(partitionParentShareRow(viz, nodeAt(viz, ["A", "m1"])), [
    "Share of Parent",
    "66.7%",
  ]);
  const share = ["Share", () => ""];
  assert.strictEqual(partitionDefaultTbody([[...share]], share), true);
  assert.strictEqual(partitionDefaultTbody([[...share], ["x", "y"]], share), false);
  assert.strictEqual(partitionDefaultTbody([["Share", () => ""]], share), false);
  assert.strictEqual(partitionDefaultTbody(undefined, share), false);
});

it("Icicle interaction: partitionZoomIn records the chart's own origin under its prefix; partitionZoomOut restores", () => {
  const viz = mockViz();
  const m1 = nodeAt(viz, ["A", "m1"]);
  partitionZoomIn(viz, m1, icicleInteraction);
  assert.deepStrictEqual(viz.ctx.icicleZoomOrigin, {x0: m1.x0, x1: m1.x1, depth: 2});
  assert.strictEqual(viz.ctx.sunburstZoomOrigin, undefined);
  assert.deepStrictEqual(
    {groupId: viz._history[0].groupId, groupDepth: viz._history[0].groupDepth},
    {groupId: "m1", groupDepth: 1},
  );
  assert.deepStrictEqual(
    rows().filter(viz.log.config[0].filter).map(d => d.file),
    ["f1", "f2"],
  );
  assert.strictEqual(viz.log.hover[0], false, "hover cleared first");
  partitionZoomOut(viz);
  assert.deepStrictEqual(viz.log.config[1], {depth: undefined, filter: undefined});
  assert.strictEqual(viz._history.length, 0);
  partitionZoomOut(viz);
  assert.strictEqual(viz.log.config.length, 2, "nothing to pop");
});

it("Icicle interaction: partitionZoomIn slides a user-limited depth outward", () => {
  const viz = mockViz({_drawDepth: 1});
  viz.schema.depth = 1;
  partitionZoomIn(viz, nodeAt(viz, ["A"]), icicleInteraction);
  assert.strictEqual(viz.log.config[0].depth, 2);
});

it("Icicle interaction: partitionHandlers hover, tooltip, and click through the icicle prefix", () => {
  const viz = mockViz();
  const share = ["Share", () => ""];
  viz.schema.tooltipConfig.tbody = [[...share]];
  const handlers = partitionHandlers(viz, share, icicleInteraction);
  const m1 = nodeAt(viz, ["A", "m1"]);
  handlers.mouseenter(m1.datum, 0);
  assert.strictEqual(viz.ctx.icicleHovered, m1);
  assert.strictEqual(viz.log.hover[0](nodeAt(viz, ["A"]).datum), true);
  assert.strictEqual(viz.log.hover[0](nodeAt(viz, ["B"]).datum), false);
  handlers.mouseenter({legend: true}, 0);
  assert.strictEqual(viz.log.hover[1], "base");

  handlers["mousemove.shape"](m1.datum, 0, undefined, {});
  assert.deepStrictEqual(viz.log.tooltip.slice(0, 3), [
    ["title", "label@1"],
    ["footer", "Click to Expand"],
    ["tbody", [[...share], ["Share of Parent", "66.7%"]]],
  ]);
  assert.deepStrictEqual(viz.log.cursor, ["pointer"]);

  handlers["click.shape"](nodeAt(viz, ["A"]).datum, 0, undefined, {});
  assert.strictEqual(viz._history.length, 1);
  viz._filteredData = viz._filteredData.filter(viz.schema.filter);
  applyIcicleLayout({viz});
  const root = viz.ctx.icicleLaid[0];
  assert.strictEqual(root.depth, 0);
  handlers["click.shape"](root.datum, 0, undefined, {});
  assert.strictEqual(viz._history.length, 0, "the root band zooms out");
});
