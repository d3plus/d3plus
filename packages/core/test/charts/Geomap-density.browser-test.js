import {it} from "vitest";
import {pathRings} from "@d3plus/render";

import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import states from "../../dev/charts/Geomap/State.json";
import population from "../../dev/charts/Geomap/state-population.json";
import cities from "../../dev/charts/Geomap/city_coords.json";

/**
    Geomap's `dotDensity` and `hexbin` in Chromium, on SVG and Canvas with a
    real pointer: dots scattered inside each state, mixed by category with a
    legend, that stay put through zoom; points binned into hexagons colored
    on the colorScale, with tooltips; small multiples; and a cartogram
    turning both off.
*/

const box = "<div id='viz' style='width:800px;height:520px'></div>";

/**
    Runs in the page: draws the map with `config`, and resolves once it has
    painted. The topojson and rows arrive as JSON.
*/
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const {topojson, data, ...config} = JSON.parse(json);
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({
        groupBy: "State ID",
        projection: "geoAlbersUsa",
        tiles: false,
        ...config,
      })
      .label(d => d.State ?? d.city)
      .point(d => d.point)
      .data(data);
    if (topojson) viz.topojson(topojson);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: each painted node's key, type, `d`, fill, and screen position, in paint order. */
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
      group: n.interactionGroup,
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

/** The centers of the dots a dots path draws (each starts `M x-r,y`). */
function dotCenters(d, r = 1.5) {
  return [...d.matchAll(/M([-\d.]+),([-\d.]+)/g)].map(m => [+m[1] + r, +m[2]]);
}

/** Whether a point falls inside the rings, by the even-odd rule. */
function inside([x, y], rings) {
  let c = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        c = !c;
    }
  return c;
}

/** Moves the pointer onto a node's local point and returns the tooltip. */
async function hoverAt(page, node, [px, py]) {
  const x = node.origin[0] + px * node.scale,
    y = node.origin[1] + py * node.scale;
  await page.mouse.move(x - 3, y - 3);
  await page.mouse.move(x, y, {steps: 3});
  await new Promise(r => setTimeout(r, 400));
  return page.evaluate(tooltipText);
}

/** The states split into two categories, a quarter and three quarters of each. */
const split = population.flatMap(d => [
  {...d, Kind: "Urban", Population: (3 * d.Population) / 4},
  {...d, Kind: "Rural", Population: d.Population / 4},
]);

const cityRows = cities.map(d => ({
  id: d.slug,
  city: d.city,
  point: [d.longitude, d.latitude],
}));

