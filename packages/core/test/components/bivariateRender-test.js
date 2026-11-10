import {it} from "vitest";
import assert from "assert";
import {ColorScale} from "../../index.ts";
import {
  bivariateAxisLabels,
  colorScaleValueFormat,
  layoutBivariate,
  renderBivariate,
} from "../../src/components/ColorScale/bivariateRender.ts";
import {BIVARIATE_COLORS} from "../../src/components/ColorScale/bivariateScale.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => ({
  id: `r${v}`,
  a: v,
  b: (v * 4) % 10,
}));

/** A `<g>` in a fresh `<svg>` to render into. */
function group() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  return svg.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "g"),
  );
}

/** A bivariate ColorScale over `rows`, rendered in compute mode. */
function scaleOf(config = {}) {
  const cs = new ColorScale()
    .renderMode("compute")
    .select(group())
    .bivariate(true)
    .data(rows)
    .value(d => [d.a, d.b])
    .width(400)
    .height(300)
    .orient("right")
    .align("end")
    .config(config);
  cs._bivariateFields = ["Alpha", "Beta"];
  return cs.render();
}

/** Every node in a scene. */
const flatten = node => [node, ...(node.children ?? []).flatMap(flatten)];

it("ColorScale bivariate — a diamond of cells, one per color", () => {
  const cs = scaleOf();
  const nodes = flatten(cs.toScene());
  const cells = nodes.filter(n => n.type === "path");
  assert.strictEqual(cells.length, 9);
  assert.deepStrictEqual(
    cells.map(n => n.paint.fill),
    BIVARIATE_COLORS,
    "row-major from low/low",
  );
  for (const cell of cells) {
    assert.strictEqual(cell.datum._isColorScaleBucket, true);
    assert.strictEqual(cell.datum.color, cell.paint.fill);
    assert.strictEqual(cell.aria.label, cell.datum.id);
  }
  assert.deepStrictEqual(
    [cells[0].datum._bivariateX, cells[0].datum._bivariateY],
    [0, 0],
  );
  assert.deepStrictEqual(
    [cells[5].datum._bivariateX, cells[5].datum._bivariateY],
    [2, 1],
  );
  assert.strictEqual(cells[0].datum.id, "Alpha: 1 - 3, Beta: 0 - 2");
  assert.strictEqual(cells[8].datum.id, "Alpha: 7 - 9, Beta: 6 - 8");
});

it("ColorScale bivariate — cells take the swatches' stroke, or none", () => {
  const strokeOf = config =>
    flatten(scaleOf(config).toScene())
      .filter(n => n.type === "path")
      .map(n => [n.paint.stroke, n.paint.strokeWidth, n.paint.strokeOpacity]);
  const own = strokeOf({
    legendConfig: {
      shapeConfig: {
        stroke: d => (d._bivariateX ? "#ff0000" : "#0000ff"),
        strokeWidth: 2,
        strokeOpacity: 0.5,
      },
    },
  });
  assert.deepStrictEqual(own[0], ["#0000ff", 2, 0.5], "per cell");
  assert.deepStrictEqual(own[1], ["#ff0000", 2, 0.5]);
  const none = strokeOf({legendConfig: {shapeConfig: {strokeWidth: 0}}});
  none.forEach(s =>
    assert.deepStrictEqual(s, [undefined, undefined, undefined]),
  );
});

it("ColorScale bivariate — the grid turned 45°: low/low at the bottom", () => {
  const cs = scaleOf();
  const cells = flatten(cs.toScene()).filter(n => n.type === "path");
  const pointsOf = n =>
    n.d
      .slice(1, -1)
      .split("L")
      .map(p => p.split(",").map(Number));
  const center = n => {
    const pts = pointsOf(n);
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
  };
  const [low, right, left, high] = [0, 2, 6, 8].map(k => center(cells[k]));
  assert.ok(low[1] > high[1], "low/low below high/high");
  assert.ok(Math.abs(low[0] - high[0]) < 1e-6, "on one vertical");
  assert.ok(right[0] > low[0], "the first variable rises to the right");
  assert.ok(left[0] < low[0], "the second variable rises to the left");
  assert.ok(Math.abs(right[1] - left[1]) < 1e-6, "level corners");
  // Each cell is a square turned 45°: its corners straight above, below,
  // and to each side of its center.
  const [top, side, bottom, other] = pointsOf(cells[4]).map(p => p.map(Number));
  const [cx, cy] = center(cells[4]);
  const sides = [top, side, bottom, other].map(([x, y]) => [x - cx, y - cy]);
  for (const [dx, dy] of sides)
    assert.ok(
      Math.abs(dx) < 1e-2 || Math.abs(dy) < 1e-2,
      `a corner on an axis: ${dx}, ${dy}`,
    );
});

it("ColorScale bivariate — each variable named along its lower edge", () => {
  const cs = scaleOf();
  const labels = flatten(cs.toScene()).filter(n => n.type === "text");
  assert.strictEqual(labels.length, 2);
  const [first, second] = labels;
  assert.strictEqual(first.transform.rotate, -45, "reads up to the right");
  assert.strictEqual(second.transform.rotate, 45, "reads down to the right");
  assert.strictEqual(first.lines.map(l => l.text).join(" "), "Alpha →");
  assert.strictEqual(second.lines.map(l => l.text).join(" "), "← Beta");
  assert.ok(first.transform.x > 0 && second.transform.x < 0, "either side");
  assert.strictEqual(first.interactive, false);
  assert.ok(first.font.size > 0 && first.paint.fill, "labelConfig's font");
});

