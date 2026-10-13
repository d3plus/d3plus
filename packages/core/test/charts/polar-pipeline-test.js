import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    The polar pipeline helpers called directly against a rendered chart in
    Chromium (they measure text, so they need a real layout engine): the
    shared chrome and config helpers, the wedge layout, and PolarArea's and
    RadialBar's layout stages and emits.
*/

after(async () => {
  await closeBrowser();
});

const rows = [
  {id: "alpha", group: "x", value: 30},
  {id: "beta", group: "x", value: 10},
  {id: "alpha", group: "y", value: 20},
  {id: "beta", group: "y", value: 40},
];

it("polar pipeline: config helpers (polarAxisConfig, polarLegend, polarValueRow)", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.PolarArea()
        .select("#viz")
        .duration(0)
        .data(data)
        .metric("group");
      await new Promise(r => viz.render(r));
      const axis = d3plus.polarAxisConfig(viz);
      const legend = d3plus.polarLegend(viz);
      const [label, value] = d3plus.polarValueRow(viz);
      return {
        axisKeys: Object.keys(axis).sort(),
        gridStroke: typeof axis.gridConfig.stroke,
        labelAnchor: axis.shapeConfig.labelConfig.textAnchor({
          data: {textAnchor: "end"},
        }),
        labelAnchorDefault: axis.shapeConfig.labelConfig.textAnchor({}),
        allRows: legend({}, viz._filteredData),
        someRows: legend({}, viz._filteredData.slice(0, 2)) !== false,
        label: label(),
        value: value({value: 1234}, 0),
        missing: value({}, 0),
      };
    },
    rows,
  );
  assert.deepStrictEqual(out.axisKeys, [
    "barConfig",
    "gridConfig",
    "shapeConfig",
  ]);
  assert.strictEqual(out.gridStroke, "function");
  assert.strictEqual(out.labelAnchor, "end");
  assert.strictEqual(out.labelAnchorDefault, "middle");
  assert.strictEqual(
    out.allRows,
    false,
    "hidden when every row is its own entry",
  );
  assert.strictEqual(out.someRows, true, "shown for grouped entries");
  assert.strictEqual(out.label, "Value");
  assert.strictEqual(out.value, "1.23k");
  assert.strictEqual(out.missing, "");
});

it("polar pipeline: chrome helpers (polarCategoryLayout, polarCategoryNodes, polarLevelNodes)", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.PolarArea().select("#viz").duration(0).data(data);
      await new Promise(r => viz.render(r));
      const cats = ["North", "East", "South", "West"].map((text, i) => ({
        key: text,
        text,
        angle: (i * Math.PI) / 2,
        data: {id: text},
      }));
      const layout = d3plus.polarCategoryLayout(viz, cats, 400, 300);
      const hidden = d3plus.polarCategoryLayout(viz, cats, 400, 300, false);
      viz.outerPadding(50);
      const fixed = d3plus.polarCategoryLayout(viz, cats, 400, 300);
      viz.outerPadding("auto");
      const nodes = d3plus.polarCategoryNodes(viz, layout.labels, "test");
      const none = d3plus.polarCategoryNodes(viz, [], "test");
      const levels = {domain: [0, 100], ticks: [0, 50, 100]};
      const level = d3plus.polarLevelNodes(viz, levels, 100, v => v, "test");
      return {
        radius: layout.radius,
        anchors: layout.labels.map(l => l.textAnchor),
        aligns: layout.labels.map(l => l.verticalAlign),
        hidden: hidden,
        fixed: fixed.radius,
        nodeKey: nodes[0].key,
        nodeCount: nodes[0].children.length,
        texts: nodes[0].children.map(c => c.lines.map(l => l.text).join(" ")),
        none: none.length,
        ringRadii: level.rings[0].children.map(c => c.r),
        levelTexts: level.labels[0].children.map(c => c.lines[0].text),
        levelKeys: [level.rings[0].key, level.labels[0].key],
      };
    },
    rows,
  );
  assert.ok(
    out.radius > 0 && out.radius < 150,
    `labels leave room (${out.radius})`,
  );
  assert.deepStrictEqual(out.anchors, ["middle", "start", "middle", "end"]);
  assert.deepStrictEqual(out.aligns, ["bottom", "middle", "top", "middle"]);
  assert.deepStrictEqual(out.hidden, {radius: 150, labels: []});
  assert.strictEqual(
    out.fixed,
    100,
    "a numeric outerPadding reserves exactly that much",
  );
  assert.strictEqual(out.nodeKey, "test-labels");
  assert.strictEqual(out.nodeCount, 4);
  assert.deepStrictEqual(out.texts, ["North", "East", "South", "West"]);
  assert.strictEqual(out.none, 0);
  assert.deepStrictEqual(
    out.ringRadii,
    [50, 100],
    "inner ring, then the outer ring",
  );
  assert.deepStrictEqual(
    out.levelTexts,
    ["0", "50", "100"],
    "every ring labeled, the center's too, as on Radar",
  );
  assert.deepStrictEqual(out.levelKeys, ["test-radial-circles", "test-level-labels"]);
});

