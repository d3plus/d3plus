import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {rgb} from "d3-color";

import {render} from "~test/browser/render.js";
import {colorDefaults, colorRamp} from "@d3plus/color";
import {colorToOklab, colorToOklch} from "../../../color/src/oklab.ts";
import {themeDark} from "../../src/utils/theme.ts";

/**
    Color scales on a dark theme: low values take a dim tint near the
    background and high values the bright pole, diverging midpoints go dark,
    the legend matches the marks, and colors the user sets still win. Light
    charts keep their pale→dark ramps.
*/

const L = c => colorToOklch(c).l;
const hex = c => rgb(c).formatHex();
const BG = L(themeDark.background);

/** A 3×4 Matrix of `values`, one per cell, colored by value. */
const matrix = values =>
  `lib => new lib.Matrix()
    .data(${JSON.stringify(
      values.map((value, i) => ({
        id: `c${i}`,
        row: `r${Math.floor(i / 4)}`,
        column: `k${i % 4}`,
        value,
      })),
    )})
    .groupBy("id").row("row").column("column").colorScale("value")`;

/** A Geomap of four squares: three with values, one ("d") without. */
const geomap = `lib => new lib.Geomap()
  .groupBy("geo").colorScale("value").tiles(false).ocean("transparent")
  .colorScaleConfig({scale: "buckets", buckets: 3})
  .topojson({
    type: "Topology",
    objects: {geo: {type: "GeometryCollection", geometries: [
      {type: "Polygon", id: "a", arcs: [[0]]},
      {type: "Polygon", id: "b", arcs: [[1]]},
      {type: "Polygon", id: "c", arcs: [[2]]},
      {type: "Polygon", id: "d", arcs: [[3]]},
    ]}},
    arcs: [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
      [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
      [[40, 0], [40, 10], [50, 10], [50, 0], [40, 0]],
      [[60, 0], [60, 10], [70, 10], [70, 0], [60, 0]],
    ],
  })
  .data([{geo: "a", value: 1}, {geo: "b", value: 50}, {geo: "c", value: 100}])`;

/**
    Draws `src` and reports each data mark's scene fill and value, the
    painted color at its center (the svg element's fill, or the canvas pixel),
    the colorScale legend's swatch fills, and its gradient stops.
*/
const draw = ({src, renderer, theme, config}) =>
  new Promise((resolve, reject) => {
    const build = new Function("lib", `return (${src})(lib);`);
    const viz = build(window.d3plus)
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .select("#viz");
    if (theme !== undefined) viz.theme(theme);
    if (config) viz.config(config);
    viz.render(() => {
      try {
        const canvas = document.querySelector("#viz canvas");
        const ctx = canvas && canvas.getContext("2d");
        const ratio = canvas
          ? canvas.width / canvas.getBoundingClientRect().width
          : 1;
        const painted = (n, x, y) => {
          if (!canvas) {
            const el = document.querySelector(`#viz [data-key="${n.key}"]`);
            return el ? el.getAttribute("fill") : null;
          }
          const [r, g, b] = ctx.getImageData(x * ratio, y * ratio, 1, 1).data;
          return `rgb(${r}, ${g}, ${b})`;
        };
        const marks = [];
        const swatches = [];
        let stops = null;
        const walk = (n, x, y, inScale) => {
          const t = n.transform || {};
          const nx = x + (t.x || 0),
            ny = y + (t.y || 0);
          const scale = inScale || n.key === "viz-colorScale";
          const key = `${n.key}`;
          const fill = n.paint && n.paint.fill;
          if (/^(matrix-\d+|geomap-path-)/.test(key) && n.datum) {
            const d = n.datum.data || n.datum;
            let cx = nx,
              cy = ny;
            if (n.type === "rect") {
              cx += n.x + n.width / 2;
              cy += n.y + n.height / 2;
            } else {
              const box = document
                .querySelector(`#viz [data-key="${key}"]`)
                ?.getBBox?.();
              if (box) {
                cx += box.x + box.width / 2;
                cy += box.y + box.height / 2;
              }
            }
            marks.push({
              key,
              id: d.geo ?? d.id,
              value: d.value,
              fill,
              painted: n.type === "rect" ? painted(n, cx, cy) : null,
            });
          }
          if (scale && n.type === "rect" && fill && !key.endsWith("::hit")) {
            if (fill.startsWith("gradient:"))
              stops = JSON.parse(fill.slice(9)).stops.map(s => s.color);
            else if (fill !== "transparent" && n.paint.strokeWidth !== 1)
              swatches.push(fill);
          }
          (n.children || []).forEach(c => walk(c, nx, ny, scale));
        };
        walk(viz._paintedScene.root, 0, 0, false);
        resolve({marks, swatches, stops});
      } catch (e) {
        reject(e);
      }
    });
  });

const page = (background = "#ffffff") =>
  `<div id="viz" style="width:600px;height:400px;background:${background}"></div>`;

const byValue = marks => {
  const sorted = marks
    .filter(m => typeof m.value === "number")
    .sort((a, b) => a.value - b.value);
  return {low: sorted[0], high: sorted[sorted.length - 1], sorted};
};

