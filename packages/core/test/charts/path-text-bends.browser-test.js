import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {
  lineLeft,
  pathGlyphs,
  placeGlyphs,
  textPathSamples,
} from "@d3plus/render";

/**
    Text along a path at sharp bends, in Chromium on SVG and Canvas: a trend
    label near a kink at its line's end, line labels along zig-zag lines, and
    stacked area labels along zig-zag bands each run where their letters can
    follow the path, so no two neighboring glyphs' inked boxes overlap or
    touch (as they do where the text bunches on the inside of a kink). The
    texts avoid kerned pairs (such as "Av"), whose boxes overlap even on a
    straight line. Eight jagged daily series, spiking sharply, name every
    line on a stretch no steeper than 45°, never up a spike.
*/

const box = "<div id='viz' style='width:640px;height:360px'></div>";

/** The corners of a glyph's inked box: `ink` around its origin, turned by `angle` about it. */
const corners = ({x, y, angle, ink}) => {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [
    [ink.left, ink.top],
    [ink.right, ink.top],
    [ink.right, ink.bottom],
    [ink.left, ink.bottom],
  ].map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]);
};

/** The gap between two convex quads along the axis that parts them most (negative where they overlap). */
const gap = (a, b) => {
  let best = -Infinity;
  for (const quad of [a, b])
    for (let k = 0; k < 4; k++) {
      const [x0, y0] = quad[k];
      const [x1, y1] = quad[(k + 1) % 4];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = (y1 - y0) / len,
        ny = (x0 - x1) / len;
      const pa = a.map(([x, y]) => x * nx + y * ny);
      const pb = b.map(([x, y]) => x * nx + y * ny);
      best = Math.max(
        best,
        Math.min(...pb) - Math.max(...pa),
        Math.min(...pa) - Math.max(...pb),
      );
    }
  return best;
};

/** The inked extent of a glyph drawn in `font` with its origin where `align` puts it. */
const inkOf = (ctx, text, font, align) => {
  ctx.font = font;
  ctx.textAlign = align;
  const m = ctx.measureText(text);
  return {
    left: -m.actualBoundingBoxLeft,
    right: m.actualBoundingBoxRight,
    top: -m.actualBoundingBoxAscent,
    bottom: m.actualBoundingBoxDescent,
  };
};

/** The glyphs of every SVG text along a path, as the browser laid them out. */
function svgLabels(ctx) {
  return [...document.querySelectorAll("#viz text")]
    .filter(text => text.querySelector("textPath"))
    .map(text => {
      const font = getComputedStyle(text).font;
      const chars = text.querySelector("textPath").textContent;
      const glyphs = [];
      for (let i = 0; i < text.getNumberOfChars(); i++) {
        if (!chars[i]?.trim()) continue;
        const p = text.getStartPositionOfChar(i);
        glyphs.push({
          text: chars[i],
          x: p.x,
          y: p.y,
          angle: (text.getRotationOfChar(i) * Math.PI) / 180,
          ink: inkOf(ctx, chars[i], font, "left"),
        });
      }
      return {text: chars, glyphs};
    });
}

/** The glyphs of every scene text along a path, placed as the Canvas renderer paints them. */
function canvasLabels(ctx, root) {
  const out = [];
  const walk = node => {
    if (node.type === "group") node.children.forEach(walk);
    if (node.type !== "text" || !node.path || !node.lines[0]) return;
    const f = node.font || {};
    const font = `${f.style ?? "normal"} ${f.weight ?? "normal"} ${f.size ?? 12}px ${f.family ?? "sans-serif"}`;
    const line = node.lines[0];
    const measure = text => {
      ctx.font = font;
      return ctx.measureText(text).width;
    };
    const placed = placeGlyphs(
      textPathSamples(node.path),
      lineLeft(line, node.font),
      pathGlyphs([{text: line.text, font}], f.dir === "rtl", measure),
    );
    out.push({
      text: line.text,
      glyphs: placed.map(g => ({
        ...g,
        ink: inkOf(ctx, g.text, font, "center"),
      })),
    });
  };
  walk(root);
  return out;
}

