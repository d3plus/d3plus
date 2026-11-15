import {it} from "vitest";
import {pathRings} from "@d3plus/render";

import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import states from "../../dev/charts/Geomap/State.json";
import population from "../../dev/charts/Geomap/state-population.json";

/**
    Geomap's `tileGrid` in Chromium, on SVG and Canvas with a real pointer:
    a labeled hexagon (or square) per state, colored on the colorScale,
    with tooltips; and turning the grid off morphs each tile back into its
    state's outline.
*/

const box = "<div id='viz' style='width:800px;height:520px'></div>";

const CA = "geomap-path-04000US06";

/**
    Runs in the page: draws the states with `config`, and resolves once
    they have painted. The topojson and rows arrive as JSON.
*/
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const {topojson, data, ...config} = JSON.parse(json);
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({
        colorScale: "Population",
        groupBy: "State ID",
        projection: "geoAlbersUsa",
        tileGrid: "us-states",
        tiles: false,
        ...config,
      })
      .label(d => d.State)
      .data(data);
    if (topojson) viz.topojson(topojson);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: each painted node's key, type, `d`, fill, text, and screen position. */
const painted = () => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const out = [];
  const walk = (n, x, y, s) => {
    const t = n.transform || {};
    const k = s * (t.scale ?? 1);
    const nx = x + (t.x || 0) * s,
      ny = y + (t.y || 0) * s;
    out.push({
      key: String(n.key),
      type: n.type,
      d: n.d,
      fill: n.paint?.fill,
      lines: n.lines?.map(l => l.text),
      origin: [rect.left + nx, rect.top + ny],
      scale: k,
    });
    (n.children || []).forEach(c => walk(c, nx, ny, k));
  };
  walk(window.__viz._paintedScene.root, 0, 0, 1);
  return out;
};

/** Runs in the page: the visible tooltip's text. */
const tooltipText = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, " "))
    .join("|");

/** A ring's center. */
const center = ring => [
  ring.reduce((s, p) => s + p[0], 0) / ring.length,
  ring.reduce((s, p) => s + p[1], 0) / ring.length,
];

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: a tile grid draws a labeled hexagon per state, colored, with tooltips`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          data: population.filter(d => d.Abbr !== "TX"),
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const tiles = nodes.filter(n => n.key.startsWith("geomap-path-"));
      assert.strictEqual(tiles.length, 51, "every state and DC");
      tiles.forEach(n =>
        assert.strictEqual(pathRings(n.d)[0].length, 6, `${n.key}: hexagon`),
      );
      const ca = tiles.find(n => n.key === CA);
      const tx = tiles.find(n => n.key === "geomap-path-TX");
      assert.ok(tx, "Texas has a tile without data, keyed by its cell");
      assert.notStrictEqual(ca.fill, tx.fill, "no-data fill");
      const label = nodes.find(
        n =>
          n.type === "text" &&
          n.key.startsWith("geomap-cartogram-label-04000US06"),
      );
      assert.deepStrictEqual(label.lines, ["CA"], "the abbreviation");
      assert.ok(
        nodes.some(n => n.key.includes("colorScale")),
        "the colorScale",
      );
      const [cx, cy] = center(pathRings(ca.d)[0]);
      const x = ca.origin[0] + cx * ca.scale,
        y = ca.origin[1] + cy * ca.scale;
      await page.mouse.move(x - 4, y - 4);
      await page.mouse.move(x, y, {steps: 3});
      await new Promise(r => setTimeout(r, 400));
      const tip = await page.evaluate(tooltipText);
      assert.ok(tip.includes("California"), `tooltip: ${tip}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: square tiles sit in a grid without overlapping`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({data: population, tileGridShape: "square"}),
        renderer,
      ]);
      const boxes = (await page.evaluate(painted))
        .filter(n => n.key.startsWith("geomap-path-"))
        .map(n => {
          const ring = pathRings(n.d)[0];
          assert.strictEqual(ring.length, 4, `${n.key}: four corners`);
          const xs = ring.map(p => p[0]),
            ys = ring.map(p => p[1]);
          return [
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys),
          ];
        });
      assert.strictEqual(boxes.length, 51);
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i],
            b = boxes[j];
          const overlap = Math.min(
            a[2] - b[0],
            b[2] - a[0],
            a[3] - b[1],
            b[3] - a[1],
          );
          assert.ok(overlap <= 0.01, `squares ${i} and ${j} overlap`);
        }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: turning the tile grid off morphs each tile back into its outline`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: population}),
        renderer,
      ]);
      const before = (await page.evaluate(painted)).find(n => n.key === CA).d;
      assert.strictEqual(pathRings(before)[0].length, 6, "a hexagon");
      const mid = await page.evaluate(
        ([key, svg]) =>
          new Promise(resolve => {
            window.__viz.duration(800).tileGrid(false).render();
            setTimeout(() => {
              const el = svg
                ? document.querySelector(`#viz path[data-key="${key}"]`)
                : null;
              resolve(el ? el.getAttribute("d") : null);
            }, 300);
          }),
        [CA, renderer === "svg"],
      );
      await new Promise(r => setTimeout(r, 900));
      const after = (await page.evaluate(painted)).find(n => n.key === CA).d;
      const outline = await page.evaluate(() => {
        const c = window.__viz.ctx.geomapCtx;
        return c.pathFn(c.topoData.find(d => d.id === "04000US06"));
      });
      assert.strictEqual(after, outline, "ends on the outline");
      if (renderer === "svg") {
        assert.ok(mid !== before && mid !== after, "mid-morph");
        assert.ok(pathRings(mid), "a polygon throughout");
      }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`TileGridMap ${renderer}: draws the US states grid with no tileGrid set`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(
        ([json, kind]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.TileGridMap()
              .select("#viz")
              .renderer(kind)
              .duration(0)
              .config({colorScale: "Population", groupBy: "State ID"})
              .label(d => d.State)
              .data(JSON.parse(json));
            window.__viz = viz;
            viz.render(() => resolve(true));
          }),
        [JSON.stringify(population), renderer],
      );
      const nodes = await page.evaluate(painted);
      const tiles = nodes.filter(n => n.key.startsWith("geomap-path-"));
      assert.strictEqual(tiles.length, 51);
      tiles.forEach(n => assert.strictEqual(pathRings(n.d)[0].length, 6));
      const labels = nodes.filter(
        n => n.type === "text" && n.key.startsWith("geomap-cartogram-label-"),
      );
      assert.ok(labels.length > 40, "labeled");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
