import {it} from "vitest";
import {pathRings} from "@d3plus/render";

import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import states from "../../dev/charts/Geomap/State.json";
import population from "../../dev/charts/Geomap/state-population.json";

/**
    Geomap's `cartogram` in Chromium, on SVG and Canvas with a real
    pointer: Dorling circles and Demers squares in place of the states,
    labeled inside, without points, links, or tiles; a hover shows the
    state's tooltip; turning the cartogram off morphs each circle back
    into its outline; and small multiples size every panel alike.
*/

const box = "<div id='viz' style='width:800px;height:520px'></div>";

const CA = "geomap-path-04000US06";
const NY = "geomap-path-04000US36";

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
        legend: false,
        projection: "geoAlbersUsa",
        ...config,
      })
      .label(d => d.State)
      .point(d => d.point)
      .data(data)
      .topojson(topojson);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: each painted node's key, type, `d`, and screen position, in paint order. */
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

/** A ring's center and its points' smallest and largest distance from it. */
function ringShape(ring) {
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const ds = ring.map(p => Math.hypot(p[0] - cx, p[1] - cy));
  return {cx, cy, min: Math.min(...ds), max: Math.max(...ds)};
}

const config = (extra = {}) =>
  JSON.stringify({
    topojson: states,
    data: [
      ...population,
      {"State ID": "pt", State: "A point", point: [-100, 40], Population: 1},
    ],
    links: [{source: "04000US06", target: "04000US48"}],
    ...extra,
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: a Dorling cartogram draws a labeled circle per state, a link between circles, a size legend, and no points or tiles`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        config({cartogram: "dorling", tiles: true}),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const shapes = nodes.filter(n => n.key.startsWith("geomap-path-"));
      assert.strictEqual(shapes.length, population.length, "one per state");
      for (const n of shapes) {
        const rings = pathRings(n.d);
        assert.strictEqual(rings.length, 1, `${n.key}: one ring`);
        const {min, max} = ringShape(rings[0]);
        assert.ok(max - min < 0.01, `${n.key}: a circle`);
      }
      assert.ok(
        !nodes.some(n => n.key.startsWith("geomap-point-")),
        "no points",
      );
      const link = nodes.find(
        n => n.key === "geomap-link-04000US06-04000US48-0",
      );
      assert.ok(link, "the link between California and Texas");
      const ends = link.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
      const circle = key =>
        ringShape(pathRings(nodes.find(n => n.key === key).d)[0]);
      const ca = circle(CA),
        tx = circle("geomap-path-04000US48");
      const off = (x, y, c) => Math.hypot(x - c.cx, y - c.cy) - c.max;
      assert.ok(
        Math.abs(off(ends[0], ends[1], ca)) < 3,
        "leaves California's outline",
      );
      assert.ok(
        Math.abs(off(ends.at(-2), ends.at(-1), tx)) < 3,
        "reaches Texas's outline",
      );
      assert.ok(
        nodes.some(n => n.type === "circle" && n.key.startsWith("circle-")),
        "a size legend of nested circles",
      );
      const label = nodes.find(n =>
        n.key.startsWith("geomap-cartogram-label-04000US06"),
      );
      assert.ok(label && label.lines.join(" ").includes("Cali"), "labeled");
      const tiles = await page.evaluate(() => ({
        images: document.querySelectorAll("image.d3plus-geomap-tile").length,
        list: window.__viz._computeTileList().length,
        attribution: window.__viz.attribution(),
      }));
      assert.deepStrictEqual(tiles, {images: 0, list: 0, attribution: ""});
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: hovering a cartogram circle shows its state's tooltip`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [config({cartogram: "dorling"}), renderer]);
      const nodes = await page.evaluate(painted);
      const ca = nodes.find(n => n.key === CA);
      const {cx, cy} = ringShape(pathRings(ca.d)[0]);
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

  it(`Geomap ${renderer}: a Demers cartogram draws squares that don't overlap`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [config({cartogram: "demers"}), renderer]);
      const nodes = await page.evaluate(painted);
      const boxes = nodes
        .filter(n => n.key.startsWith("geomap-path-"))
        .map(n => {
          const ring = pathRings(n.d)[0];
          assert.strictEqual(ring.length, 4, `${n.key}: four corners`);
          const xs = ring.map(p => p[0]),
            ys = ring.map(p => p[1]);
          const b = [
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys),
          ];
          assert.ok(
            Math.abs(b[2] - b[0] - (b[3] - b[1])) < 0.01,
            `${n.key}: square`,
          );
          return b;
        });
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
          assert.ok(
            overlap <= 0.01,
            `squares ${i} and ${j} overlap by ${overlap}`,
          );
        }
      assert.ok(
        nodes.some(n => n.type === "rect" && n.key.startsWith("square-")),
        "a size legend of nested squares",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: turning the cartogram off morphs each circle back into its outline`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [config({cartogram: "dorling"}), renderer]);
      const before = (await page.evaluate(painted)).find(n => n.key === CA).d;
      const mid = await page.evaluate(
        ([key, svg]) =>
          new Promise(resolve => {
            const viz = window.__viz;
            viz.duration(800).cartogram(false).render();
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
      const nodes = await page.evaluate(painted);
      const after = nodes.find(n => n.key === CA).d;
      const outline = await page.evaluate(() => {
        const c = window.__viz.ctx.geomapCtx;
        return c.pathFn(c.topoData.find(d => d.id === "04000US06"));
      });
      assert.strictEqual(after, outline, "ends on the outline");
      assert.notStrictEqual(after, before);
      assert.ok(
        nodes.some(n => n.key === "geomap-path-04000US02"),
        "every state is drawn again",
      );
      if (renderer === "svg") {
        assert.ok(mid !== before && mid !== after, "mid-morph");
        assert.ok(pathRings(mid), "a polygon throughout");
      }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: small multiples size every panel's cartogram against one total`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const data = [
        ...population.map(d => ({...d, g: "full"})),
        ...population.map(d => ({
          ...d,
          g: "quarter",
          Population: d.Population / 4,
        })),
      ];
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data,
          cartogram: "dorling",
          facet: "g",
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const radius = key => {
        const n = nodes.find(m => m.key === key);
        return ringShape(pathRings(n.d)[0]).max;
      };
      const ratio = radius(`facet-quarter/${NY}`) / radius(`facet-full/${NY}`);
      assert.ok(
        Math.abs(ratio - 0.5) < 0.05,
        `a quarter the value, half the radius (${ratio})`,
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: a contiguous cartogram stretches the states, keeping their outlines' points, with links between their centers and no size legend`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [config({cartogram: "dorling"}), renderer]);
      await page.evaluate(
        () =>
          new Promise(resolve =>
            window.__viz.cartogram("contiguous").render(() => resolve(true)),
          ),
      );
      const nodes = await page.evaluate(painted);
      const outlines = await page.evaluate(() => {
        const c = window.__viz.ctx.geomapCtx;
        return Object.fromEntries(
          c.topoData.map(d => [`geomap-path-${d.id}`, c.pathFn(d)]),
        );
      });
      const shapes = nodes.filter(n => n.key.startsWith("geomap-path-"));
      assert.strictEqual(
        shapes.length,
        Object.values(outlines).filter(Boolean).length,
        "every state the projection draws",
      );
      const area = d =>
        pathRings(d).reduce(
          (t, ring) =>
            t +
            Math.abs(
              ring.reduce((s, p, i) => {
                const q = ring[(i + 1) % ring.length];
                return s + p[0] * q[1] - q[0] * p[1];
              }, 0) / 2,
            ),
          0,
        );
      for (const n of shapes)
        assert.deepStrictEqual(
          pathRings(n.d).map(r => r.length),
          pathRings(outlines[n.key]).map(r => r.length),
          `${n.key}: its outline's rings and points`,
        );
      const ca = shapes.find(n => n.key === CA);
      assert.ok(area(ca.d) > area(outlines[CA]), "California grows");
      assert.ok(
        !nodes.some(n => n.key.startsWith("geomap-cartogram-label-")),
        "no labels",
      );
      assert.ok(
        !nodes.some(n => n.key.startsWith("geomap-point-")),
        "no points",
      );
      const link = nodes.find(
        n => n.key === "geomap-link-04000US06-04000US48-0",
      );
      const anchor = await page.evaluate(() => {
        const s = window.__viz.ctx.geomapCtx.cartogram.get("04000US06");
        return [s.x, s.y];
      });
      const start = link.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
      assert.ok(
        Math.hypot(start[0] - anchor[0], start[1] - anchor[1]) < 1,
        "the link leaves California's stretched center",
      );
      assert.ok(
        !nodes.some(n => /^(circle|square)-/.test(n.key)),
        "no size legend",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