/**
    Runs in the page: draws a chart, then reads each label along a path's
    glyphs and the narrowest gap between two neighbors' inked boxes.
*/
const draw = ([renderer, chart]) =>
  new Promise(resolve => {
    const d3plus = window.d3plus;
    let viz;
    if (chart === "trend") {
      // A long fall, then a short, sharp climb at the end.
      const data = Array.from({length: 41}, (_, x) => ({
        id: "A",
        x,
        y: x <= 37 ? 60 - x : 23 + (x - 37) * 3,
      }));
      viz = new d3plus.LinePlot()
        .data(data)
        .groupBy("id")
        .shapeConfig({Line: {curve: "linear"}})
        .trendLine("movingAverage")
        .trendLineConfig({
          window: 2,
          bands: false,
          label: () => "Rolling mean",
        });
    } else if (chart === "lines") {
      const data = [];
      for (let x = 0; x < 9; x++) {
        data.push({id: "Northern Region", x, y: 40 + (x % 2 ? 1.5 : -1.5)});
        data.push({id: "Southern Region", x, y: 10 + (x % 2 ? -1.5 : 1.5)});
      }
      viz = new d3plus.LinePlot()
        .data(data)
        .groupBy("id")
        .shapeConfig({Line: {curve: "linear"}})
        .lineLabels("along");
    } else {
      const data = [];
      for (let x = 0; x < 12; x++) {
        data.push({id: "Consumer Durables", x, y: 30 + (x % 2 ? 14 : 0)});
        data.push({id: "Home and Garden", x, y: 25 + (x % 3 ? 0 : 12)});
      }
      viz = new d3plus.StackedArea()
        .data(data)
        .groupBy("id")
        .shapeConfig({Area: {curve: "linear"}})
        .legend(false);
    }
    viz
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .x("x")
      .y("y")
      .render(() => {
        const ctx = document.createElement("canvas").getContext("2d");
        const labels =
          renderer === "svg"
            ? svgLabels(ctx)
            : canvasLabels(ctx, viz._paintedScene.root);
        resolve(
          labels.map(({text, glyphs}) => {
            let narrowest = Infinity,
              at = "";
            for (let k = 1; k < glyphs.length; k++) {
              const g = gap(corners(glyphs[k - 1]), corners(glyphs[k]));
              if (g < narrowest) {
                narrowest = g;
                at = glyphs[k - 1].text + glyphs[k].text;
              }
            }
            return {text, glyphs: glyphs.length, narrowest, at};
          }),
        );
      });
  });

const expected = {
  trend: ["Rolling mean"],
  lines: ["Southern Region"],
  area: ["Home and Garden", "Consumer Durables"],
};

for (const renderer of ["svg", "canvas"])
  for (const chart of ["trend", "lines", "area"])
    it(`${chart} ${renderer}: no two neighboring glyphs along a bend overlap or touch`, async () => {
      const labels = await render(box, draw, [renderer, chart]);
      const texts = [...new Set(labels.map(l => l.text))];
      for (const text of expected[chart])
        assert.ok(texts.includes(text), `"${text}" drawn whole: ${texts}`);
      for (const label of labels) {
        assert.ok(label.glyphs > 3, `${label.text}'s glyphs`);
        assert.ok(
          label.narrowest > 0,
          `"${label.text}": "${label.at}" ${label.narrowest.toFixed(2)}px apart`,
        );
      }
    });

const cities = [
  "Atlanta",
  "Boston",
  "Chicago",
  "Denver",
  "El Paso",
  "Fresno",
  "Houston",
  "Memphis",
];

/**
    Runs in the page: eight jagged daily series a year long, each with
    sharp spikes, 1440px wide, and each along label's text and how steeply
    its path climbs or falls from end to end, in degrees.
*/
const drawDense = renderer =>
  new Promise(resolve => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const data = [];
    [
      "Atlanta",
      "Boston",
      "Chicago",
      "Denver",
      "El Paso",
      "Fresno",
      "Houston",
      "Memphis",
    ].forEach((city, s) => {
      let value = 40 + s * 12;
      for (let day = 0; day < 366; day++) {
        value += (rand() - 0.5) * 1.5;
        const spike = rand() < 0.04 ? (rand() - 0.3) * 60 : 0;
        data.push({city, day, value: value + spike});
      }
    });
    const viz = new window.d3plus.LinePlot()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(data)
      .groupBy("city")
      .x("day")
      .y("value")
      .lineLabels("along");
    viz.render(() => {
      const labels = [];
      const walk = node => {
        if (node.type === "group") node.children.forEach(walk);
        if (node.type !== "text" || !node.path) return;
        if (!/^line-label-along-/.test(`${node.key}`)) return;
        const pts = [...node.path.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)];
        const [, x0, y0] = pts[0];
        const [, x1, y1] = pts[pts.length - 1];
        const slope = Math.atan2(Math.abs(y1 - y0), Math.abs(x1 - x0));
        labels.push({text: node.lines[0].text, slope: (slope * 180) / Math.PI});
      };
      walk(viz._paintedScene.root);
      resolve(labels);
    });
  });

const wide = "<div id='viz' style='width:1440px;height:600px'></div>";

for (const renderer of ["svg", "canvas"])
  it(`dense daily lines ${renderer}: along labels run no steeper than 45°, never up a spike`, async () => {
    const labels = await render(wide, drawDense, renderer);
    const named = [...new Set(labels.map(l => l.text))].sort();
    assert.deepStrictEqual(named, cities, "every series named");
    for (const label of labels)
      assert.ok(
        label.slope <= 45,
        `${label.text} climbs ${label.slope.toFixed(0)}°`,
      );
  });
