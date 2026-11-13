import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf} from "./colorScale-page.js";

/**
    Moving the pointer from one colorScale swatch (or bivariate key cell) to
    the next lights the next one's shapes, on a chart that dims nothing on a
    shape hover (Geomap) as on one that does (Treemap). The gap between two
    swatches keeps the last one lit until the pointer reaches the next, and
    leaving the swatches clears it.
*/

const rows = [
  {id: "a1", a: 1, b: 1},
  {id: "a2", a: 2, b: 5},
  {id: "a3", a: 3, b: 9},
  {id: "a4", a: 4, b: 2},
  {id: "a5", a: 5, b: 6},
  {id: "a6", a: 6, b: 7},
  {id: "a7", a: 7, b: 3},
  {id: "a8", a: 8, b: 4},
  {id: "a9", a: 9, b: 8},
];

/** A 5×2 grid of square regions, one per row id. */
const topojson = {
  type: "Topology",
  objects: {
    geo: {
      type: "GeometryCollection",
      geometries: rows.map((d, k) => ({
        type: "Polygon",
        id: d.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: rows.map((d, k) => {
    const x = (k % 5) * 12;
    const y = Math.floor(k / 5) * 12;
    return [
      [x, y],
      [x, y + 10],
      [x + 10, y + 10],
      [x + 10, y],
      [x, y],
    ];
  }),
};

const charts = {
  Geomap: `new lib.Geomap()
    .data(${JSON.stringify(rows)})
    .groupBy("id")
    .colorScalePosition("right")
    .tiles(false)
    .ocean("transparent")
    .topojson(${JSON.stringify(topojson)})`,
  Treemap: `new lib.Treemap()
    .data(${JSON.stringify(rows.map((d, i) => ({...d, size: 10 + i})))})
    .sum("size")
    .colorScalePosition("right")`,
};

const bivariate = name => `lib => ${charts[name]}.colorScale(["a", "b"])`;
const swatches = name =>
  `lib => ${charts[name]}.colorScale("a").colorScaleConfig({scale: "jenks"})`;

/**
    The data shapes (by row id) with their fill and painted opacity, and the
    swatch colors in the order they're drawn.
*/
function painted(page) {
  return page.evaluate(() => {
    const shapes = {};
    const colors = [];
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    const walk = (node, opacity) => {
      const own = opacity * (node.paint?.opacity ?? 1);
      const d = unwrap(node.datum);
      if (
        d &&
        node.type !== "group" &&
        node.type !== "text" &&
        !String(node.key).endsWith("::hit")
      ) {
        if (d._isColorScaleBucket) {
          if (!colors.includes(d.color)) colors.push(d.color);
        } else if (typeof d.id === "string" && !node.interactionGroup)
          shapes[d.id] = {fill: node.paint?.fill, opacity: own};
      }
      (node.children || []).forEach(c => walk(c, own));
    };
    walk(window.__viz._paintedScene.root, 1);
    return {shapes, colors};
  });
}

/** The ids of the shapes painted at full opacity, sorted. */
const lit = shapes =>
  Object.keys(shapes)
    .filter(id => shapes[id].opacity === 1)
    .sort();

/** The ids of the shapes filled with `color`, sorted. */
const filled = (shapes, color) =>
  Object.keys(shapes)
    .filter(id => shapes[id].fill === color)
    .sort();

/** The node matcher for the swatch (or key cell) of `color`. */
const swatch = color =>
  `n => n.type !== "text" && !String(n.key).endsWith("::hit") && (n => { while (n && n.__d3plus__ && n.data) n = n.data; return n && n._isColorScaleBucket && n.color === ${JSON.stringify(color)}; })(n.datum)`;

/** Moves the real mouse to `point` in small steps and waits for the repaint. */
async function glide(page, point) {
  await page.mouse.move(point[0], point[1], {steps: 20});
  await page.waitForTimeout(150);
}

for (const renderer of ["svg", "canvas"]) {
  for (const name of Object.keys(charts)) {
    it(`${renderer}: ${name} — moving between bivariate key cells lights the next cell's shapes`, async () => {
      const {page, close} = await chart(bivariate(name), renderer);
      try {
        const {shapes, colors} = await painted(page);
        // The low/low cell, then its neighbor along the first variable.
        const [a, b] = [colors[0], colors[1]];
        assert.ok(filled(shapes, a).length && filled(shapes, b).length);
        await hover(page, await pointOf(page, swatch(a)));
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, a),
        );
        await glide(page, await pointOf(page, swatch(b)));
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, b),
          "the next cell's shapes",
        );
        // Back again, the way the pointer came.
        await glide(page, await pointOf(page, swatch(a)));
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, a),
        );
      } finally {
        await close();
      }
    });

    it(`${renderer}: ${name} — the gap between swatches keeps the last one lit`, async () => {
      const {page, close} = await chart(swatches(name), renderer);
      try {
        const {shapes, colors} = await painted(page);
        const [a, b] = [colors[0], colors[1]];
        const pa = await pointOf(page, swatch(a));
        const pb = await pointOf(page, swatch(b));
        await hover(page, pa);
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, a),
        );
        // Halfway between the two swatches: over neither.
        await glide(page, [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]);
        assert.strictEqual(
          await page.evaluate(() => window.__viz._lastScenePick),
          null,
          "the pointer is in the gap",
        );
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, a),
          "the last swatch stays lit",
        );
        await glide(page, pb);
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          filled(shapes, b),
          "the next swatch lights",
        );
        // Back into the gap, then out of the chart.
        await glide(page, [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]);
        await glide(page, [pb[0] + 400, 600]);
        assert.deepStrictEqual(
          lit((await painted(page)).shapes),
          Object.keys(shapes).sort(),
          "leaving the chart clears it",
        );
        // From the gap into the chart area.
        await hover(page, pa);
        await glide(page, [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]);
        await glide(page, [(pa[0] + pb[0]) / 2 - 200, (pa[1] + pb[1]) / 2]);
        assert.deepStrictEqual(
          await page.evaluate(() => [
            window.__viz._bucketHold,
            window.__viz._hoverBucket,
          ]),
          [undefined, false],
          "leaving the swatches clears it",
        );
        // Geomap dims nothing for the map shape now under the pointer.
        if (name === "Geomap")
          assert.deepStrictEqual(
            lit((await painted(page)).shapes),
            Object.keys(shapes).sort(),
          );
      } finally {
        await close();
      }
    });
  }

  it(`${renderer}: Treemap — moving between legend entries lights the next entry`, async () => {
    const {page, close} = await chart(
      `lib => ${charts.Treemap}.legend(true)`,
      renderer,
    );
    try {
      const entry = id =>
        `n => n.type !== "text" && n.interactionGroup === "legend" && String(n.key) === "${id}_1_"`;
      await hover(page, await pointOf(page, entry("a1")));
      assert.deepStrictEqual(lit((await painted(page)).shapes), ["a1"]);
      await glide(page, await pointOf(page, entry("a2")));
      assert.deepStrictEqual(lit((await painted(page)).shapes), ["a2"]);
    } finally {
      await close();
    }
  });
}
