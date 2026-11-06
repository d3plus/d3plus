import {it} from "vitest";
import {pathTextBoxes, samplePath} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Stacked area labels along their bands in a real browser, on both
    renderers: each series' name lies inside its own band, a band too thin
    for its name goes unlabeled, the text reads upright (on a reversed axis
    too) in a color that contrasts with its band, it dims with its band on
    hover, and Streamgraph labels its streams this way by default. Wiggle
    streams, small multiples, the dark theme, and reduced motion keep them.
*/

const draw = config =>
  new Promise(resolve => {
    const {
      chart = "StackedArea",
      renderer,
      thin,
      reversed,
      hover,
      facet,
      defaultLegend,
      colorScale,
      ...rest
    } = config;
    const names = ["Rock", "Pop", "Jazz", "Folk", "Soul"];
    const data = [];
    for (const region of facet ? ["East", "West"] : ["East"])
      names.forEach((genre, g) => {
        for (let year = 2000; year <= 2016; year++) {
          const t = year - 2000;
          const sales =
            thin && genre === "Folk"
              ? 0.3
              : 12 + g * 3 + 5 * Math.sin(t / (2 + g * 0.6) + g);
          data.push({region, genre, year, sales});
        }
      });
    const viz = new window.d3plus[chart]()
      .data(data)
      .groupBy("genre")
      .x("year")
      .y("sales")
      .renderer(renderer)
      .duration(0)
      .config(rest)
      .select("#viz");
    if (!defaultLegend) viz.legend(false);
    if (colorScale) viz.colorScale("sales");
    if (facet) viz.facet("region");
    if (config.discrete === "y") viz.x("sales").y("year");
    if (reversed) viz.xConfig({reverse: true});
    viz.render(() => {
      if (hover) viz.hover(d => d.genre === hover);
      const nodes = [];
      const walk = (n, ox, oy) => {
        const x = ox + (n.transform?.x ?? 0),
          y = oy + (n.transform?.y ?? 0);
        nodes.push({n, x, y});
        (n.children || []).forEach(c => walk(c, x, y));
      };
      walk(viz.toScene().root, 0, 0);
      const labels = nodes.filter(({n}) =>
        `${n.key}`.includes("area-label-along-"),
      );
      const areas = nodes.filter(
        ({n}) => n.type === "path" && n.shapeType === "Area" && n.datum,
      );
      const opacity = n => n.paint?.opacity ?? 1;
      resolve({
        labels: labels.map(({n, x, y}) => ({
          key: `${n.key}`,
          text: n.lines.map(l => l.text).join(" "),
          fill: n.paint.fill,
          opacity: opacity(n),
          interactive: n.interactive,
          size: n.font.size,
          points: samplePath(n.path.d).points.map(([px, py]) => [
            px + x,
            py + y,
          ]),
          boxes: pathTextBoxes(n).map(b => ({...b, x: b.x + x, y: b.y + y})),
        })),
        areas: areas.map(({n, x, y}) => ({
          key: `${n.key}`,
          fill: n.paint.fill,
          opacity: opacity(n),
          outline: samplePath(n.d).points.map(([px, py]) => [px + x, py + y]),
        })),
        boxTexts: nodes
          .filter(
            ({n}) =>
              n.type === "text" &&
              names.some(name => `${n.key}`.startsWith(`${name}_`)) &&
              !`${n.key}`.includes("area-label"),
          )
          .map(({n}) => n.lines.map(l => l.text).join(" ")),
        legend:
          nodes.some(({n}) => n.key === "viz-legend") &&
          (viz._legendClass._lineData || []).length > 0,
        colorScale: nodes.some(({n}) => `${n.key}`.includes("colorScale")),
      });
    });
  });

/** Whether `p` is inside the polygon, or within `tol` pixels of its edge. */
const inside = ([px, py], poly, tol = 1) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  if (hit) return true;
  return poly.some(([x, y]) => Math.hypot(px - x, py - y) <= tol);
};

