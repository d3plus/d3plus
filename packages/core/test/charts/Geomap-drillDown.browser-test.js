import {it} from "vitest";

import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import states from "../../dev/charts/Geomap/State.json";
import counties from "../../dev/charts/Geomap/County.json";
import stateRows from "../../dev/charts/Geomap/state-population.json";
import countyData from "../../dev/charts/Geomap/county-population.json";
import cities from "../../dev/charts/Geomap/city_coords.json";

/**
    Geomap's geographic drill-down in Chromium, on SVG and Canvas with a
    real pointer: clicking a state zooms to it and draws its counties over
    it and its faded neighbors, a neighbor's tooltip and click switch the
    drill, Back zooms out, a map without zoom fits the state instead,
    clustered cities, a dark theme, and small multiples.
*/

const box = "<div id='viz' style='width:800px;height:520px'></div>";

const TX = "04000US48";
const OK = "04000US40";
const CA = "04000US06";

const stateById = new Map(stateRows.map(d => [d["State ID"], d]));
const stateByAbbr = new Map(stateRows.map(d => [d.Abbr, d]));

/** Each county, carrying its state. */
const countyRows = countyData
  .map(d => {
    const state = stateById.get(`04000US${d["County ID"].slice(7, 9)}`);
    return state && {...d, "State ID": state["State ID"], State: state.State};
  })
  .filter(Boolean);

/** Each city, carrying its state. */
const cityRows = cities
  .map(d => {
    const state = stateByAbbr.get(d.region);
    return (
      state && {
        ...d,
        "State ID": state["State ID"],
        State: state.State,
        Cities: 1,
        point: [d.longitude, d.latitude],
      }
    );
  })
  .filter(Boolean);

/**
    Runs in the page: draws the drill-down map with `config`, and resolves
    once it has painted. The topojsons and rows arrive as JSON.
*/
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const {data, topojson, cities, ...config} = JSON.parse(json);
    // Functions don't survive JSON: the cities' accessors are set here.
    if (cities)
      Object.assign(config, {
        groupBy: ["State ID", "slug"],
        label: d => (typeof d.slug === "string" ? d.city : d.State),
        point: d => d.point,
        colorScale: "Cities",
      });
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({
        depth: 0,
        tiles: false,
        projection: "geoAlbersUsa",
        groupBy: ["State ID", "County ID"],
        label: d => (typeof d.County === "string" ? d.County : d.State),
        colorScale: "Population",
        ...config,
      })
      .topojson(topojson)
      .data(data);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: where each region is on screen (the centroid of its
    feature, through the scene's transforms), and the drawn paths' paint.
*/
const drawn = () => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const c = viz.ctx.geomapCtx;
  const features = new Map();
  for (const d of c.topoData) features.set(`geomap-path-${d.id}`, d.feature);
  for (const r of c.drill?.regions ?? [])
    features.set(`geomap-path-${r.id}`, r.feature);
  const out = {};
  const walk = (n, x, y, s) => {
    const tr = n.transform || {};
    const nx = x + (tr.x || 0) * s,
      ny = y + (tr.y || 0) * s;
    const k = s * (tr.scale ?? 1);
    const key = String(n.key);
    if (n.type === "path" && features.has(key)) {
      const [cx, cy] = viz.ctx.path.centroid(features.get(key));
      out[key] = {
        x: rect.left + nx + cx * k,
        y: rect.top + ny + cy * k,
        opacity: n.paint?.opacity ?? 1,
        fill: n.paint?.fill,
        stroke: n.paint?.stroke,
        interactive: n.interactive,
      };
    }
    (n.children || []).forEach(ch => walk(ch, nx, ny, k));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  const t = viz._zoomTransform || {scale: 1};
  return {
    paths: out,
    counties: Object.keys(out).filter(k => k.startsWith("geomap-path-05000"))
      .length,
    k: t.scale,
    scale: viz.schema.projection.scale(),
    history: viz._history.length,
    depth: viz._drawDepth,
    back: Boolean(document.querySelector("#viz .back-control")),
  };
};

/** The visible tooltip's text. */
const tooltipText = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, " "))
    .join("|");

