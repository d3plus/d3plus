import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  emitTrendLabels,
  trendEquationLabel,
  lineLabelBoxes,
  trendLabelSpot,
  trendLabelText,
} from "../../src/charts/Plot/trendLabels.ts";
import {pathLabelNodes} from "../../src/charts/features/pathLabels.ts";
import {labelCorners} from "../../src/charts/features/linkLabelGeometry.ts";
import {trendLineDefaults} from "../../src/charts/Plot/trendLines.ts";
import {
  bendStrain,
  textFollows,
} from "../../src/charts/features/pathLabelBends.ts";

useJsdom();

const fit = (extra = {}) => ({
  id: "A",
  label: "Alpha",
  color: "#4c6ef5",
  axis: "x",
  fit: {type: "linear", coefficients: [3.4, 2.1], r2: 0.8412, n: 10},
  row: {id: "A"},
  samples: [
    {x: 0, y: 0},
    {x: 10, y: 5},
    {x: 20, y: 10},
    {x: 30, y: 30, projected: true},
  ],
  ...extra,
});

const viz = (config = {}, extra = {}) => ({
  _trendFits: [fit()],
  _trendLineConfig: {...trendLineDefaults(), ...config},
  schema: {locale: "en-US", translate: s => s},
  ...extra,
});

it("trendEquationLabel — the equation and R², or R² alone over time", () => {
  assert.strictEqual(
    trendEquationLabel(fit(), "en-US"),
    "y = 2.1x + 3.4, R² = 0.84",
  );
  assert.strictEqual(trendEquationLabel(fit(), "en-US", true), "R² = 0.84");
  assert.strictEqual(
    trendEquationLabel(fit({axis: "y"}), "en-US"),
    "x = 2.1y + 3.4, R² = 0.84",
    "a fit along y swaps the axis names",
  );
});

it("trendLabelText — series name, Trend, equation, or a function", () => {
  assert.strictEqual(trendLabelText(viz(), fit(), false), null);
  assert.strictEqual(trendLabelText(viz(), fit(), true), "Alpha");
  assert.strictEqual(
    trendLabelText(viz(), fit({row: undefined}), true),
    "Trend",
    "a line fit to every point",
  );
  assert.strictEqual(
    trendLabelText(viz(), fit(), "equation"),
    "y = 2.1x + 3.4, R² = 0.84",
  );
  assert.strictEqual(
    trendLabelText(viz({}, {_xTime: true}), fit(), "equation"),
    "R² = 0.84",
  );
  assert.strictEqual(
    trendLabelText(viz(), fit(), f => `${f.label}!`),
    "Alpha!",
  );
  assert.strictEqual(
    trendLabelText(viz(), fit(), () => ""),
    null,
  );
});

const rect = {x0: 0, y0: 0, x1: 400, y1: 300};

const place = (extra = {}) => ({
  fontSize: 11,
  lift: 3,
  width: 60,
  obstacles: [],
  ...extra,
});
const xs = d =>
  [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);

it("trendLabelSpot — upright, inset from the end, above the line", () => {
  // A line running right to left reads left to right.
  const spot = trendLabelSpot(
    [
      [300, 100],
      [100, 100],
    ],
    rect,
    place(),
  );
  assert.strictEqual(spot.d, "M234,97L294,97");
  assert.ok(spot.boxes.length > 0);
  assert.strictEqual(
    trendLabelSpot(
      [
        [10, 10],
        [40, 10],
      ],
      rect,
      place(),
    ),
    null,
    "too short for a label",
  );
  // Only the part inside the plot is labeled, and a label longer than the
  // line takes all of it (to be cut short with an ellipsis).
  assert.strictEqual(
    trendLabelSpot(
      [
        [-100, 100],
        [200, 100],
        [300, 100],
      ],
      rect,
      place({lift: 0, width: 500}),
    ).d,
    "M200,100L294,100",
  );
});

it("trendLabelSpot — slides back from a taken end, then tries below", () => {
  const line = [
    [100, 100],
    [300, 100],
  ];
  // Another label sits on the end of this line's stretch.
  const taken = {x: 270, y: 93, width: 40, height: 11, angle: 0};
  const slid = trendLabelSpot(line, rect, place({obstacles: [taken]}));
  const pts = xs(slid.d);
  assert.ok(pts[pts.length - 1][0] < 244, `slides clear: ${slid.d}`);
  assert.ok(
    pts.every(p => p[1] === 97),
    "still above the line",
  );
  // With the whole stretch above taken, it goes below.
  const above = {x: 200, y: 93, width: 220, height: 11, angle: 0};
  const below = trendLabelSpot(line, rect, place({obstacles: [above]}));
  assert.ok(
    xs(below.d).every(p => p[1] > 100),
    `below: ${below.d}`,
  );
  // With both sides taken, there's no spot.
  const under = {x: 200, y: 110, width: 220, height: 14, angle: 0};
  assert.strictEqual(
    trendLabelSpot(line, rect, place({obstacles: [above, under]})),
    null,
  );
});