/** The relative luminance of a `#rrggbb` or `rgb()` color. */
const luminance = c => {
  const hex = c.startsWith("#")
    ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
    : c.match(/\d+/g).slice(0, 3).map(Number);
  const [r, g, b] = hex.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The text colors a label on a band chooses between (`colorDefaults`). */
const INKS = ["#495057", "#f8f9fa"];

/** The band a label names (keys carry a facet panel's prefix). */
const bandOf = (out, label) =>
  out.areas.find(a => label.key.replace("area-label-along-", "") === a.key);

/** Every glyph box's middle, top, and bottom edge lie in the label's band. */
const assertInBand = (out, label) => {
  const band = bandOf(out, label);
  assert.ok(band, `${label.key} has its band`);
  for (const b of label.boxes) {
    const rad = (b.angle * Math.PI) / 180;
    const nx = Math.sin(rad) * (b.height / 2),
      ny = -Math.cos(rad) * (b.height / 2);
    for (const p of [
      [b.x, b.y],
      [b.x + nx, b.y + ny],
      [b.x - nx, b.y - ny],
    ])
      assert.ok(
        inside(p, band.outline),
        `${label.text} at ${p.map(Math.round)} is inside its band`,
      );
  }
};

const page = '<div id="viz" style="width:800px;height:420px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`area labels lie inside their bands, upright and inert (${renderer})`, async () => {
    const out = await render(page, draw, {renderer});
    assert.strictEqual(out.labels.length, 5, "every band is labeled");
    assert.deepStrictEqual(out.boxTexts, [], "no box labels");
    for (const label of out.labels) {
      assert.strictEqual(label.interactive, false);
      assertInBand(out, label);
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], `${label.text} reads left to right`);
    }
  });

  it(`a band too thin for its name goes unlabeled (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, thin: true});
    const texts = out.labels.map(l => l.text).sort();
    assert.deepStrictEqual(texts, ["Jazz", "Pop", "Rock", "Soul"]);
    for (const label of out.labels) assertInBand(out, label);
  });

  it(`area label text contrasts with its band, light and dark (${renderer})`, async () => {
    for (const theme of ["light", "dark"]) {
      const out = await render(page, draw, {renderer, theme});
      assert.strictEqual(out.labels.length, 5);
      for (const label of out.labels) {
        const band = bandOf(out, label);
        assert.ok(INKS.includes(label.fill), `${label.fill} is a text ink`);
        const other = INKS.find(c => c !== label.fill);
        assert.ok(
          contrast(label.fill, band.fill) >= contrast(other, band.fill),
          `${label.text} (${label.fill} on ${band.fill})`,
        );
      }
    }
  });

  it(`area labels read upright on a reversed axis, and in wiggle streams (${renderer})`, async () => {
    const reversed = await render(page, draw, {renderer, reversed: true});
    assert.strictEqual(reversed.labels.length, 5);
    for (const label of reversed.labels) {
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], `${label.text} reads left to right`);
      assertInBand(reversed, label);
    }
    const wiggle = await render(page, draw, {
      renderer,
      chart: "Streamgraph",
      stackOffset: "wiggle",
    });
    assert.strictEqual(wiggle.labels.length, 5);
    for (const label of wiggle.labels) assertInBand(wiggle, label);
  });

  it(`horizontal bands read bottom to top near upright (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, discrete: "y"});
    assert.strictEqual(out.labels.length, 5);
    for (const label of out.labels) {
      assertInBand(out, label);
      const [x0, y0] = label.points[0];
      const [x1, y1] = label.points[label.points.length - 1];
      if (Math.abs(x1 - x0) < Math.abs(y1 - y0) * 0.46)
        assert.ok(y1 < y0, `${label.text} reads bottom to top`);
      else assert.ok(x0 < x1, `${label.text} reads left to right`);
    }
  });

  it(`area labels dim with their band on hover (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, hover: "Rock"});
    const rock = out.labels.find(l => l.text === "Rock");
    assert.ok(rock);
    assert.strictEqual(rock.opacity, 1, "the hovered band's label stays");
    for (const label of out.labels.filter(l => l !== rock)) {
      assert.ok(label.opacity < 1, `${label.text} dims`);
      assert.strictEqual(label.opacity, bandOf(out, label).opacity);
    }
  });

  it(`Streamgraph labels its streams along them by default (${renderer})`, async () => {
    const stream = await render(page, draw, {renderer, chart: "Streamgraph"});
    assert.strictEqual(stream.labels.length, 5);
    for (const label of stream.labels) assertInBand(stream, label);
    const boxed = await render(page, draw, {
      renderer,
      chart: "Streamgraph",
      labelPosition: "inside",
    });
    assert.strictEqual(boxed.labels.length, 0, "inside keeps box labels");
    assert.ok(boxed.boxTexts.length > 0);
    const off = await render(page, draw, {
      renderer,
      chart: "Streamgraph",
      shapeConfig: {Area: {label: false}},
    });
    assert.strictEqual(off.labels.length, 0, "label: false turns them off");
  });

  it(`the default legend hides when every band is named (${renderer})`, async () => {
    const all = await render(page, draw, {
      renderer,
      chart: "Streamgraph",
      defaultLegend: true,
    });
    assert.strictEqual(all.labels.length, 5);
    assert.ok(!all.legend, "no legend");
    const thin = await render(page, draw, {
      renderer,
      thin: true,
      defaultLegend: true,
    });
    assert.strictEqual(thin.labels.length, 4);
    assert.ok(thin.legend, "a band without a name keeps the legend");
    const own = await render(page, draw, {
      renderer,
      chart: "Streamgraph",
      defaultLegend: true,
      legend: true,
    });
    assert.strictEqual(own.labels.length, 5);
    assert.ok(own.legend, "legend: true wins");
    const boxed = await render(page, draw, {
      renderer,
      defaultLegend: true,
      labelPosition: "inside",
    });
    assert.ok(boxed.legend, "box labels keep the legend");
    const faceted = await render(page, draw, {
      renderer,
      facet: true,
      defaultLegend: true,
    });
    assert.strictEqual(faceted.labels.length, 10);
    assert.ok(!faceted.legend, "every panel's bands are named");
  });

  it(`a colorScale stays while the named bands hide the legend (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      defaultLegend: true,
      colorScale: true,
    });
    assert.strictEqual(out.labels.length, 5);
    assert.ok(!out.legend);
    assert.ok(out.colorScale, "the colorScale draws");
  });

  it(`a user's fontColor wins over the contrast (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      shapeConfig: {Area: {labelConfig: {fontColor: "rgb(255, 0, 0)"}}},
    });
    assert.strictEqual(out.labels.length, 5);
    for (const label of out.labels)
      assert.strictEqual(label.fill, "rgb(255, 0, 0)");
  });

  it(`area labels follow each small multiple, with reduced motion (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      facet: true,
      reducedMotion: true,
      duration: 600,
    });
    assert.ok(out.labels.length >= 8, `${out.labels.length} labels`);
    for (const label of out.labels) assertInBand(out, label);
  });
}
