import {describe, it} from "vitest";
import assert from "assert";
import {applyIcicleLayout} from "../../src/charts/Icicle/applyLayout.ts";
import {
  icicleInteraction,
  icicleNodeOf,
  icicleZoomOrigin,
} from "../../src/charts/Icicle/interaction.ts";
import {applySunburstLayout} from "../../src/charts/Sunburst/applyLayout.ts";
import {
  sunburstHandlers,
  sunburstInteraction,
  sunburstNodeOf,
  sunburstZoomIn,
} from "../../src/charts/Sunburst/interaction.ts";
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

/**
    The shared partition interaction (`partition/interaction.ts`), driven
    through each chart that uses it: hover lineage, tooltip rows, and
    click-to-zoom, with each chart's interaction state kept under its prefix.
*/

const charts = [
  {
    chart: "Sunburst",
    prefix: "sunburst",
    other: "icicle",
    height: 400,
    schema: {ringSize: "equal"},
    layout: applySunburstLayout,
    nodeOf: sunburstNodeOf,
    zoomIn: sunburstZoomIn,
    handlers: sunburstHandlers,
    origin: node => ({
      startAngle: node.startAngle,
      endAngle: node.endAngle,
      depth: 2,
    }),
  },
  {
    chart: "Icicle",
    prefix: "icicle",
    other: "sunburst",
    height: 300,
    schema: {},
    layout: applyIcicleLayout,
    nodeOf: icicleNodeOf,
    zoomIn: (viz, node) => partitionZoomIn(viz, node, icicleInteraction),
    handlers: (viz, shareRow) =>
      partitionHandlers(viz, shareRow, icicleInteraction),
    origin: node => ({x0: node.x0, x1: node.x1, depth: 2}),
  },
];

const key = k => d => d[k];
const rows = () => [
  {area: "A", module: "m1", file: "f1", value: 30},
  {area: "A", module: "m1", file: "f2", value: 10},
  {area: "A", module: "m2", file: "f3", value: 20},
  {area: "B", module: "m3", file: "f4", value: 40},
];