it("Geomap: past the SVG cap, dot density switches a chart without a renderer to Canvas, and back", async () => {
  const {page, errors, close} = await openPage(box);
  try {
    const host = await page.evaluate(
      json =>
        new Promise(resolve => {
          const {topojson, data} = JSON.parse(json);
          const info = [];
          console.info = m => info.push(m);
          const viz = new window.d3plus.Geomap()
            .select("#viz")
            .duration(0)
            .config({
              groupBy: "State ID",
              projection: "geoAlbersUsa",
              tiles: false,
              dotDensity: {value: "Population", per: 10000},
            })
            .data(data)
            .topojson(topojson);
          window.__viz = viz;
          const kind = () =>
            document.querySelector("#viz canvas") ? "canvas" : "svg";
          viz.render(() => {
            const first = {
              kind: kind(),
              per: viz.ctx.geomapCtx.density.dots.per,
            };
            viz.dotDensity({value: "Population", per: 100000}).render(() => {
              resolve({first, second: kind(), info});
            });
          });
        }),
      JSON.stringify({topojson: states, data: population}),
    );
    assert.deepStrictEqual(host.first, {kind: "canvas", per: 10000});
    assert.strictEqual(host.second, "svg");
    assert.strictEqual(host.info.length, 1, "one note");
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
});

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: dot density scatters each state's dots inside it, and a dot's tooltip counts them`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: population,
          dotDensity: {value: "Population", per: 100000},
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const dots = nodes.filter(n => n.key.startsWith("geomap-dots-"));
      assert.strictEqual(dots.length, population.length, "a path per state");
      const tx = nodes.find(n => n.key === "geomap-dots-04000US48|");
      const outline = nodes.find(n => n.key === "geomap-path-04000US48");
      const centers = dotCenters(tx.d);
      assert.strictEqual(centers.length, Math.round(29145505 / 100000));
      const rings = pathRings(outline.d);
      assert.ok(
        centers.every(c => inside(c, rings)),
        "every dot inside Texas",
      );
      assert.ok(outline, "the outlines stay drawn");
      const legend = nodes.filter(n => n.group === "legend");
      assert.strictEqual(legend.length, 0, "no legend for one color");
      const tip = await hoverAt(page, tx, centers[0]);
      assert.ok(tip.includes("Texas"), `tooltip: ${tip}`);
      assert.ok(/Dots ?291/.test(tip), `dot count: ${tip}`);
      assert.ok(/Each dot ?100k/.test(tip), `per: ${tip}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: dot density mixes each category's dots in its color, with a legend`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: split,
          groupBy: ["Kind", "State ID"],
          dotDensity: {value: "Population", per: 200000},
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const urban = nodes.find(n => n.key === "geomap-dots-04000US06|Urban");
      const rural = nodes.find(n => n.key === "geomap-dots-04000US06|Rural");
      assert.ok(urban && rural, "a path per category");
      assert.notStrictEqual(urban.fill, rural.fill, "each its own color");
      const nu = dotCenters(urban.d).length,
        nr = dotCenters(rural.d).length;
      assert.ok(Math.abs(nu - 3 * nr) <= 3, `${nu} vs ${nr}`);
      const legendFills = nodes
        .filter(n => n.group === "legend" && n.fill)
        .map(n => n.fill);
      assert.ok(legendFills.includes(urban.fill), "Urban in the legend");
      assert.ok(legendFills.includes(rural.fill), "Rural in the legend");
      // Hovering the state (between its dots) shows its totals.
      const ca = nodes.find(n => n.key === "geomap-path-04000US06");
      const rings = pathRings(ca.d);
      const taken = [...dotCenters(urban.d), ...dotCenters(rural.d)];
      const ring = rings[0];
      const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      let spot = [cx, cy];
      for (let k = 0; k < 400; k++) {
        const p = [
          cx + ((k % 20) - 10) * 2,
          cy + (Math.floor(k / 20) - 10) * 2,
        ];
        if (
          inside(p, rings) &&
          taken.every(t => Math.hypot(t[0] - p[0], t[1] - p[1]) > 4)
        ) {
          spot = p;
          break;
        }
      }
      const tip = await hoverAt(page, ca, spot);
      assert.ok(tip.includes("California"), `tooltip: ${tip}`);
      assert.ok(tip.includes("Urban") && tip.includes("Rural"), tip);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: dots stay put through zoom and a redraw`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: population,
          dotDensity: {value: "Population", per: 500000},
        }),
        renderer,
      ]);
      const key = "geomap-dots-04000US36|";
      const before = (await page.evaluate(painted)).find(n => n.key === key);
      await page.evaluate(
        () =>
          new Promise(resolve => {
            window.__viz._zoomToBounds([
              [300, 100],
              [600, 300],
            ]);
            setTimeout(() => window.__viz.render(() => resolve(true)), 100);
          }),
      );
      const after = (await page.evaluate(painted)).find(n => n.key === key);
      assert.strictEqual(after.d, before.d, "the same dots");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: hexbin bins the points into hexagons on the colorScale, with tooltips`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: cityRows,
          groupBy: "id",
          hexbin: {radius: 18},
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const bins = nodes.filter(n => n.key.startsWith("geomap-bin-"));
      assert.ok(bins.length > 20 && bins.length < cities.length, "binned");
      assert.ok(
        !nodes.some(n => n.key.startsWith("geomap-point-")),
        "no points",
      );
      bins.forEach(b =>
        assert.strictEqual(pathRings(b.d)[0].length, 6, "hexagons"),
      );
      const fills = new Set(bins.map(b => b.fill));
      assert.ok(fills.size > 1, "colored by count");
      assert.ok(
        nodes.some(n => n.key.includes("colorScale")),
        "a colorScale",
      );
      const bin = bins[0];
      const ring = pathRings(bin.d)[0];
      const center = [
        ring.reduce((s, p) => s + p[0], 0) / 6,
        ring.reduce((s, p) => s + p[1], 0) / 6,
      ];
      const tip = await hoverAt(page, bin, center);
      assert.ok(/Count: \d+/.test(tip), `tooltip: ${tip}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: zooming in re-bins the points into hexagons of the same pixel size`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: cityRows,
          groupBy: "id",
          hexbin: {radius: 18},
        }),
        renderer,
      ]);
      const bins = nodes => nodes.filter(n => n.key.startsWith("geomap-bin-"));
      const before = bins(await page.evaluate(painted));
      const top = () =>
        page.evaluate(() =>
          Math.max(...window.__viz._colorScaleClass._colorScale.domain()),
        );
      const topBefore = await top();
      await page.evaluate(
        () =>
          new Promise(resolve => {
            window.__viz._zoomToBounds([
              [500, 120],
              [700, 260],
            ]);
            setTimeout(resolve, 200);
          }),
      );
      const after = bins(await page.evaluate(painted));
      const k = await page.evaluate(() => window.__viz._zoomTransform.scale);
      assert.ok(k > 2, `zoomed ${k}`);
      assert.ok(after.length > before.length, "finer bins");
      assert.ok((await top()) < topBefore, "the colorScale refits");
      // Each hexagon is as wide on screen as before the zoom.
      const width = n => {
        const xs = pathRings(n.d)[0].map(p => p[0]);
        return (Math.max(...xs) - Math.min(...xs)) * n.scale;
      };
      assert.ok(
        Math.abs(width(after[0]) - width(before[0])) < 0.5,
        `${width(after[0])} vs ${width(before[0])}`,
      );
      // A bin in view still shows its tooltip.
      const rect = await page.evaluate(() =>
        document.querySelector("#viz").getBoundingClientRect().toJSON(),
      );
      const seen = after.find(n => {
        const ring = pathRings(n.d)[0];
        const x = n.origin[0] + ((ring[0][0] + ring[3][0]) / 2) * n.scale;
        const y = n.origin[1] + ((ring[0][1] + ring[3][1]) / 2) * n.scale;
        return (
          x > rect.left + 40 &&
          x < rect.right - 40 &&
          y > rect.top + 60 &&
          y < rect.bottom - 40
        );
      });
      const ring = pathRings(seen.d)[0];
      const tip = await hoverAt(page, seen, [
        (ring[0][0] + ring[3][0]) / 2,
        (ring[0][1] + ring[3][1]) / 2,
      ]);
      assert.ok(/Count: \d+/.test(tip), `tooltip: ${tip}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: small multiples bin every panel's points on one colorScale`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const data = [
        ...cityRows.map(d => ({...d, g: "all"})),
        ...cityRows.slice(0, 60).map(d => ({...d, id: `${d.id}-2`, g: "some"})),
      ];
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data,
          groupBy: "id",
          facet: "g",
          hexbin: {radius: 20},
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      const all = nodes.filter(n => n.key.startsWith("facet-all/geomap-bin-"));
      const some = nodes.filter(n =>
        n.key.startsWith("facet-some/geomap-bin-"),
      );
      assert.ok(all.length && some.length, "bins in both panels");
      // A bin both panels draw with the same count takes the same color.
      const byKey = new Map(all.map(n => [n.key.split("/")[1], n]));
      const counts = await page.evaluate(() => {
        const out = {};
        for (const n of window.__viz._paintedScene.root.children ?? []) {
          const walk = m => {
            const meta = m.datum?.__d3plusGeoBin;
            if (meta) out[String(m.key)] = meta.count;
            (m.children || []).forEach(walk);
          };
          walk(n);
        }
        return out;
      });
      let compared = 0;
      for (const n of some) {
        const twin = byKey.get(n.key.split("/")[1]);
        if (twin && counts[twin.key] === counts[n.key]) {
          assert.strictEqual(n.fill, twin.fill, `${n.key}: one colorScale`);
          compared++;
        }
      }
      assert.ok(compared > 0, "some bins compared");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a cartogram turns dots and bins off`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: [...population, ...cityRows],
          colorScale: "Population",
          cartogram: "dorling",
          dotDensity: {value: "Population"},
          hexbin: true,
        }),
        renderer,
      ]);
      const nodes = await page.evaluate(painted);
      assert.ok(
        !nodes.some(
          n => n.key.includes("geomap-dots-") || n.key.includes("geomap-bin-"),
        ),
        "no dots or bins",
      );
      assert.ok(nodes.some(n => n.key === "geomap-path-04000US06"));
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