it("trendLabelSpot — slides back off a bend too tight for its letters", () => {
  // Down to the right, then sharply back up: a valley under the text, near
  // the end of the line.
  const line = [
    [50, 50],
    [300, 150],
    [330, 110],
  ];
  const spot = trendLabelSpot(line, rect, place());
  const pts = xs(spot.d);
  assert.ok(pts[pts.length - 1][0] < 295, `clear of the valley: ${spot.d}`);
  assert.ok(textFollows(pts, 11));
  // A minRadius of 0 lets it sit across the valley, at the line's end.
  const loose = xs(trendLabelSpot(line, rect, place({minRadius: 0})).d);
  assert.ok(loose[loose.length - 1][0] > 300, "at the end");
  // Every stretch bent: it still takes the clear one that bends least,
  // gentler than a label running the whole line.
  const zig = Array.from({length: 13}, (_, k) => [
    40 + k * 25,
    k % 2 ? 140 : 120 - k,
  ]);
  const bent = trendLabelSpot(zig, rect, place());
  assert.ok(bent, "still labelled");
  const strain = bendStrain(xs(bent.d), 11);
  assert.ok(strain > 1);
  const whole = trendLabelSpot(zig, rect, place({width: 300})).d;
  assert.ok(strain < bendStrain(xs(whole), 11));
});

it("lineLabelBoxes — the line labels at ends and along lines, and contour labels", () => {
  const text = (key, datum, extra = {}) => ({
    type: "text",
    key,
    x: 0,
    y: 0,
    datum,
    font: {size: 10, anchor: "start"},
    lines: [{text: "label", x: 0, y: 10, width: 30}],
    ...extra,
  });
  const boxes = lineLabelBoxes([
    {
      type: "group",
      key: "g",
      transform: {x: 100, y: 0},
      children: [
        text("end", {data: {shape: "Line"}}),
        text("point", {data: {shape: "Circle"}}),
        text("line-label-along-a", undefined, {
          path: {d: "M0,50L100,50"},
        }),
      ],
    },
  ]);
  assert.ok(boxes.length > 1);
  assert.strictEqual(boxes[0].x, 115, "offset by its group");
  assert.ok(
    boxes.slice(1).every(b => b.y < 50),
    "the along label's boxes sit above its path",
  );
  const contour = lineLabelBoxes([
    text("contour-label-0-0-0", undefined, {path: {d: "M0,50L100,50"}}),
    text("contour-label-0-0-0-pad", undefined, {type: "path"}),
  ]);
  assert.ok(contour.length > 0, "Hexbin's contour labels count");
  assert.ok(contour.every(b => b.y < 50));
});

it("emitTrendLabels — one inert, haloed label per fit, on its fitted stretch", () => {
  const scale = v => v * 10;
  const nodes = emitTrendLabels(viz({label: true}), scale, scale, rect);
  assert.strictEqual(nodes.length, 1);
  const [label] = nodes;
  assert.strictEqual(label.type, "text");
  assert.strictEqual(label.key, "trend-label-A");
  assert.strictEqual(label.interactive, false);
  assert.strictEqual(label.datum, undefined);
  assert.strictEqual(label.halo, true);
  assert.strictEqual(label.font.anchor, "end");
  // The projected sample (x 30) is left off the path.
  const xs = [...label.path.d.matchAll(/[ML](-?[\d.]+),/g)].map(m => +m[1]);
  assert.ok(Math.max(...xs) < 200, label.path.d);
  assert.ok(Math.max(...xs) > 190, "inset just short of the end");
  assert.deepStrictEqual(
    emitTrendLabels(viz({label: false}), scale, scale, rect),
    [],
    "label: false turns them off",
  );
  assert.strictEqual(
    emitTrendLabels(viz(), scale, scale, rect)[0].lines[0].text,
    "y = 2.1x + 3.4, R² = 0.84",
    "the equation by default",
  );
});

it("emitTrendLabels — labelConfig.minRadius sets the bend, and stays out of TextBox", () => {
  const warn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    const scale = v => v * 10;
    const nodes = emitTrendLabels(
      viz({label: true, labelConfig: {minRadius: 0, fontSize: 12}}),
      scale,
      scale,
      rect,
    );
    assert.strictEqual(nodes.length, 1);
    assert.strictEqual(nodes[0].font.size, 12);
  } finally {
    console.warn = warn;
  }
  assert.deepStrictEqual(warnings, []);
});

it("pathLabelNodes — legible color on the theme, cut short to its path", () => {
  const nodes = pathLabelNodes(
    {schema: {locale: "en-US"}, _theme: {dark: true}},
    [
      {
        key: "k",
        text: "A label far too long for the little path it follows",
        d: "M0,0L60,0",
        color: "#000080",
        anchor: "middle",
      },
    ],
  );
  const [node] = nodes;
  assert.ok(node.lines[0].text.endsWith("..."), node.lines[0].text);
  assert.ok(node.lines[0].width <= 60);
  assert.notStrictEqual(node.paint.fill, "#000080", "lightened on dark");
  assert.strictEqual(node.aria.hidden, true);
});

it("trendLabelSpot — slides back along its line to stay inside the plot", () => {
  // A line falling steeply into the plot's right edge: just above its end,
  // the label would run out past the edge.
  const line = [
    [100, 40],
    [300, 120],
    [400, 280],
  ];
  const spot = trendLabelSpot(line, rect, place({width: 120, lift: 6}));
  assert.ok(spot, "the line has room for the label");
  const corners = spot.boxes.flatMap(labelCorners);
  assert.ok(
    corners.every(
      ([x, y]) => x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1,
    ),
    `inside the plot: ${JSON.stringify(corners)}`,
  );
});
