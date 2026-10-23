import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {BoxWhisker} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {
  computePlotAxisValues,
  formatPlotData,
} from "../../src/charts/Plot/pipeline.ts";
import {
  boxAxisValues,
  boxTooltipRows,
  boxValueAxis,
  boxWhiskerBuffer,
  boxWhiskerEmit,
  precomputedBoxes,
} from "../../src/charts/BoxWhisker/summary.ts";

useJsdom();

/**
    BoxWhisker's precomputed boxes: with `boxMin` … `boxMax` set, each row is
    one box. These cover the hooks that place its statistics on the value
    axis, pad the axis, hand them to the Box in pixels, and list them in the
    tooltip, each a no-op on the raw-data path.
*/

const summary = [
  {
    id: "alpha",
    min: 20,
    q1: 78.5,
    median: 145,
    q3: 172.5,
    max: 300,
    out: [900],
  },
  {id: "beta", min: 30, q1: 66.25, median: 117.5, q3: 135, max: 180, out: []},
];

const precomputed = () =>
  new BoxWhisker()
    .data(summary)
    .x("id")
    .boxMin("min")
    .boxQ1("q1")
    .boxMedian("median")
    .boxQ3("q3")
    .boxMax("max")
    .boxOutliers("out");

const rows = summary.map((data, i) => ({
  __d3plus__: true,
  data,
  i,
  x: data.id,
  discrete: data.id,
}));

it("precomputedBoxes / boxValueAxis: on with any statistic; the value axis is the non-discrete one", () => {
  assert.strictEqual(precomputedBoxes(new BoxWhisker()), false);
  assert.strictEqual(precomputedBoxes(new BoxWhisker().boxMedian("m")), true);
  assert.strictEqual(
    precomputedBoxes(new BoxWhisker().boxMedian("m").boxMedian(null)),
    false,
  );
  assert.strictEqual(boxValueAxis(new BoxWhisker()), "y");
  assert.strictEqual(boxValueAxis(new BoxWhisker().discrete("y")), "x");
});

it("boxAxisValues: every statistic and outlier, on the value axis only", () => {
  const viz = precomputed();
  assert.deepStrictEqual(
    boxAxisValues(viz, rows, "y"),
    [20, 78.5, 145, 172.5, 300, 900, 30, 66.25, 117.5, 135, 180],
  );
  assert.deepStrictEqual(boxAxisValues(viz, rows, "x"), []);
  assert.deepStrictEqual(boxAxisValues(viz, rows, "y2"), []);
  assert.deepStrictEqual(boxAxisValues(new BoxWhisker(), rows, "y"), []);
});

it("computePlotAxisValues: a chart's _plotAxisValues widen the value axis, even with no y values", () => {
  const viz = precomputed();
  viz._preDraw();
  const ctx = runStages({viz}, [formatPlotData, computePlotAxisValues]);
  assert.deepStrictEqual(ctx.xData, ["alpha", "beta"]);
  assert.deepStrictEqual(
    [Math.min(...ctx.yData), Math.max(...ctx.yData)],
    [20, 900],
  );
});

it("boxWhiskerBuffer: pads the value axis past every statistic of a precomputed box", () => {
  const scales = () => ({
    x: scalePoint().domain(["alpha", "beta"]).range([0, 400]),
    y: scaleLinear().domain([900, 20]).range([0, 300]),
  });
  const viz = precomputed();
  const {x, y} = scales();
  boxWhiskerBuffer.call(viz, {data: rows, x, y});
  const [hi, lo] = y.domain();
  assert.ok(hi > 900 && lo < 20, `padded both ends: ${y.domain()}`);
  // The secondary axes hold no boxes.
  const second = scales();
  boxWhiskerBuffer.call(viz, {data: rows, ...second, x2: true, y2: true});
  assert.deepStrictEqual(second.y.domain(), [900, 20]);
});

it("boxWhiskerBuffer: the raw path pads as Box's own buffer does", () => {
  const viz = new BoxWhisker();
  const data = [{y: 50}, {y: 100}];
  const y = scaleLinear().domain([100, 50]).range([0, 300]);
  boxWhiskerBuffer.call(viz, {data, x: scalePoint().domain(["a"]), y});
  const [hi, lo] = y.domain();
  assert.ok(hi > 100 && lo < 50, `padded: ${y.domain()}`);
});

/** A minimal paint context for one Box group. */
function emitContext(viz) {
  const y = v => 1000 - v;
  return {
    viz,
    events: [],
    shapeConfig: {x: d => (d.x === "alpha" ? 100 : 200), y: d => y(d.y)},
    x: v => v,
    y,
    values: rows,
  };
}

it("boxWhiskerEmit: hands the Box each statistic in value-axis pixels", () => {
  const viz = precomputed();
  const nodes = {};
  const walk = list => {
    for (const n of list) {
      if (n.type === "group") walk(n.children);
      else nodes[n.key] = n;
    }
  };
  walk(boxWhiskerEmit(emitContext(viz), "Box"));
  assert.strictEqual(nodes["alpha-median"].transform.y, 1000 - 145);
  assert.strictEqual(nodes["alpha-box"].height, 172.5 - 78.5);
  assert.strictEqual(nodes["alpha-outlier-0"].transform.y, 1000 - 900);
  assert.ok(nodes["beta-box"]);
});

it("boxWhiskerEmit: the raw path draws Plot's own Box", () => {
  const viz = new BoxWhisker();
  const ctx = emitContext(viz);
  ctx.values = [10, 20, 30, 40].map((v, i) => ({
    __d3plus__: true,
    data: {id: "alpha", v},
    i,
    x: "alpha",
    y: v,
    discrete: "alpha",
  }));
  const keys = [];
  const walk = list => {
    for (const n of list) {
      if (n.type === "group") walk(n.children);
      else keys.push(n.key);
    }
  };
  walk(boxWhiskerEmit(ctx, "Box"));
  assert.ok(keys.includes("alpha-box"), keys.join());
});

it("boxTooltipRows: a precomputed box's statistics, largest first; none on the raw path", () => {
  const viz = precomputed();
  const box = {__d3plus__: true, data: rows[0], i: 0};
  const expected = [
    ["Maximum", "300"],
    ["Upper Quartile", "173"],
    ["Median", "145"],
    ["Lower Quartile", "78.5"],
    ["Minimum", "20"],
  ];
  assert.deepStrictEqual(boxTooltipRows(viz, box, 0), expected);
  assert.deepStrictEqual(boxTooltipRows(viz, summary[0], 0), expected);
  assert.deepStrictEqual(boxTooltipRows(viz, undefined, 0), []);
  assert.deepStrictEqual(boxTooltipRows(new BoxWhisker(), box, 0), []);
  viz.locale("es-ES");
  assert.strictEqual(boxTooltipRows(viz, box, 0)[2][0], "Mediana");
});