/** Whether two colors match within a few RGB steps (canvas antialiasing). */
const near = (a, b) => {
  const x = rgb(a),
    y = rgb(b);
  return (
    Math.abs(x.r - y.r) <= 3 &&
    Math.abs(x.g - y.g) <= 3 &&
    Math.abs(x.b - y.b) <= 3
  );
};

const SEQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DIV = [-30, -20, -10, -5, -2, 0, 0, 2, 5, 10, 20, 30];

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a dark Matrix heatmap runs dim→bright, with matching swatches`, async () => {
    const out = await render(page(), draw, {
      src: matrix(SEQ),
      renderer,
      theme: "dark",
      config: {colorScaleConfig: {scale: "buckets"}},
    });
    const {low, high, sorted} = byValue(out.marks);
    assert.ok(L(low.fill) < L(high.fill), "lowest mark is darker");
    assert.ok(L(low.fill) > BG, "lowest mark sits above the background");
    assert.ok(L(high.fill) > 0.65, "highest mark is bright");
    assert.strictEqual(hex(high.fill), themeDark.colorScale.max);
    for (const m of [low, high])
      assert.ok(near(m.painted, m.fill), `${m.key} painted ${m.painted}`);
    const fills = [...new Set(sorted.map(m => hex(m.fill)))];
    assert.deepStrictEqual(out.swatches.map(hex), fills, "legend swatches");
  });

  it(`${renderer}: a light Matrix heatmap keeps its pale→dark ramp`, async () => {
    const out = await render(page(), draw, {
      src: matrix(SEQ),
      renderer,
      config: {colorScaleConfig: {scale: "buckets"}},
    });
    const {low, high} = byValue(out.marks);
    assert.ok(L(low.fill) > L(high.fill), "lowest mark is lighter");
    assert.ok(out.swatches.length >= 3, "bucket swatches");
    assert.deepStrictEqual(
      out.swatches.map(hex),
      colorRamp(colorDefaults.sequential, out.swatches.length),
      "the light ramp toward colorDefaults.sequential",
    );
  });

  it(`${renderer}: a dark diverging scale has a dark midpoint`, async () => {
    const out = await render(page(), draw, {
      src: matrix(DIV),
      renderer,
      theme: "dark",
      config: {colorScaleConfig: {scale: "linear"}},
    });
    const {low, high, sorted} = byValue(out.marks);
    const mid = sorted.find(m => m.value === 0);
    assert.ok(L(mid.fill) < BG + 0.15, `midpoint ${mid.fill} is dark`);
    assert.ok(L(low.fill) > L(mid.fill) && L(high.fill) > L(mid.fill));
    assert.ok(near(mid.painted, mid.fill), "painted midpoint");
    // The legend gradient runs bright → dark → bright.
    assert.ok(out.stops && out.stops.length >= 3, "gradient legend");
    const Ls = out.stops.map(L);
    const dip = Math.min(...Ls);
    assert.ok(dip < BG + 0.15, "gradient dips to the dark midpoint");
    assert.ok(Ls[0] > dip + 0.2 && Ls[Ls.length - 1] > dip + 0.2);
  });

  it(`${renderer}: a dark Geomap choropleth keeps no-data regions distinct`, async () => {
    const out = await render(page(), draw, {
      src: geomap,
      renderer,
      theme: "dark",
    });
    const fill = id => out.marks.find(m => m.id === id)?.fill;
    assert.ok(L(fill("a")) < L(fill("c")), "lowest region is darker");
    const missing = fill("d");
    assert.ok(missing, "the no-data region is drawn");
    // A neutral, unlike the lowest bucket's blue tint.
    const a = colorToOklab(fill("a")),
      m = colorToOklab(missing);
    const dE = Math.hypot(a.l - m.l, a.a - m.a, a.b - m.b);
    assert.ok(dE > 0.04, `no-data ${missing} vs lowest ${fill("a")}: ${dE}`);
    assert.ok(colorToOklch(missing).c < 0.02, "no-data is a neutral");
  });

  it(`${renderer}: a custom theme's colorScale.missing fills no-data regions`, async () => {
    const out = await render(page(), draw, {
      src: geomap,
      renderer,
      theme: {base: "dark", colorScale: {missing: "#101010"}},
    });
    const missing = out.marks.find(m => m.id === "d")?.fill;
    assert.strictEqual(hex(missing), "#101010");
  });

  it(`${renderer}: a user colorMax wins on dark`, async () => {
    const out = await render(page(), draw, {
      src: matrix(SEQ),
      renderer,
      theme: "dark",
      config: {colorScaleConfig: {scale: "buckets", colorMax: "#e8590c"}},
    });
    const {low, high} = byValue(out.marks);
    assert.strictEqual(hex(high.fill), "#e8590c");
    assert.ok(L(low.fill) < L(high.fill), "still dim→bright");
  });

  it(`${renderer}: auto on a dark page gets the dark ramp`, async () => {
    const out = await render(page("#212529"), draw, {
      src: matrix(SEQ),
      renderer,
      config: {colorScaleConfig: {scale: "buckets"}},
    });
    const {low, high} = byValue(out.marks);
    assert.ok(L(low.fill) < L(high.fill), "lowest mark is darker");
    assert.strictEqual(hex(high.fill), themeDark.colorScale.max);
  });
}
