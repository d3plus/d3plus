import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    ColorScales over very few unique values, on both renderers: a Matrix,
    Treemap or Geomap colored by one, two or three unique values (crossing
    zero or a `midpoint`, or not) fills every shape with a real color, gives
    values on either side of the midpoint different colors, and draws a
    legend in the same colors.
*/

const rows = ["A", "B", "C"];
const columns = ["X", "Y", "Z"];
/** A 3×3 grid of cells cycling through `values`. */
const grid = values =>
  rows.flatMap((row, r) =>
    columns.map((column, c) => ({
      row,
      column,
      score: values[(r * columns.length + c) % values.length],
    })),
  );

const square = x => [
  [x, 0],
  [x, 10],
  [x + 10, 10],
  [x + 10, 0],
  [x, 0],
];
const regions = {
  type: "Topology",
  objects: {
    regions: {
      type: "GeometryCollection",
      geometries: ["a", "b", "c"].map((id, i) => ({
        type: "Polygon",
        id,
        arcs: [[i]],
      })),
    },
  },
  arcs: [square(0), square(10), square(20)],
};

const matrix = (values, colorScaleConfig) => ({
  chart: "Matrix",
  values,
  config: {
    data: grid(values),
    groupBy: ["row", "column"],
    row: "row",
    column: "column",
    colorScale: "score",
    colorScaleConfig,
  },
});
const treemap = (values, colorScaleConfig) => ({
  chart: "Treemap",
  values,
  config: {
    data: values.map((score, i) => ({id: `item ${i}`, score})),
    groupBy: "id",
    sum: d => Math.abs(d.score) + 1,
    colorScale: "score",
    colorScaleConfig,
  },
});
const geomap = (values, colorScaleConfig) => ({
  chart: "Geomap",
  values,
  config: {
    data: values.map((score, i) => ({id: ["a", "b", "c"][i], score})),
    groupBy: "id",
    colorScale: "score",
    colorScaleConfig,
    ocean: "transparent",
    tiles: false,
    topojson: regions,
    zoom: false,
  },
});

const cases = {
  "Matrix linear, 3 values crossing zero": matrix([-2, 0, 3], {
    scale: "linear",
  }),
  "Matrix linear, 2 values crossing zero": matrix([-1, 1], {scale: "linear"}),
  "Matrix linear, 1 value": matrix([4], {scale: "linear"}),
  "Matrix jenks, 2 values crossing zero": matrix([-1, 1], {scale: "jenks"}),
  "Matrix jenks, 3 values crossing zero": matrix([-5, 2, 9], {}),
  "Treemap buckets, 3 values crossing zero": treemap([-5, 2, 9], {
    scale: "buckets",
  }),
  "Treemap quantile, 2 values crossing the midpoint": treemap([0, 4], {
    scale: "quantile",
    midpoint: 1,
  }),
  "Treemap log, 3 values crossing zero": treemap([-4, 0, 6], {scale: "log"}),
  "Geomap linear, 3 values crossing zero": geomap([-1, 0, 1], {
    scale: "linear",
  }),
  "Geomap jenks, 3 values crossing zero": geomap([-1, 0, 1], {
    scale: "jenks",
  }),
};

