import assert from "assert";
import {applySunburstLayout} from "../../es/src/charts/Sunburst/applyLayout.js";
import {
  sunburstClickable,
  sunburstDrillable,
  sunburstHandlers,
  sunburstHoverRows,
  sunburstNodeOf,
  sunburstParentShareRow,
  sunburstZoomIn,
  sunburstZoomOut,
} from "../../es/src/charts/Sunburst/interaction.js";

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
      height: 400,
      groupBy: [key("area"), key("module"), key("file")],
      shapeConfig: {},
      sum: d => d.value,
      ringSize: "equal",
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
  applySunburstLayout({viz});
  return viz;
}

const nodeAt = (viz, path) =>
  viz.ctx.sunburstLaid.find(n => n.id === JSON.stringify(path));

it("Sunburst interaction: sunburstNodeOf resolves a row, or a label wrapping one", () => {
  const viz = mockViz();
  const m1 = nodeAt(viz, ["A", "m1"]);
  assert.strictEqual(sunburstNodeOf(viz, m1.datum), m1);
  assert.strictEqual(
    sunburstNodeOf(viz, {__d3plus__: true, data: m1.datum}),
    m1,
  );
  assert.strictEqual(sunburstNodeOf(viz, {other: true}), undefined);
  assert.strictEqual(sunburstNodeOf({ctx: {}}, m1.datum), undefined);
});

it("Sunburst interaction: sunburstDrillable allows parents, and leaves with deeper levels past the drawn depth", () => {
  const viz = mockViz();
  assert.strictEqual(sunburstDrillable(viz, nodeAt(viz, ["A"])), true);
  assert.strictEqual(
    sunburstDrillable(viz, nodeAt(viz, ["A", "m1", "f1"])),
    false,
  );
  const shallow = mockViz({_drawDepth: 1});
  assert.strictEqual(
    sunburstDrillable(shallow, nodeAt(shallow, ["A", "m1"])),
    true,
  );
  const bucket = {...nodeAt(viz, ["A"]), datum: {_isAggregation: true}};
  assert.strictEqual(sunburstDrillable(viz, bucket), false);
});

it("Sunburst interaction: sunburstClickable makes the center clickable only with history to pop", () => {
  const viz = mockViz();
  const center = {...nodeAt(viz, ["A"]), depth: 0};
  assert.strictEqual(sunburstClickable(viz, center), false);
  viz._history.push({});
  assert.strictEqual(sunburstClickable(viz, center), true);
  assert.strictEqual(
    sunburstClickable(viz, nodeAt(viz, ["A", "m1", "f1"])),
    false,
  );
});

it("Sunburst interaction: sunburstHoverRows keeps the node and its ancestors only", () => {
  const viz = mockViz();
  const f1 = nodeAt(viz, ["A", "m1", "f1"]);
  const set = sunburstHoverRows(f1);
  assert.deepStrictEqual(
    [...set],
    [f1.datum, nodeAt(viz, ["A", "m1"]).datum, nodeAt(viz, ["A"]).datum],
  );
});

it("Sunburst interaction: sunburstParentShareRow appears only past the first ring", () => {
  const viz = mockViz();
  assert.strictEqual(
    sunburstParentShareRow(viz, nodeAt(viz, ["A"])),
    undefined,
  );
  assert.strictEqual(sunburstParentShareRow(viz, undefined), undefined);
  assert.deepStrictEqual(
    sunburstParentShareRow(viz, nodeAt(viz, ["A", "m1"])),
    ["Share of Parent", "66.7%"],
  );
});

it("Sunburst interaction: sunburstZoomIn filters to the node's path and records the view on the history", () => {
  const viz = mockViz();
  const m1 = nodeAt(viz, ["A", "m1"]);
  sunburstZoomIn(viz, m1);
  assert.strictEqual(viz._history.length, 1);
  assert.deepStrictEqual(
    {groupId: viz._history[0].groupId, groupDepth: viz._history[0].groupDepth},
    {groupId: "m1", groupDepth: 1},
  );
  const {filter} = viz.log.config[0];
  assert.deepStrictEqual(
    rows()
      .filter(filter)
      .map(d => d.file),
    ["f1", "f2"],
  );
  assert.ok(!("depth" in viz.log.config[0]), "an unset depth stays unset");
  assert.deepStrictEqual(viz.ctx.sunburstZoomOrigin, {
    startAngle: m1.startAngle,
    endAngle: m1.endAngle,
    depth: 2,
  });
  assert.strictEqual(viz.log.renders, 1);
  assert.strictEqual(viz.log.hover[0], false, "hover cleared first");
});

it("Sunburst interaction: sunburstZoomIn slides a user-limited depth outward", () => {
  const viz = mockViz({_drawDepth: 1});
  viz.schema.depth = 1;
  sunburstZoomIn(viz, nodeAt(viz, ["A"]));
  assert.strictEqual(viz.log.config[0].depth, 2);
});