/**
    Runs in the page: the value the colorScale marks, its swatches'
    opacities, and how many hover-mark nodes it draws.
*/
const colorScaleMark = () => {
  const viz = window.__viz;
  const out = {value: viz._colorScaleClass.hover(), swatches: [], marks: 0};
  const walk = n => {
    let d = n.datum;
    while (d && d.__d3plus__ && d.data) d = d.data;
    if (d && d._isColorScaleBucket && n.type !== "text")
      out.swatches.push(n.paint?.opacity ?? 1);
    if (/-hover-(tick|pointer|outline)$/.test(String(n.key))) out.marks++;
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  return out;
};

/** Waits for the page's timers, frames, and redraws to settle. */
const settle = (page, ms = 400) =>
  page.evaluate(ms => new Promise(r => setTimeout(r, ms)), ms);

const path = id => `geomap-path-${id}`;

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: clicking a state zooms to its counties over its faded neighbors, and Back zooms out`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: [states, counties], data: countyRows}),
        renderer,
      ]);
      const top = await page.evaluate(drawn);
      assert.strictEqual(top.counties, 0, "states at the top");
      assert.ok(!top.back);
      const tx = top.paths[path(TX)];
      await page.mouse.click(tx.x, tx.y);
      await settle(page);
      const drilled = await page.evaluate(drawn);
      assert.strictEqual(drilled.counties, 254, "Texas's counties");
      assert.ok(drilled.k > 1.5, `zoomed to ${drilled.k}`);
      assert.ok(drilled.back, "a Back button");
      assert.strictEqual(drilled.scale, top.scale, "the projection stays");
      const ok = drilled.paths[path(OK)];
      assert.ok(ok.opacity < 1 && ok.interactive, "a faded neighbor");
      assert.strictEqual(drilled.paths[path(TX)].interactive, false);

      // A neighbor's tooltip names it, and its click switches the drill.
      await page.mouse.move(ok.x - 3, ok.y - 3);
      await page.mouse.move(ok.x, ok.y, {steps: 3});
      await settle(page);
      const tip = await page.evaluate(tooltipText);
      assert.ok(tip.includes("Oklahoma"), `tooltip: ${tip}`);
      assert.ok(tip.includes("Click to Expand"), tip);
      // The colorScale describes the counties: a state marks nothing on it.
      const neighborMark = await page.evaluate(colorScaleMark);
      assert.ok(!neighborMark.value, `marked ${neighborMark.value}`);
      assert.ok(neighborMark.swatches.length > 1);
      assert.ok(
        neighborMark.swatches.every(o => o === 1),
        "no swatch lit",
      );
      assert.strictEqual(neighborMark.marks, 0, "no hover mark");
      const harris = drilled.paths[path("05000US48201")];
      await page.mouse.move(harris.x - 2, harris.y - 2);
      await page.mouse.move(harris.x, harris.y, {steps: 3});
      await settle(page);
      const countyMark = await page.evaluate(colorScaleMark);
      assert.ok(countyMark.value > 1e6, `a county marks ${countyMark.value}`);
      assert.ok(
        countyMark.swatches.some(o => o < 1),
        "its swatch lit, the others dimmed",
      );
      await page.mouse.move(ok.x - 3, ok.y - 3);
      await page.mouse.move(ok.x, ok.y, {steps: 3});
      await settle(page);
      assert.ok(
        !(await page.evaluate(colorScaleMark)).value,
        "back on a state, it clears",
      );
      await page.mouse.click(ok.x, ok.y);
      await settle(page);
      const switched = await page.evaluate(drawn);
      assert.strictEqual(switched.counties, 77, "Oklahoma's counties");
      assert.strictEqual(switched.history, 1, "Back still goes up a level");
      assert.ok(switched.paths[path(TX)].opacity < 1, "Texas, faded");

      await page.evaluate(() =>
        document.querySelector("#viz .back-control").click(),
      );
      await settle(page);
      const back = await page.evaluate(drawn);
      assert.strictEqual(back.depth, 0);
      assert.strictEqual(back.counties, 0);
      assert.strictEqual(back.k, 1, "zoomed back out");
      assert.ok(!back.back);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a map without zoom fits the projection to the state instead`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: [states, counties],
          data: countyRows,
          zoom: false,
        }),
        renderer,
      ]);
      const top = await page.evaluate(drawn);
      const tx = top.paths[path(TX)];
      await page.mouse.click(tx.x, tx.y);
      await settle(page);
      const drilled = await page.evaluate(drawn);
      assert.strictEqual(drilled.counties, 254);
      assert.strictEqual(drilled.k, 1, "no zoom transform");
      assert.ok(drilled.scale > top.scale * 2, "the projection fits Texas");
      await page.evaluate(() =>
        document.querySelector("#viz .back-control").click(),
      );
      await settle(page);
      const back = await page.evaluate(drawn);
      assert.ok(Math.abs(back.scale - top.scale) < 1, "and the nation again");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a state's cities draw as points that keep their size through the zoom`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: [states], data: cityRows, cities: true}),
        renderer,
      ]);
      const top = await page.evaluate(() => {
        const viz = window.__viz;
        return {
          points: viz.ctx.geomapCtx.pointData.length,
          regions: viz.ctx.geomapCtx.topoData.filter(d => d.data).length,
        };
      });
      assert.strictEqual(top.points, 0, "states, not merged points");
      assert.ok(top.regions > 40);
      const ca = (await page.evaluate(drawn)).paths[path(CA)];
      await page.mouse.click(ca.x, ca.y);
      await settle(page);
      const drilled = await page.evaluate(() => {
        const viz = window.__viz;
        const c = viz.ctx.geomapCtx;
        return {
          k: viz._zoomTransform?.scale ?? 1,
          hold: viz._pointsHoldSize,
          rows: c.cluster ? c.cluster.rows.length : c.pointData.length,
          states: new Set(
            (c.cluster ? c.cluster.rows : c.pointData).map(d => d["State ID"]),
          ).size,
        };
      });
      assert.ok(drilled.k > 1.5, `zoomed to ${drilled.k}`);
      assert.ok(drilled.hold, "points keep their size");
      assert.ok(drilled.rows > 10, `${drilled.rows} cities`);
      assert.strictEqual(drilled.states, 1, "California's only");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: neighbors outline lighter on a dark theme`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: [states, counties],
          data: countyRows,
          theme: "dark",
        }),
        renderer,
      ]);
      const tx = (await page.evaluate(drawn)).paths[path(TX)];
      await page.mouse.click(tx.x, tx.y);
      await settle(page);
      const ok = (await page.evaluate(drawn)).paths[path(OK)];
      assert.strictEqual(ok.fill, "#3d3e44", "the dark fill of no data");
      const lum = s =>
        s
          .match(/\d+/g)
          .slice(0, 3)
          .reduce((a, b) => a + +b, 0);
      assert.ok(lum(ok.stroke) > 0x3d * 3, `stroke ${ok.stroke}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: small multiples drill every panel, fitting each to the state`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const rows = countyRows.map((d, i) => ({...d, Half: i % 2 ? "A" : "B"}));
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: [states, counties],
          data: rows,
          facet: "Half",
        }),
        renderer,
      ]);
      const before = await page.evaluate(() => window.__viz._chartScene.length);
      assert.ok(before > 0);
      // Clicking drills through the chart's own click, as in any panel.
      await page.evaluate(
        TX =>
          new Promise(resolve => {
            const viz = window.__viz;
            const row = viz._filteredData.find(d => d["State ID"] === TX);
            viz.schema.on["click.shape"](row, 0, undefined, {
              stopPropagation() {},
            });
            setTimeout(() => resolve(true), 400);
          }),
        TX,
      );
      const keys = await page.evaluate(() =>
        window.__viz._chartScene.flatMap(function keys(n) {
          return [String(n.key), ...(n.children || []).flatMap(keys)];
        }),
      );
      const panels = new Set(
        keys
          .filter(k => /geomap-path-05000US48/.test(k))
          .map(k => k.split("/")[0]),
      );
      assert.strictEqual(panels.size, 2, "both panels draw Texas's counties");
      assert.ok(
        keys.some(k => k.endsWith(`geomap-path-${OK}`)),
        "neighbors",
      );
      assert.ok(
        !keys.some(k => /geomap-path-05000US40/.test(k)),
        "no other state's counties",
      );
      const k = await page.evaluate(() => window.__viz._zoomTransform?.scale);
      assert.ok(!k || k === 1, "panels fit the state rather than zoom");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