/**
    Runs in the page: draws the chart and returns, for each value, the color
    its scale gives and the fills its shapes paint (and, on a canvas, the
    pixel at each rect's center), plus the legend's colors.
*/
const draw = async ({chart, config, renderer}) => {
  const d3plus = window.d3plus;
  const viz = new d3plus[chart]()
    .select("#viz")
    .config(config)
    .renderer(renderer)
    .width(600)
    .height(400)
    .duration(0);
  await new Promise(r => viz.render(r));
  const scoreOf = d =>
    d?.score ?? d?.data?.score ?? d?.properties?.score ?? d?.__d3plus__?.score;
  const shapes = [];
  const legend = [];
  const walk = (n, x, y, inScale) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const scale = inScale || n.key === "viz-colorScale";
    if (["rect", "path"].includes(n.type)) {
      const fill = String(n.paint?.fill ?? "");
      if (scale) legend.push(fill);
      else if (typeof scoreOf(n.datum) === "number")
        shapes.push({
          score: scoreOf(n.datum),
          fill,
          // A cell's center, on a rect with an area to sample.
          center:
            n.type === "rect" && n.width > 2 && n.height > 2
              ? [nx + n.x + n.width / 2, ny + n.y + n.height / 2]
              : undefined,
        });
    }
    (n.children || []).forEach(c => walk(c, nx, ny, scale));
  };
  walk(viz._paintedScene.root, 0, 0, false);
  const cs = viz._colorScaleClass;
  const canvas = document.querySelector("#viz canvas");
  const pixel = ([px, py]) => {
    const ratio = canvas.width / canvas.getBoundingClientRect().width;
    const [r, g, b, a] = canvas
      .getContext("2d")
      .getImageData(Math.round(px * ratio), Math.round(py * ratio), 1, 1).data;
    return a ? `rgb(${r}, ${g}, ${b})` : "none";
  };
  return {
    scaleType: cs._scaleType,
    expected: [...new Set(config.data.map(scoreOf))].map(v => ({
      score: v,
      color: String(cs._colorScale(v)),
    })),
    shapes: shapes.map(s => ({
      ...s,
      pixel: canvas && s.center ? pixel(s.center) : undefined,
    })),
    legend,
    svgFills: canvas
      ? []
      : [...document.querySelectorAll("#viz svg rect, #viz svg path")].map(el =>
          el.getAttribute("fill"),
        ),
  };
};

/** `color` as `rgb(r, g, b)`, or null when it is not a usable color. */
const rgb = color => {
  const el = document.createElement("div");
  el.style.color = "";
  el.style.color = color;
  if (!el.style.color || /NaN|undefined/.test(color)) return null;
  document.body.appendChild(el);
  const out = getComputedStyle(el).color;
  el.remove();
  return out;
};

for (const renderer of ["svg", "canvas"])
  for (const [name, {chart, config, values}] of Object.entries(cases))
    it(`[${renderer}] ${name}: every shape takes a color`, async () => {
      const out = await render(
        "<div id='viz' style='width:600px;height:400px'></div>",
        draw,
        {chart, config, renderer},
      );
      const unique = [...new Set(values)];
      const colorOf = Object.fromEntries(
        out.expected.map(({score, color}) => [score, rgb(color)]),
      );
      for (const v of unique) {
        const color = colorOf[v];
        assert.ok(color, `${v} has a color (${JSON.stringify(out.expected)})`);
        assert.notStrictEqual(color, "rgb(0, 0, 0)", `${v} is not black`);
      }

      const painted = out.shapes.filter(s => unique.includes(s.score));
      assert.ok(
        unique.every(v => painted.some(s => s.score === v)),
        `a shape for every value (${JSON.stringify(out.shapes)})`,
      );
      for (const s of painted) {
        assert.strictEqual(rgb(s.fill), colorOf[s.score], `${s.score} fill`);
        if (s.pixel)
          assert.strictEqual(s.pixel, colorOf[s.score], `${s.score} pixel`);
      }
      if (renderer === "svg")
        assert.ok(
          out.svgFills.some(f => rgb(f) === colorOf[unique[0]]),
          "the svg paints the first value's color",
        );

      const midpoint = config.colorScaleConfig.midpoint ?? 0;
      const below = unique.filter(v => v < midpoint);
      const above = unique.filter(v => v > midpoint);
      if (below.length && above.length)
        assert.notStrictEqual(
          colorOf[Math.min(...below)],
          colorOf[Math.max(...above)],
          "the two sides of the midpoint differ",
        );

      if (["buckets", "jenks", "quantile"].includes(out.scaleType)) {
        const swatches = new Set(out.legend.map(rgb).filter(Boolean));
        for (const v of unique)
          assert.ok(
            swatches.has(colorOf[v]),
            `the legend shows ${v}'s color (${[...swatches]})`,
          );
      } else {
        const gradient = out.legend.find(f => f.startsWith("gradient:"));
        assert.ok(gradient, `a gradient bar (${out.legend})`);
        const stops = JSON.parse(gradient.slice("gradient:".length)).stops;
        const ends = [stops[0], stops[stops.length - 1]].map(s => rgb(s.color));
        const low = Math.min(...unique),
          high = Math.max(...unique);
        assert.strictEqual(ends[0], colorOf[low], "the bar starts at the low");
        assert.strictEqual(ends[1], colorOf[high], "the bar ends at the high");
      }
    });
