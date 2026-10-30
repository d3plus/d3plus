import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {
  GAP_DASH,
  complementIntervals,
  gapsAfter,
  intersectIntervals,
  intervalsDash,
  patternIntervals,
  pointLengths,
  resolveConnectGaps,
  runIndices,
  runPath,
} from "../../src/charts/Plot/connectGaps.ts";
import {
  breakLines,
  clipBands,
  lineGaps,
} from "../../src/charts/Plot/connectGapsScene.ts";
import {formatPlotData} from "../../src/charts/Plot/pipeline.ts";

useJsdom();

/** The stretches a dash array draws, as [start, end] lengths. */
function drawn(dash) {
  const out = [];
  let at = 0;
  dash.forEach((v, k) => {
    if (!(k % 2) && v > 0) out.push([+at.toFixed(2), +(at + v).toFixed(2)]);
    at += v;
  });
  return out;
}

it("resolveConnectGaps: through, break, dashed, and styled bridges", () => {
  assert.strictEqual(resolveConnectGaps(true), null);
  assert.strictEqual(resolveConnectGaps("solid"), null);
  assert.strictEqual(resolveConnectGaps(undefined), null);
  assert.deepStrictEqual(resolveConnectGaps(false), {bridge: null});
  assert.deepStrictEqual(resolveConnectGaps("dashed"), {
    bridge: {strokeDasharray: GAP_DASH, opacity: 1},
  });
  assert.deepStrictEqual(
    resolveConnectGaps({stroke: "#999", strokeDasharray: "1 3", opacity: 0.5}),
    {bridge: {stroke: "#999", strokeDasharray: [1, 3], opacity: 0.5}},
  );
  assert.deepStrictEqual(resolveConnectGaps({strokeDasharray: [4, 2]}), {
    bridge: {strokeDasharray: [4, 2], opacity: 1},
  });
  assert.deepStrictEqual(
    resolveConnectGaps({strokeDasharray: false, strokeWidth: 1}),
    {bridge: {strokeWidth: 1, opacity: 1}},
    "false draws a solid bridge",
  );
  assert.deepStrictEqual(resolveConnectGaps({}), {
    bridge: {strokeDasharray: GAP_DASH, opacity: 1},
  });
});

it("gapsAfter: a missing step between two points is a gap", () => {
  assert.deepStrictEqual(gapsAfter([1, 2, 4, 5], [1, 2, 3, 4, 5]), [1]);
  // Several gaps, and a gap of more than one step.
  assert.deepStrictEqual(
    gapsAfter([1, 3, 6, 7], [1, 2, 3, 4, 5, 6, 7]),
    [0, 1],
  );
  // A reversed order finds the same gaps.
  assert.deepStrictEqual(gapsAfter([5, 4, 2, 1], [1, 2, 3, 4, 5]), [1]);
});

it("gapsAfter: leading and trailing missing steps make no gap", () => {
  assert.deepStrictEqual(gapsAfter([3, 4, 5], [1, 2, 3, 4, 5, 6, 7]), []);
});

it("gapsAfter: a single-point island has a gap on each side", () => {
  assert.deepStrictEqual(gapsAfter([1, 3, 5], [1, 2, 3, 4, 5]), [0, 1]);
});

it("gapsAfter: no points, one point, or no steps make no gap", () => {
  assert.deepStrictEqual(gapsAfter([], [1, 2, 3]), []);
  assert.deepStrictEqual(gapsAfter([2], [1, 2, 3]), []);
  assert.deepStrictEqual(gapsAfter([1, 2, 3], []), []);
  assert.deepStrictEqual(gapsAfter([1, NaN, 3], [2]), []);
});

it("pointLengths: each target's length along a polyline", () => {
  const line = [
    [0, 0],
    [3, 4],
    [6, 0],
    [10, 0],
  ];
  const {at, total} = pointLengths(line, 0, [0, 3, 6, 8, 10]);
  assert.deepStrictEqual(at, [0, 5, 10, 12, 14]);
  assert.strictEqual(total, 14);
  // Along y, and a target never reached lies at the full length.
  const vertical = pointLengths(
    [
      [0, 10],
      [0, 0],
    ],
    1,
    [10, 5, -3],
  );
  assert.deepStrictEqual(vertical.at, [0, 5, 10]);
});

