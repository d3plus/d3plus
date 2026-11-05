import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  emitTrendLabels,
  trendEquationLabel,
  trendLabelPath,
  trendLabelText,
} from "../../src/charts/Plot/trendLabels.ts";
import {pathLabelNodes} from "../../src/charts/features/pathLabels.ts";
import {trendLineDefaults} from "../../src/charts/Plot/trendLines.ts";

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

it("trendLabelPath — upright, inset from the end, above the line", () => {
  // A line running right to left reads left to right.
  const d = trendLabelPath(
    [
      [300, 100],
      [100, 100],
    ],
    rect,
    3,
    11,
  );
  assert.strictEqual(d, "M100,97L294,97");
  assert.strictEqual(
    trendLabelPath(
      [
        [10, 10],
        [40, 10],
      ],
      rect,
      3,
      11,
    ),
    null,
    "too short for a label",
  );
  // Only the part inside the plot is labeled.
  assert.strictEqual(
    trendLabelPath(
      [
        [-100, 100],
        [200, 100],
        [300, 100],
      ],
      rect,
      0,
      11,
    ),
    "M200,100L294,100",
  );
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
  assert.deepStrictEqual(emitTrendLabels(viz(), scale, scale, rect), []);
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