it("ColorScale bivariate — bivariateLabels name the variables", () => {
  const cs = scaleOf({bivariateLabels: ["Income", "Rent"]});
  const labels = flatten(cs.toScene()).filter(n => n.type === "text");
  assert.deepStrictEqual(
    labels.map(n => n.lines.map(l => l.text).join(" ")),
    ["Income →", "← Rent"],
  );
  assert.deepStrictEqual(bivariateAxisLabels(cs), ["Income", "Rent"]);
  const cells = flatten(cs.toScene()).filter(n => n.type === "path");
  assert.ok(cells[0].datum.id.startsWith("Income: "));
});

it("ColorScale bivariate — a long label wraps to two lines, words whole", () => {
  const cs = scaleOf({
    bivariateLabels: ["Median household income in dollars", "B"],
  });
  const [first] = flatten(cs.toScene()).filter(n => n.type === "text");
  assert.strictEqual(first.lines.length, 2);
  const words = first.lines.flatMap(l => l.text.split(/\s+/));
  for (const word of words)
    assert.ok(!word.endsWith("-") && !word.includes("­"), word);
});

it("ColorScale bivariate — no name, no label", () => {
  const cs = scaleOf();
  cs._bivariateFields = undefined;
  cs.render();
  assert.strictEqual(
    flatten(cs.toScene()).filter(n => n.type === "text").length,
    0,
  );
  assert.deepStrictEqual(bivariateAxisLabels(cs), ["", ""]);
});

it("ColorScale bivariate — bivariateBuckets and bivariateColors", () => {
  const four = scaleOf({bivariateBuckets: 4});
  assert.strictEqual(
    flatten(four.toScene()).filter(n => n.type === "path").length,
    16,
  );
  const own = ["#000000", "#ff0000", "#0000ff", "#ff00ff"];
  const two = scaleOf({bivariateBuckets: 2, bivariateColors: own});
  assert.deepStrictEqual(
    flatten(two.toScene())
      .filter(n => n.type === "path")
      .map(n => n.paint.fill),
    own,
  );
  assert.strictEqual(two._colorScale([9, 9]), "#ff00ff");
});

it("ColorScale bivariate — sits within its box, along its side", () => {
  const cs = scaleOf();
  const bounds = cs.outerBounds();
  assert.ok(bounds.width > 100 && bounds.height > 100, "full size");
  assert.ok(Math.abs(bounds.x + bounds.width - 400) < 1e-6, "right aligned");
  assert.ok(
    Math.abs(bounds.y - (300 - bounds.height) / 2) < 1e-6,
    "vertically centered",
  );
  const bottom = scaleOf({orient: "bottom", align: "start"}).outerBounds();
  assert.strictEqual(bottom.y, 0, "start: at the top of its box");
  assert.ok(
    Math.abs(bottom.x - (400 - bottom.width) / 2) < 1e-6,
    "horizontally centered",
  );
});

it("ColorScale bivariate — shrinks its grid to fit a small box", () => {
  const cs = scaleOf({width: 400, height: 100});
  const bounds = cs.outerBounds();
  assert.ok(bounds.height <= 100 + 1, `${bounds.height} fits`);
});

it("layoutBivariate / renderBivariate — scale and bounds", () => {
  const cs = scaleOf();
  const layout = renderBivariate(cs);
  assert.deepStrictEqual(cs.outerBounds(), layout.bounds);
  assert.strictEqual(typeof cs._colorScale, "function");
  assert.strictEqual(cs._colorScale([1, 0]), "#e8e8e8");
  const again = layoutBivariate(cs, cs._colorScale);
  assert.deepStrictEqual(again.bounds, layout.bounds);
  assert.strictEqual(cs._barGeometry, undefined);
});

it("ColorScale bivariate — ignores rows without a pair", () => {
  const cs = new ColorScale()
    .renderMode("compute")
    .select(group())
    .bivariate(true)
    .data([...rows, {a: 4}, {a: null, b: 3}])
    .value(d => (d.a != null && d.b != null ? [d.a, d.b] : undefined))
    .render();
  assert.strictEqual(cs._colorScale.domain().length, 9);
});

it("colorScaleValueFormat — tickFormat, then years, then abbreviated", () => {
  const cs = new ColorScale();
  assert.strictEqual(colorScaleValueFormat(cs, [1, 2])(12500), "12.5k");
  assert.strictEqual(colorScaleValueFormat(cs, [1990, 2020])(2001), "2001");
  cs.axisConfig({tickFormat: d => `${d * 100}%`});
  assert.strictEqual(colorScaleValueFormat(cs, [1, 2])(0.5), "50%");
});

it("ColorScale bivariate — draws no hover mark", () => {
  const cs = scaleOf();
  cs.hover([5, 5]);
  const scene = cs.toScene();
  assert.ok(
    !flatten(scene).some(n => String(n.key).includes("-hover")),
    "no mark",
  );
});
