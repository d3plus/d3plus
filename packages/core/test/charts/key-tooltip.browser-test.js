import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover} from "./colorScale-page.js";

/**
    A colorScale swatch's (or bivariate key cell's) tooltip opens beside the
    key, on the side away from it: left of a right-hand key, right of a
    left-hand one, below a top key and above a bottom one. It covers none of
    the key's entries, its arrow points at the hovered entry, and it stays
    inside the viewport.
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

const kinds = {
  bivariate: `.colorScale(["a", "b"])`,
  jenks: `.colorScale("a").colorScaleConfig({scale: "jenks"})`,
  buckets: `.colorScale("a").colorScaleConfig({scale: "buckets"})`,
};

const geomap = (kind, position) => `lib => new lib.Geomap()
  .data(${JSON.stringify(rows)})
  .groupBy("id")
  .tiles(false)
  .ocean("transparent")
  .topojson(${JSON.stringify(topojson)})
  ${kinds[kind]}
  .colorScalePosition("${position}")`;

/**
    The client box of every colorScale entry (swatch, cell, or hit area),
    the middle entry's color, and the key's box around them all.
*/
function keyBoxes(page) {
  return page.evaluate(() => {
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    const toClient = ([x, y]) => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      if (svg) {
        const m = svg.getScreenCTM();
        return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      }
      const r = document.querySelector("#viz canvas").getBoundingClientRect();
      return [r.left + x, r.top + y];
    };
    const own = node => {
      if (node.type === "rect")
        return [node.x, node.y, node.x + node.width, node.y + node.height];
      const n = (node.d.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
      const xs = n.filter((_, i) => i % 2 === 0);
      const ys = n.filter((_, i) => i % 2 === 1);
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ];
    };
    const entries = [];
    const walk = (node, chain) => {
      const next = node.transform ? [...chain, node.transform] : chain;
      const d = unwrap(node.datum);
      if (
        (node.type === "rect" || node.type === "path") &&
        d &&
        d._isColorScaleBucket
      ) {
        const b = own(node);
        const map = p =>
          toClient(
            next.reduceRight(
              ([px, py], t) => [
                px * (t.scale ?? 1) + (t.x ?? 0),
                py * (t.scale ?? 1) + (t.y ?? 0),
              ],
              p,
            ),
          );
        const [x0, y0] = map([b[0], b[1]]);
        const [x1, y1] = map([b[2], b[3]]);
        entries.push({
          color: d.color,
          hit: String(node.key).endsWith("::hit"),
          left: x0,
          top: y0,
          right: x1,
          bottom: y1,
        });
      }
      (node.children || []).forEach(c => walk(c, next));
    };
    walk(window.__viz._paintedScene.root, []);
    const key = {
      left: Math.min(...entries.map(e => e.left)),
      top: Math.min(...entries.map(e => e.top)),
      right: Math.max(...entries.map(e => e.right)),
      bottom: Math.max(...entries.map(e => e.bottom)),
    };
    const colors = [...new Set(entries.map(e => e.color))];
    return {entries, key, color: colors[Math.floor(colors.length / 2)]};
  });
}

/** The visible tooltip's box and its arrow's center and turn. */
const tooltipBox = page =>
  page.evaluate(() => {
    const tip = document.querySelector(".d3plus-tooltip");
    if (!tip || getComputedStyle(tip).visibility !== "visible") return null;
    const r = tip.getBoundingClientRect();
    const arrow = tip.querySelector(".d3plus-tooltip-arrow");
    const a = arrow.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      arrow: [(a.left + a.right) / 2, (a.top + a.bottom) / 2],
      turn: arrow.style.transform,
    };
  });

const overlaps = (a, b) =>
  a.left < b.right - 1 &&
  b.left < a.right - 1 &&
  a.top < b.bottom - 1 &&
  b.top < a.bottom - 1;

const SIDES = {
  right: {turn: "rotate(-45deg)", clear: (t, k) => t.right <= k.left + 1},
  left: {turn: "rotate(135deg)", clear: (t, k) => t.left >= k.right - 1},
  top: {turn: "rotate(225deg)", clear: (t, k) => t.top >= k.bottom - 1},
  bottom: {turn: "rotate(45deg)", clear: (t, k) => t.bottom <= k.top + 1},
};

for (const renderer of ["svg", "canvas"]) {
  for (const kind of Object.keys(kinds)) {
    it(`${renderer}: a ${kind} colorScale's tooltip opens beside the key, away from it`, async () => {
      for (const [position, side] of Object.entries(SIDES)) {
        const {page, close} = await chart(geomap(kind, position), renderer);
        try {
          const {entries, key, color} = await keyBoxes(page);
          const swatch = entries.find(e => e.color === color && !e.hit);
          await hover(page, [
            (swatch.left + swatch.right) / 2,
            (swatch.top + swatch.bottom) / 2,
          ]);
          const tip = await tooltipBox(page);
          assert.ok(tip, `${position}: a tooltip shows`);
          const at = `${position} key: ${JSON.stringify({tip, key})}`;
          assert.ok(side.clear(tip, key), `${at} — clear of the key`);
          for (const e of entries)
            assert.ok(!overlaps(tip, e), `${at} — covers ${e.color}`);
          assert.strictEqual(tip.turn, side.turn, `${at} — arrow's turn`);
          // The arrow meets the hovered entry along the key.
          const [ax, ay] = tip.arrow;
          if (position === "left" || position === "right")
            assert.ok(ay >= swatch.top - 1 && ay <= swatch.bottom + 1, at);
          else assert.ok(ax >= swatch.left - 1 && ax <= swatch.right + 1, at);
          // Inside the 1280×720 viewport.
          assert.ok(
            tip.left >= 0 &&
              tip.top >= 0 &&
              tip.right <= 1280 &&
              tip.bottom <= 720,
            `${at} — in the viewport`,
          );
        } finally {
          await close();
        }
      }
    });
  }

  it(`${renderer}: a chart shape's tooltip still opens above the pointer`, async () => {
    const {page, close} = await chart(geomap("jenks", "right"), renderer);
    try {
      const {entries, color} = await keyBoxes(page);
      const swatch = entries.find(e => e.color === color && !e.hit);
      await hover(page, [
        (swatch.left + swatch.right) / 2,
        (swatch.top + swatch.bottom) / 2,
      ]);
      const point = await page.evaluate(() => {
        const r = document.querySelector("#viz").getBoundingClientRect();
        return [r.left + r.width * 0.3, r.top + r.height * 0.5];
      });
      // Find a map shape near the middle of the map.
      const shape = await page.evaluate(([px, py]) => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const canvas = document.querySelector("#viz canvas");
        const origin = svg
          ? (m => [m.e, m.f])(svg.getScreenCTM())
          : (r => [r.left, r.top])(canvas.getBoundingClientRect());
        const pick = window.__viz._sceneRenderer.pick([
          px - origin[0],
          py - origin[1],
        ]);
        return pick ? [px, py] : null;
      }, point);
      assert.ok(shape, "a map shape under the point");
      await hover(page, shape);
      const tip = await tooltipBox(page);
      assert.ok(tip, "a tooltip shows");
      assert.ok(tip.bottom <= shape[1] + 1, "above the pointer");
      assert.strictEqual(tip.turn, "rotate(45deg)");
    } finally {
      await close();
    }
  });
}