it("polar pipeline: polarWedgeLayout and polarWedgeNodes", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.PolarArea()
        .select("#viz")
        .duration(0)
        .data(data)
        .metric("group");
      await new Promise(r => viz.render(r));
      viz._chartScene = [];
      const {wedges, frame} = d3plus.polarWedgeLayout(viz, {
        key: "probe",
        slotOf: d => d.group,
        slotLabel: key => `Group ${key}`,
        scale: "linear",
        slotPadding: 0.5,
        sweep: Math.PI,
        trackPaint: {fill: "#eee"},
      });
      const pushed = viz._chartScene.map(n => n.key);
      const nodes = d3plus.polarWedgeNodes(
        viz,
        wedges,
        "probe",
        w => `${w.slot}:${w.value}`,
      );
      return {
        wedges: wedges.map(w => ({
          slot: w.slot,
          y0: w.y0,
          y1: w.y1,
          arc: w.arc,
        })),
        frame,
        levelLabels: viz._chartScene.find(n => n.key === "probe-level-labels")
          .children.length,
        pushed,
        nodes: nodes.map(n => ({
          key: n.key,
          aria: n.aria.label,
          opacity: n.paint.opacity,
        })),
      };
    },
    rows,
  );
  // Rows arrive grouped by id, so alpha stacks first in every slot.
  assert.deepStrictEqual(
    out.wedges.map(w => [w.slot, w.y0, w.y1]),
    [
      ["x", 0, 30],
      ["y", 0, 20],
      ["x", 30, 40],
      ["y", 20, 60],
    ],
  );
  assert.deepStrictEqual(
    out.frame.slots.map(s => s.key),
    ["x", "y"],
  );
  assert.ok(
    Math.abs(out.frame.slots[1].endAngle - Math.PI) < 1e-9,
    "the sweep",
  );
  assert.ok(
    Math.abs(out.wedges[0].arc.startAngle - Math.PI / 8) < 1e-9,
    "slot padding",
  );
  assert.strictEqual(out.frame.tracks.length, 2);
  assert.strictEqual(out.frame.scale, "linear");
  assert.deepStrictEqual(out.pushed, [
    "probe-tracks",
    "probe-radial-circles",
    "probe-labels",
    "probe-level-labels",
  ]);
  assert.ok(out.levelLabels > 0);
  assert.deepStrictEqual(
    out.nodes.map(n => n.aria),
    ["x:30", "y:20", "x:10", "y:40"],
  );
  assert.ok(out.nodes.every(n => n.opacity === 1));
  assert.strictEqual(out.nodes[0].key, "probe-alpha-x");
});