it("patternIntervals: a pattern restarted at a stretch's start", () => {
  assert.deepStrictEqual(patternIntervals([2, 4], 10, 22), [
    [10, 12],
    [16, 18],
  ]);
  assert.deepStrictEqual(patternIntervals([2, 4], 10, 11), [[10, 11]]);
  assert.deepStrictEqual(patternIntervals(undefined, 0, 5), [[0, 5]]);
  assert.deepStrictEqual(patternIntervals([0], 0, 5), [[0, 5]]);
  // An odd pattern repeats to an even one, as SVG does.
  assert.deepStrictEqual(patternIntervals([2], 0, 8), [
    [0, 2],
    [4, 6],
  ]);
  assert.deepStrictEqual(patternIntervals([2, 4], 5, 5), []);
});

it("intersectIntervals and complementIntervals", () => {
  assert.deepStrictEqual(
    intersectIntervals(
      [
        [0, 4],
        [6, 10],
      ],
      [
        [2, 7],
        [9, 12],
      ],
    ),
    [
      [2, 4],
      [6, 7],
      [9, 10],
    ],
  );
  assert.deepStrictEqual(
    complementIntervals(
      [
        [2, 4],
        [6, 7],
      ],
      10,
    ),
    [
      [0, 2],
      [4, 6],
      [7, 10],
    ],
  );
  assert.deepStrictEqual(complementIntervals([[0, 10]], 10), []);
});

it("intervalsDash: draws exactly the given stretches and never repeats", () => {
  const dash = intervalsDash(
    [
      [0, 3],
      [5, 6],
    ],
    10,
  );
  assert.strictEqual(dash.length % 2, 0, "an even dash array");
  assert.deepStrictEqual(drawn(dash), [
    [0, 3],
    [5, 6],
  ]);
  assert.ok(
    dash.reduce((a, b) => a + b, 0) > 10,
    "the pattern outlasts the path",
  );
  // A first stretch past the start opens with a zero-length dash.
  const later = intervalsDash([[4, 6]], 10);
  assert.deepStrictEqual(later.slice(0, 2), [0, 4]);
  assert.deepStrictEqual(drawn(later), [[4, 6]]);
  assert.deepStrictEqual(drawn(intervalsDash([], 10)), []);
});

it("runIndices: the runs between gaps", () => {
  assert.deepStrictEqual(runIndices(5, [1]), [
    [0, 1],
    [2, 4],
  ]);
  assert.deepStrictEqual(runIndices(3, [0, 1]), [
    [0, 0],
    [1, 1],
    [2, 2],
  ]);
  assert.deepStrictEqual(runIndices(3, []), [[0, 2]]);
  assert.deepStrictEqual(runIndices(0, []), []);
});

it("runPath: one subpath per run, and a tick for a lone point", () => {
  const points = [
    [0, 0],
    [10, 0],
    [20, 5],
    [30, 5],
  ];
  assert.strictEqual(runPath(points, [1], "linear", 0), "M0,0L10,0M20,5L30,5");
  assert.strictEqual(
    runPath(points, [0, 1], "linear", 0),
    "M-3,0L3,0M7,0L13,0M20,5L30,5",
  );
  assert.strictEqual(
    runPath([[5, 5]], [], "linear", 1),
    "M5,2L5,8",
    "a lone point on a vertical plot ticks along y",
  );
  assert.strictEqual(runPath(points, [], "linear", 0), "M0,0L10,0L20,5L30,5");
});

/** A LinePlot's Line emit context over hand-made rows (x in tens of pixels). */
function emitCtx(setting, values, missingRows = []) {
  const viz = new LinePlot()
    .connectGaps(setting)
    .shapeConfig({Line: {curve: "linear"}});
  return {
    viz,
    values,
    missingRows,
    shapeConfig: {x: d => d.x * 10, y: d => d.y},
  };
}

