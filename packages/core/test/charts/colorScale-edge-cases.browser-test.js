import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    ColorScale edge cases, on both renderers: a color array through the
    midpoint color spaces each side evenly; a log scale whose pole is exactly
    1 paints that pole's color; a diverging quantile scale splits each side at
    its values' quantiles; and a jenks scale over only-negative values ramps
    from the low pole, like the other scales.
*/

/** A one-row Matrix with a cell per value, colored by its value. */
const matrix = (values, colorScaleConfig) => ({
  data: values.map((score, i) => ({row: "A", column: `C${i}`, score})),
  groupBy: ["row", "column"],
  row: "row",
  column: "column",
  colorScale: "score",
  colorScaleConfig,
});

/**
    Runs in the page: draws the chart and returns its poles, each cell's
    score and painted color (and, on a canvas, the pixel at its center), the
    legend's fills, and the scale's domain.
*/
const draw = async ({config, renderer}) => {
  const viz = new window.d3plus.Matrix()
    .select("#viz")
    .config(config)
    .renderer(renderer)
    .width(600)
    .height(400)
    .duration(0);
  await new Promise(r => viz.render(r));
  const scoreOf = d => d?.score ?? d?.data?.score ?? d?.__d3plus__?.score;
  const cells = [];
  const legend = [];
  const walk = (n, x, y, inScale) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const scale = inScale || n.key === "viz-colorScale";
    if (n.type === "rect") {
      const fill = String(n.paint?.fill ?? "");
      if (scale) legend.push(fill);
      else if (typeof scoreOf(n.datum) === "number")
        cells.push({
          score: scoreOf(n.datum),
          fill,
          center: [nx + n.x + n.width / 2, ny + n.y + n.height / 2],
        });
    }
    (n.children || []).forEach(c => walk(c, nx, ny, scale));
  };
  walk(viz._paintedScene.root, 0, 0, false);
  const canvas = document.querySelector("#viz canvas");
  const pixel = ([px, py]) => {
    const ratio = canvas.width / canvas.getBoundingClientRect().width;
    const [r, g, b, a] = canvas
      .getContext("2d")
      .getImageData(Math.round(px * ratio), Math.round(py * ratio), 1, 1).data;
    return a ? `rgb(${r}, ${g}, ${b})` : "none";
  };
  const cs = viz._colorScaleClass;
  return {
    poles: cs.schema.colorDefaults,
    domain: cs._colorScale.domain(),
    cells: cells.map(c => ({...c, pixel: canvas ? pixel(c.center) : null})),
    legend,
  };
};

/** `color` as `rgb(r, g, b)`, or null when it is not a usable color. */
const rgb = color => {
  const el = document.createElement("div");
  el.style.color = color;
  if (!el.style.color) return null;
  document.body.appendChild(el);
  const out = getComputedStyle(el).color;
  el.remove();
  return out;
};

const channels = c => c.match(/\d+/g).map(Number);
const reddish = c => channels(c)[0] > channels(c)[2];

/** Draws `config` and returns the output with a score → painted color map. */
const drawn = async (config, renderer) => {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    draw,
    {config, renderer},
  );
  const colorOf = {};
  for (const c of out.cells) {
    colorOf[c.score] = rgb(c.fill);
    if (c.pixel)
      assert.strictEqual(c.pixel, colorOf[c.score], `${c.score}: canvas pixel`);
  }
  return {...out, colorOf};
};

/** The gradient bar's stops, from the legend's fills. */
const gradientStops = legend => {
  const gradient = legend.find(f => f.startsWith("gradient:"));
  assert.ok(gradient, `a gradient bar (${legend})`);
  return JSON.parse(gradient.slice("gradient:".length)).stops;
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a color array through the midpoint color spans each side evenly`, async () => {
    const poles = {off: "#d73027", light: "#efefef", sequential: "#4575b4"};
    const color = [poles.off, poles.light, poles.sequential];
    const out = await drawn(
      matrix([-10, -1, 1, 5, 10], {
        scale: "linear",
        color,
        colorMid: poles.light,
      }),
      renderer,
    );
    assert.deepStrictEqual(out.domain, [-10, 0, 10]);
    assert.strictEqual(out.colorOf[10], rgb(poles.sequential), "the top");
    assert.notStrictEqual(out.colorOf[5], rgb(poles.sequential), "halfway");
    const stops = gradientStops(out.legend);
    assert.deepStrictEqual(
      stops.map(s => rgb(s.color)),
      color.map(rgb),
      "a stop per color",
    );
    assert.ok(
      Math.abs(stops[1].offset - 0.5) < 0.01,
      `the midpoint stop is centered (${stops[1].offset})`,
    );
  });

  it(`[${renderer}] a log scale whose high pole is exactly 1 paints it`, async () => {
    const out = await drawn(matrix([-10, -5, 1], {scale: "log"}), renderer);
    assert.deepStrictEqual(out.domain, [-10, -1, 1]);
    assert.strictEqual(out.colorOf[1], rgb(out.poles.sequential), "the pole");
    assert.strictEqual(out.colorOf[-10], rgb(out.poles.off), "the low pole");
    assert.ok(
      reddish(out.colorOf[-5]),
      "the negative side ramps to the midpoint",
    );
    const stops = gradientStops(out.legend);
    assert.ok(
      stops.every((s, i) => !i || s.offset > stops[i - 1].offset),
      `the stops ascend (${JSON.stringify(stops)})`,
    );
  });

  it(`[${renderer}] a diverging quantile scale splits each side at its quantiles`, async () => {
    const values = [-100, -4, -3, -2, -1, 1, 2, 3, 4, 100];
    const out = await drawn(matrix(values, {scale: "quantile"}), renderer);
    assert.deepStrictEqual(out.domain, [-100, -2.5, 0, 2.5, 100]);
    const {colorOf} = out;
    assert.strictEqual(colorOf[-4], colorOf[-100], "-4 shares the low bucket");
    assert.notStrictEqual(colorOf[-2], colorOf[-4], "-2 starts the next");
    assert.strictEqual(colorOf[-1], colorOf[-2]);
    assert.notStrictEqual(colorOf[3], colorOf[2], "3 starts a bucket");
    const swatches = new Set(out.legend.map(rgb).filter(Boolean));
    for (const v of values)
      assert.ok(swatches.has(colorOf[v]), `the legend shows ${v}'s color`);
  });

  it(`[${renderer}] a jenks scale over only-negative values ramps from the low pole`, async () => {
    const values = [-9, -8, -5, -4, -2, -1];
    const out = await drawn(matrix(values, {scale: "jenks"}), renderer);
    for (const v of values)
      assert.ok(reddish(out.colorOf[v]), `${v}: ${out.colorOf[v]}`);
    const sum = c => channels(c).reduce((a, b) => a + b, 0);
    assert.ok(
      sum(out.colorOf[-9]) < sum(out.colorOf[-1]),
      "the most negative value is the darkest",
    );
    // Transparent rects frame each swatch.
    const swatches = out.legend
      .map(rgb)
      .filter(c => c && !c.startsWith("rgba"));
    assert.strictEqual(swatches.length, 5, `a swatch per bucket (${swatches})`);
    assert.ok(swatches.every(reddish), `red swatches (${swatches})`);
  });
}