it("polar pipeline: PolarArea stage and emit (polarAreaSlotOf, applyPolarAreaLayout, polarAreaEmit)", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.PolarArea().select("#viz").duration(0).data(data);
      await new Promise(r => viz.render(r));
      const byId = d3plus.polarAreaSlotOf(viz)(data[0], 0);
      viz.metric("group");
      await new Promise(r => viz.render(r));
      const byMetric = d3plus.polarAreaSlotOf(viz)(data[0], 0);
      viz._chartScene = [];
      const {shapeData} = d3plus.applyPolarAreaLayout({viz});
      const emitted = d3plus.polarAreaEmit({viz, shapeData});
      const empty = d3plus.polarAreaEmit({viz, shapeData: []});
      return {
        byId,
        byMetric,
        shapes: shapeData.length,
        emitted: emitted.map(n => n.key),
        empty: empty.length,
        def: [
          d3plus.polarAreaDef.name,
          ...d3plus.polarAreaDef.fields.slice(-2).map(f => f.key),
        ],
        defKeys: Object.keys(d3plus.polarAreaDef).slice(-2),
      };
    },
    rows,
  );
  assert.strictEqual(out.byId, "alpha");
  assert.strictEqual(out.byMetric, "x");
  assert.strictEqual(out.shapes, 4);
  assert.deepStrictEqual(out.emitted.slice(0, 4), [
    "polararea-alpha-x",
    "polararea-alpha-y",
    "polararea-beta-x",
    "polararea-beta-y",
  ]);
  assert.strictEqual(out.emitted.length, 4, "wedges only: the chrome lies beneath, on _chartScene");
  assert.strictEqual(out.empty, 0);
  assert.deepStrictEqual(out.def, [
    "PolarArea",
    "tooltipConfig",
    "legendTooltip",
  ]);
  assert.deepStrictEqual(out.defKeys, ["ctx", "fields"]);
});

it("polar pipeline: RadialBar stage and emit (radialBarRows, radialBarTrackLayout, applyRadialBarLayout, radialBarEmit)", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const flat = data.filter(d => d.group === "y");
      const viz = new d3plus.RadialBar().select("#viz").duration(0).data(flat);
      await new Promise(r => viz.render(r));
      const sorted = d3plus.radialBarRows(viz).map(d => d.id);
      viz.sort(null);
      const unsorted = d3plus.radialBarRows(viz).map(d => d.id);
      viz._chartScene = [];
      const tracks = d3plus.radialBarTrackLayout(
        viz,
        d3plus.radialBarRows(viz),
      );
      viz._chartScene = [];
      const stage = d3plus.applyRadialBarLayout({viz});
      const emitted = d3plus.radialBarEmit({viz, shapeData: stage.shapeData});
      viz.discrete("angle");
      viz._chartScene = [];
      const angular = d3plus.applyRadialBarLayout({viz});
      const angularEmit = d3plus.radialBarEmit({
        viz,
        shapeData: angular.shapeData,
      });
      return {
        sorted,
        unsorted,
        wedges: tracks.wedges.map(w => w.slot),
        frame: Object.keys(tracks.frame).sort(),
        emitted: emitted.map(n => n.key),
        angular: angular.shapeData.map(w => w.arc.innerRadius > 0),
        angularEmit: angularEmit.map(n => n.key),
        angularScene: viz._chartScene.map(n => n.key),
        empty: d3plus.radialBarEmit({viz, shapeData: []}).length,
        defKeys: Object.keys(d3plus.radialBarDef).slice(-2),
      };
    },
    rows,
  );
  assert.deepStrictEqual(out.sorted, ["beta", "alpha"], "descending value");
  assert.deepStrictEqual(out.unsorted, ["alpha", "beta"], "data order");
  assert.deepStrictEqual(out.wedges, ["alpha", "beta"]);
  assert.deepStrictEqual(out.frame, [
    "cx",
    "cy",
    "domain",
    "end",
    "inner",
    "outer",
    "start",
    "ticks",
  ]);
  assert.deepStrictEqual(out.emitted, [
    "radialbar-alpha-alpha::hit",
    "radialbar-beta-beta::hit",
    "radialbar-alpha-alpha",
    "radialbar-beta-beta",
  ]);
  assert.deepStrictEqual(out.angular, [true, true]);
  assert.ok(
    out.angularEmit.every(k => !k.includes("level-labels")),
    "bars only: the ring labels lie beneath, on _chartScene",
  );
  assert.ok(out.angularScene.includes("radialbar-level-labels"));
  assert.strictEqual(out.empty, 0);
  assert.deepStrictEqual(out.defKeys, ["ctx", "fields"]);
});