const row = (id, x, y) => ({id, x, y, data: {id, x, y}, i: 0});

it("lineGaps: null when lines run straight through, or nothing is missing", () => {
  const rows = [row("a", 1, 0), row("a", 3, 0), row("b", 2, 0)];
  assert.strictEqual(lineGaps(emitCtx(true, rows)), null);
  assert.strictEqual(lineGaps(emitCtx("solid", rows)), null);
  assert.strictEqual(
    lineGaps(emitCtx(false, [row("a", 1, 0), row("a", 2, 0)])),
    null,
  );
  assert.strictEqual(lineGaps(emitCtx(false, [])), null);
});

it("lineGaps: a step another line has, and the line's own null rows", () => {
  const rows = [
    row("a", 1, 0),
    row("a", 2, 0),
    row("a", 4, 0),
    row("a", 6, 0),
    row("b", 1, 5),
    row("b", 3, 5),
    row("b", 4, 5),
    row("b", 6, 5),
  ];
  // "a" skips 3 (b has it); "b" skips 2 (a has it); "a" has a null at 5.
  const gaps = lineGaps(emitCtx("dashed", rows, [row("a", 5, null)]));
  assert.deepStrictEqual(gaps.series.get("a").gaps, [1, 2]);
  assert.deepStrictEqual(gaps.series.get("a").gapIntervals, [
    [10, 30],
    [30, 50],
  ]);
  assert.strictEqual(gaps.series.get("a").total, 50);
  assert.deepStrictEqual(gaps.series.get("b").gaps, [0]);
  assert.deepStrictEqual(gaps.bridge, {strokeDasharray: GAP_DASH, opacity: 1});
  assert.strictEqual(gaps.axis, 0);
});

it("lineGaps: a series with only missing values draws nothing and has no gaps", () => {
  const rows = [row("a", 1, 0), row("a", 2, 0), row("a", 3, 0)];
  const gaps = lineGaps(
    emitCtx(false, rows, [row("b", 1, null), row("b", 2, null)]),
  );
  assert.strictEqual(gaps, null);
});

/** A Line's visible node, hit node, and band for series "a" through `points`. */
function nodes(points, dash) {
  const interactionPoints = points.map(([x, y], index) => ({
    x,
    y,
    index,
    datum: {id: "a"},
  }));
  const base = {
    type: "path",
    shapeType: "Line",
    d: "M0,0",
    transform: {x: 5, y: 0},
    datum: {id: "a"},
    interactionPoints,
  };
  return [
    {...base, key: "a::hit", paint: {stroke: "transparent", strokeWidth: 10}},
    {
      ...base,
      key: "a",
      paint: {stroke: "#123456", strokeWidth: 2, strokeDasharray: dash},
    },
  ];
}

it("breakLines: leaves the gaps out of the line, its hit area, and bridges them", () => {
  const rows = [row("a", 1, 0), row("a", 2, 0), row("a", 4, 0), row("b", 3, 0)];
  const gaps = lineGaps(emitCtx("dashed", rows));
  const points = rows.slice(0, 3).map(d => [d.x * 10, d.y]);
  const out = breakLines(nodes(points, [0]), gaps);
  assert.deepStrictEqual(
    out.map(n => n.key),
    ["a::hit", "a", "a::gap"],
  );
  const [hit, line, bridge] = out;
  // Hit-area points are local to the node's transform (x - 5).
  assert.strictEqual(hit.d, "M5,0L15,0M32,0L38,0");
  assert.deepStrictEqual(drawn(line.paint.strokeDasharray), [[0, 10]]);
  assert.deepStrictEqual(drawn(bridge.paint.strokeDasharray), [
    [10, 12],
    [16, 18],
    [22, 24],
    [28, 30],
  ]);
  assert.strictEqual(bridge.interactive, false);
  assert.strictEqual(bridge.interactionPoints, undefined);
  assert.deepStrictEqual(bridge.aria, {hidden: true});
  assert.strictEqual(bridge.paint.stroke, "#123456");
  assert.deepStrictEqual(bridge.datum, {id: "a"}, "dims with its line");
});