it("Sunburst interaction: sunburstZoomOut restores the recorded view", () => {
  const viz = mockViz();
  const original = d => d.value > 0;
  viz.schema.filter = original;
  sunburstZoomIn(viz, nodeAt(viz, ["A"]));
  sunburstZoomOut(viz);
  assert.deepStrictEqual(viz.log.config[1], {
    depth: undefined,
    filter: original,
  });
  assert.strictEqual(viz._history.length, 0);
  sunburstZoomOut(viz);
  assert.strictEqual(viz.log.config.length, 2, "nothing to pop");
});

it("Sunburst interaction: sunburstHandlers: hovers the lineage of an arc and defers other marks to the base handler", () => {
  const viz = mockViz();
  const handlers = sunburstHandlers(viz, undefined);
  const m1 = nodeAt(viz, ["A", "m1"]);
  handlers.mouseenter(m1.datum, 0);
  const predicate = viz.log.hover[0];
  assert.strictEqual(predicate(nodeAt(viz, ["A"]).datum), true);
  assert.strictEqual(predicate(nodeAt(viz, ["A", "m1", "f1"]).datum), false);
  assert.strictEqual(predicate(nodeAt(viz, ["B"]).datum), false);
  handlers.mouseenter({legend: true}, 0);
  assert.strictEqual(viz.log.hover[1], "base");
});

it("Sunburst interaction: sunburstHandlers: mousemove re-hovers when the pointer lands on a new node without a mouseenter", () => {
  const viz = mockViz();
  const handlers = sunburstHandlers(viz, undefined);
  const a = nodeAt(viz, ["A"]);
  handlers.mouseenter(a.datum, 0);
  handlers["mousemove.shape"](a.datum, 0, undefined, {});
  assert.strictEqual(
    viz.log.hover.length,
    1,
    "the same node isn't hovered twice",
  );
  const b = nodeAt(viz, ["B"]);
  handlers["mousemove.shape"](b.datum, 0, undefined, {});
  assert.strictEqual(viz.log.hover.length, 2);
  assert.strictEqual(viz.log.hover[1](b.datum), true);
  assert.strictEqual(viz.log.hover[1](a.datum), false);
});

it("Sunburst interaction: sunburstHandlers: skips hover dimming when hoverOpacity is 1", () => {
  const viz = mockViz();
  viz.schema.shapeConfig.hoverOpacity = 1;
  sunburstHandlers(viz, undefined).mouseenter(nodeAt(viz, ["A"]).datum, 0);
  assert.strictEqual(viz.log.hover.length, 0);
});

it("Sunburst interaction: sunburstHandlers: labels the tooltip at the arc's level with its click hint and parent share", () => {
  const viz = mockViz();
  const tbody = [["Share", () => ""]];
  viz.schema.tooltipConfig.tbody = tbody;
  const handlers = sunburstHandlers(viz, tbody);
  handlers["mousemove.shape"](nodeAt(viz, ["A", "m1"]).datum, 0, undefined, {});
  assert.deepStrictEqual(viz.log.tooltip.slice(0, 3), [
    ["title", "label@1"],
    ["footer", "Click to Expand"],
    ["tbody", [...tbody, ["Share of Parent", "66.7%"]]],
  ]);
  assert.deepStrictEqual(viz.log.cursor, ["pointer"]);
  handlers["mousemove.shape"](
    nodeAt(viz, ["B", "m3", "f4"]).datum,
    0,
    undefined,
    {},
  );
  assert.ok(viz.log.tooltip.some(t => t[0] === "footer" && t[1] === false));
  assert.strictEqual(viz.log.cursor[1], "auto");
});

it("Sunburst interaction: sunburstHandlers: leaves a user-configured tooltip title and footer alone", () => {
  const viz = mockViz();
  viz.schema.tooltipConfig = {title: "mine", footer: "mine", tbody: []};
  sunburstHandlers(viz, undefined)["mousemove.shape"](
    nodeAt(viz, ["A"]).datum,
    0,
    undefined,
    {},
  );
  assert.deepStrictEqual(viz.log.tooltip, []);
});

it("Sunburst interaction: sunburstHandlers: zooms in on an arc click and out on a center click", () => {
  const viz = mockViz();
  const handlers = sunburstHandlers(viz, undefined);
  let stopped = false;
  handlers["click.shape"](nodeAt(viz, ["A"]).datum, 0, undefined, {
    stopPropagation: () => (stopped = true),
  });
  assert.ok(stopped);
  assert.strictEqual(viz._history.length, 1);
  viz._filteredData = viz._filteredData.filter(viz.schema.filter);
  applySunburstLayout({viz});
  const center = viz.ctx.sunburstLaid[0];
  assert.strictEqual(center.depth, 0);
  handlers["click.shape"](center.datum, 0, undefined, {});
  assert.strictEqual(viz._history.length, 0);
  handlers["click.shape"](
    nodeAt(viz, ["A", "m1", "f1"]).datum,
    0,
    undefined,
    {},
  );
  assert.strictEqual(viz.log.renders, 2, "a leaf click does nothing");
});