describe.each(charts)("$chart interaction", c => {
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
        height: c.height,
        groupBy: [key("area"), key("module"), key("file")],
        shapeConfig: {},
        sum: d => d.value,
        ...c.schema,
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
      config(cfg) {
        log.config.push(cfg);
        Object.assign(viz.schema, cfg);
        return {render: () => log.renders++};
      },
      ...extra,
    };
    c.layout({viz});
    return viz;
  }

  const laid = viz => viz.ctx[`${c.prefix}Laid`];
  const nodeAt = (viz, path) =>
    laid(viz).find(n => n.id === JSON.stringify(path));

  it("nodeOf resolves a row, or a label wrapping one, under the chart's own prefix", () => {
    const viz = mockViz();
    const m1 = nodeAt(viz, ["A", "m1"]);
    assert.strictEqual(c.nodeOf(viz, m1.datum), m1);
    assert.strictEqual(c.nodeOf(viz, {__d3plus__: true, data: m1.datum}), m1);
    assert.strictEqual(c.nodeOf(viz, {other: true}), undefined);
    assert.strictEqual(c.nodeOf({ctx: {}}, m1.datum), undefined);
    assert.strictEqual(partitionNodeOf(viz, m1.datum, c.prefix), m1);
    assert.strictEqual(partitionNodeOf(viz, m1.datum, c.other), undefined);
  });

  it("partitionDrillable allows parents, and leaves with deeper levels past the drawn depth", () => {
    const viz = mockViz();
    assert.strictEqual(partitionDrillable(viz, nodeAt(viz, ["A"])), true);
    assert.strictEqual(
      partitionDrillable(viz, nodeAt(viz, ["A", "m1", "f1"])),
      false,
    );
    const shallow = mockViz({_drawDepth: 1});
    assert.strictEqual(
      partitionDrillable(shallow, nodeAt(shallow, ["A", "m1"])),
      true,
    );
    const bucket = {...nodeAt(viz, ["A"]), datum: {_isAggregation: true}};
    assert.strictEqual(partitionDrillable(viz, bucket), false);
  });

  it("partitionClickable makes the root clickable only with history to pop", () => {
    const viz = mockViz();
    const root = {...nodeAt(viz, ["A"]), depth: 0};
    assert.strictEqual(partitionClickable(viz, root), false);
    viz._history.push({});
    assert.strictEqual(partitionClickable(viz, root), true);
    assert.strictEqual(
      partitionClickable(viz, nodeAt(viz, ["A", "m1", "f1"])),
      false,
    );
  });

  it("partitionHoverRows keeps the node and its ancestors only", () => {
    const viz = mockViz();
    const f1 = nodeAt(viz, ["A", "m1", "f1"]);
    assert.deepStrictEqual(
      [...partitionHoverRows(f1)],
      [f1.datum, nodeAt(viz, ["A", "m1"]).datum, nodeAt(viz, ["A"]).datum],
    );
  });

  it("partitionParentShareRow appears only past the first level", () => {
    const viz = mockViz();
    assert.strictEqual(
      partitionParentShareRow(viz, nodeAt(viz, ["A"])),
      undefined,
    );
    assert.strictEqual(partitionParentShareRow(viz, undefined), undefined);
    assert.deepStrictEqual(
      partitionParentShareRow(viz, nodeAt(viz, ["A", "m1"])),
      ["Share of Parent", "66.7%"],
    );
  });

  it("zoomIn filters to the node's path and records the chart's own origin on the history", () => {
    const viz = mockViz();
    const m1 = nodeAt(viz, ["A", "m1"]);
    c.zoomIn(viz, m1);
    assert.strictEqual(viz._history.length, 1);
    assert.deepStrictEqual(
      {
        groupId: viz._history[0].groupId,
        groupDepth: viz._history[0].groupDepth,
      },
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
    assert.deepStrictEqual(viz.ctx[`${c.prefix}ZoomOrigin`], c.origin(m1));
    assert.strictEqual(viz.ctx[`${c.other}ZoomOrigin`], undefined);
    assert.strictEqual(viz.log.renders, 1);
    assert.strictEqual(viz.log.hover[0], false, "hover cleared first");
  });

  it("zoomIn slides a user-limited depth outward", () => {
    const viz = mockViz({_drawDepth: 1});
    viz.schema.depth = 1;
    c.zoomIn(viz, nodeAt(viz, ["A"]));
    assert.strictEqual(viz.log.config[0].depth, 2);
  });

  it("partitionZoomOut restores the recorded view", () => {
    for (const original of [undefined, d => d.value > 0]) {
      const viz = mockViz();
      viz.schema.filter = original;
      c.zoomIn(viz, nodeAt(viz, ["A"]));
      partitionZoomOut(viz);
      assert.deepStrictEqual(viz.log.config[1], {
        depth: undefined,
        filter: original,
      });
      assert.strictEqual(viz._history.length, 0);
      partitionZoomOut(viz);
      assert.strictEqual(viz.log.config.length, 2, "nothing to pop");
    }
  });

  it("handlers hover the lineage of a node and defer other marks to the base handler", () => {
    const viz = mockViz();
    const handlers = c.handlers(viz, []);
    const m1 = nodeAt(viz, ["A", "m1"]);
    handlers.mouseenter(m1.datum, 0);
    assert.strictEqual(viz.ctx[`${c.prefix}Hovered`], m1);
    const predicate = viz.log.hover[0];
    assert.strictEqual(predicate(nodeAt(viz, ["A"]).datum), true);
    assert.strictEqual(predicate(nodeAt(viz, ["A", "m1", "f1"]).datum), false);
    assert.strictEqual(predicate(nodeAt(viz, ["B"]).datum), false);
    handlers.mouseenter({legend: true}, 0);
    assert.strictEqual(viz.log.hover[1], "base");
  });

  it("handlers re-hover on mousemove when the pointer lands on a new node without a mouseenter", () => {
    const viz = mockViz();
    const handlers = c.handlers(viz, []);
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

  it("handlers skip hover dimming when hoverOpacity is 1", () => {
    const viz = mockViz();
    viz.schema.shapeConfig.hoverOpacity = 1;
    c.handlers(viz, []).mouseenter(nodeAt(viz, ["A"]).datum, 0);
    assert.strictEqual(viz.log.hover.length, 0);
  });

  it("handlers label the tooltip at the node's level with its click hint and parent share", () => {
    const viz = mockViz();
    const shareRow = ["Share", () => ""];
    // A config merge copies the arrays but keeps the cell functions.
    const tbody = [[...shareRow]];
    viz.schema.tooltipConfig.tbody = tbody;
    const handlers = c.handlers(viz, shareRow);
    handlers["mousemove.shape"](
      nodeAt(viz, ["A", "m1"]).datum,
      0,
      undefined,
      {},
    );
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

  it("handlers leave a user-configured tooltip title and footer alone", () => {
    const viz = mockViz();
    viz.schema.tooltipConfig = {title: "mine", footer: "mine", tbody: []};
    c.handlers(viz, [])["mousemove.shape"](
      nodeAt(viz, ["A"]).datum,
      0,
      undefined,
      {},
    );
    assert.deepStrictEqual(viz.log.tooltip, []);
  });

  it("handlers zoom in on a node click and out on a root click", () => {
    const viz = mockViz();
    const handlers = c.handlers(viz, []);
    let stopped = false;
    handlers["click.shape"](nodeAt(viz, ["A"]).datum, 0, undefined, {
      stopPropagation: () => (stopped = true),
    });
    assert.ok(stopped);
    assert.strictEqual(viz._history.length, 1);
    viz._filteredData = viz._filteredData.filter(viz.schema.filter);
    c.layout({viz});
    const root = laid(viz)[0];
    assert.strictEqual(root.depth, 0);
    handlers["click.shape"](root.datum, 0, undefined, {});
    assert.strictEqual(viz._history.length, 0, "the root zooms out");
    handlers["click.shape"](
      nodeAt(viz, ["A", "m1", "f1"]).datum,
      0,
      undefined,
      {},
    );
    assert.strictEqual(viz.log.renders, 2, "a leaf click does nothing");
  });
});

it("each chart's interaction records its own zoom origin under its prefix", () => {
  assert.strictEqual(sunburstInteraction.prefix, "sunburst");
  assert.strictEqual(icicleInteraction.prefix, "icicle");
  assert.strictEqual(icicleInteraction.origin, icicleZoomOrigin);
  const node = {x0: 1, x1: 2, startAngle: 3, endAngle: 4, depth: 2};
  assert.deepStrictEqual(icicleZoomOrigin(node), {x0: 1, x1: 2, depth: 2});
  assert.deepStrictEqual(sunburstInteraction.origin(node), {
    startAngle: 3,
    endAngle: 4,
    depth: 2,
  });
});

it("partitionDefaultTbody recognizes the chart's own Share row by its cells", () => {
  const cell = () => "";
  const shareRow = ["Share", cell];
  assert.strictEqual(
    partitionDefaultTbody([["Share", cell]], shareRow),
    true,
    "a copied row",
  );
  assert.strictEqual(
    partitionDefaultTbody([[...shareRow]], shareRow),
    true,
    "a spread copy",
  );
  assert.strictEqual(
    partitionDefaultTbody([["Share", () => ""]], shareRow),
    false,
    "a user's own cell",
  );
  assert.strictEqual(
    partitionDefaultTbody(
      [
        ["Share", cell],
        ["Other", cell],
      ],
      shareRow,
    ),
    false,
    "extra rows",
  );
  assert.strictEqual(
    partitionDefaultTbody([[...shareRow], ["x", "y"]], shareRow),
    false,
    "extra plain rows",
  );
  assert.strictEqual(partitionDefaultTbody([], shareRow), false);
  assert.strictEqual(partitionDefaultTbody(undefined, shareRow), false);
});