it("breakLines: false leaves gaps empty; a styled bridge takes its own paint", () => {
  const rows = [row("a", 1, 0), row("a", 3, 0), row("b", 2, 0)];
  const points = rows.slice(0, 2).map(d => [d.x * 10, d.y]);
  const broken = breakLines(nodes(points, [0]), lineGaps(emitCtx(false, rows)));
  assert.deepStrictEqual(
    broken.map(n => n.key),
    ["a::hit", "a"],
  );
  assert.deepStrictEqual(drawn(broken[1].paint.strokeDasharray), []);

  const styled = breakLines(
    nodes(points, [0]),
    lineGaps(
      emitCtx(
        {stroke: "#999", strokeDasharray: false, strokeWidth: 1, opacity: 0.5},
        rows,
      ),
    ),
  );
  const bridge = styled[2];
  assert.deepStrictEqual(drawn(bridge.paint.strokeDasharray), [[0, 20]]);
  assert.strictEqual(bridge.paint.stroke, "#999");
  assert.strictEqual(bridge.paint.strokeWidth, 1);
  assert.strictEqual(bridge.paint.opacity, 0.5);
});

it("breakLines: keeps a line's own dash pattern along its runs", () => {
  const rows = [
    row("a", 1, 0),
    row("a", 2, 0),
    row("a", 4, 0),
    row("a", 5, 0),
    row("b", 3, 0),
  ];
  const points = rows.slice(0, 4).map(d => [d.x * 10, d.y]);
  const [, line] = breakLines(
    nodes(points, [4, 2]),
    lineGaps(emitCtx(false, rows)),
  );
  assert.deepStrictEqual(drawn(line.paint.strokeDasharray), [
    [0, 4],
    [6, 10],
    [30, 34],
    [36, 40],
  ]);
});

it("breakLines: leaves lines without gaps and other nodes alone", () => {
  const rows = [row("a", 1, 0), row("a", 2, 0), row("b", 1, 0), row("b", 3, 0)];
  const gaps = lineGaps(emitCtx(false, rows));
  const input = nodes(
    rows.slice(0, 2).map(d => [d.x * 10, d.y]),
    [0],
  ).concat({type: "circle", key: "c", cx: 0, cy: 0, r: 2});
  assert.deepStrictEqual(breakLines(input, gaps), input);
});

it("clipBands: clips a gapped line's band to its runs, open past its ends", () => {
  const rows = [row("a", 1, 0), row("a", 2, 0), row("a", 4, 0), row("b", 3, 0)];
  const gaps = lineGaps(emitCtx(false, rows));
  const band = {
    type: "path",
    shapeType: "Area",
    key: "a",
    d: "M0,0",
    interactionPoints: [{x: 10, y: 0, index: 0, datum: {id: "a"}}],
  };
  const other = {
    ...band,
    interactionPoints: [{x: 10, y: 0, index: 0, datum: {id: "b"}}],
  };
  const [clipped, untouched] = clipBands([band, other], gaps);
  assert.strictEqual(clipped.type, "group");
  assert.strictEqual(clipped.key, "a::gaps");
  assert.deepStrictEqual(clipped.children, [band]);
  assert.strictEqual(
    clipped.clip.d,
    "M-100000,-100000H20V100000H-100000ZM40,-100000H100000V100000H40Z",
  );
  assert.strictEqual(untouched, other);
});

it("formatPlotData: keeps each Line row it drops for a missing value", () => {
  const viz = new LinePlot()
    .data([
      {id: "a", x: 1, y: 1},
      {id: "a", x: 2, y: null},
      {id: "a", x: 3, y: NaN},
      {id: "a", x: 4, y: 4},
      {id: "b", x: null, y: 2},
    ])
    .groupBy("id")
    .x("x")
    .y("y");
  viz._preDraw();
  const ctx = runStages({viz}, [formatPlotData]);
  assert.deepStrictEqual(
    ctx.plotMissingRows.map(d => [d.id, d.x]),
    [
      ["a", 2],
      ["a", 3],
    ],
  );
  assert.strictEqual(ctx.plotFormattedData.length, 2);
});
