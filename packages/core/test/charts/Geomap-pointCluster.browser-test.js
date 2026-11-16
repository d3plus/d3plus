import {it} from "vitest";

import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import states from "../../dev/charts/Geomap/State.json";
import cities from "../../dev/charts/Geomap/city_coords.json";
import stateRows from "../../dev/charts/Geomap/state-population.json";

/**
    Geomap's `pointCluster` in Chromium, on SVG and Canvas with a real
    pointer: overlapping cities drawn as bubbles of their colors, a bubble's
    tooltip, clicking a bubble to zoom in until it splits, a stack of points
    that fans out instead, zooming back out, the legend, links, small
    multiples, and a dark theme.
*/

const box = "<div id='viz' style='width:800px;height:520px'></div>";

/** The cities' rough time zone, from their longitude. */
const zone = d =>
  d.longitude > -87
    ? "Eastern"
    : d.longitude > -102
      ? "Central"
      : d.longitude > -115
        ? "Mountain"
        : "Pacific";

/** The cities, and six offices in one building that no zoom pulls apart. */
const rows = [
  ...cities,
  ..."ABCDEF".split("").map(s => ({
    slug: `office-${s}`,
    city: `Office ${s}`,
    region: "NY",
    latitude: 40.7484,
    longitude: -73.9857,
  })),
].map(d => ({...d, zone: zone(d), point: [d.longitude, d.latitude]}));

/**
    Runs in the page: draws the map with `config`, and resolves once it has
    painted. The topojson and rows arrive as JSON.
*/
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const {data, ...config} = JSON.parse(json);
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({
        groupBy: ["zone", "slug"],
        projection: "geoAlbersUsa",
        label: d => `${d.city}, ${d.region}`,
        point: d => d.point,
        ...config,
      })
      .data(data);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the drawn bubbles and points, with their screen centers. */
const drawn = () => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const t = viz._zoomTransform || {x: 0, y: 0, scale: 1};
  const out = [];
  const walk = (n, x, y, s) => {
    const tr = n.transform || {};
    const nx = x + (tr.x || 0) * s,
      ny = y + (tr.y || 0) * s;
    const k = s * (tr.scale ?? 1);
    const key = String(n.key);
    const meta = n.datum?.__d3plusGeoCluster;
    if (n.type === "circle" || key.startsWith("geomap-spider-"))
      out.push({
        key,
        type: n.type,
        fill: n.paint?.fill,
        r: (n.r ?? 0) * k,
        x: rect.left + nx,
        y: rect.top + ny,
        count: meta?.count,
        split: meta ? (isFinite(meta.splitK) ? meta.splitK : -1) : undefined,
        members: meta?.rows.map(d => d.slug),
        group: n.interactionGroup,
      });
    if (n.type === "path" && /-wedge-/.test(key))
      out.push({key, type: "wedge", fill: n.paint?.fill});
    if (n.type === "text" && /^(facet-[^/]+\/)?geomap-cluster-/.test(key))
      out.push({key, type: "count", text: n.lines?.[0]?.text});
    (n.children || []).forEach(c => walk(c, nx, ny, k));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  return {nodes: out, k: t.scale, rect: rect.toJSON()};
};

/** The visible tooltip's text. */
const tooltipText = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, " "))
    .join("|");

const isBubble = n => /^(facet-[^/]+\/)?geomap-cluster-\d+$/.test(n.key);
const isPoint = n => /^(facet-[^/]+\/)?geomap-point-[a-z]/.test(n.key);
const inView = rect => n =>
  n.x > rect.left + 30 &&
  n.x < rect.right - 30 &&
  n.y > rect.top + 60 &&
  n.y < rect.bottom - 30;

/** Waits for the page's timers and frames to settle. */
const settle = (page, ms = 300) =>
  page.evaluate(ms => new Promise(r => setTimeout(r, ms)), ms);

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: overlapping points draw as bubbles of their colors, every point in one`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: rows}),
        renderer,
      ]);
      const {nodes} = await page.evaluate(drawn);
      const bubbles = nodes.filter(isBubble);
      const points = nodes.filter(isPoint);
      assert.ok(bubbles.length > 10, `${bubbles.length} bubbles`);
      assert.strictEqual(
        bubbles.reduce((sum, b) => sum + b.count, 0) + points.length,
        rows.length,
        "every point drawn once",
      );
      const counts = nodes.filter(n => n.type === "count");
      assert.strictEqual(counts.length, bubbles.length, "each labeled");
      const legend = new Set(
        nodes.filter(n => n.group === "legend").map(n => n.fill),
      );
      const wedges = nodes.filter(n => n.type === "wedge");
      assert.ok(wedges.length, "a mixed bubble rings its colors");
      assert.ok(
        wedges.every(w => legend.has(w.fill)),
        "in the legend's colors",
      );
      const big = bubbles.reduce((a, b) => (b.count > a.count ? b : a));
      const small = bubbles.reduce((a, b) => (b.count < a.count ? b : a));
      assert.ok(big.r > small.r, "sized by count");

      await page.evaluate(
        () =>
          new Promise(r =>
            window.__viz.config({pointCluster: false}).render(() => r(true)),
          ),
      );
      const plain = (await page.evaluate(drawn)).nodes;
      assert.strictEqual(plain.filter(isBubble).length, 0);
      assert.strictEqual(plain.filter(isPoint).length, rows.length);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a bubble's tooltip lists its points, and clicking it zooms in until it splits`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: rows}),
        renderer,
      ]);
      const {nodes, rect} = await page.evaluate(drawn);
      const bubble = nodes
        .filter(isBubble)
        .filter(n => n.split > 0)
        .filter(inView(rect))
        .reduce((a, b) => (b.count > a.count ? b : a));
      await page.mouse.move(bubble.x - 2, bubble.y - 2);
      await page.mouse.move(bubble.x, bubble.y, {steps: 3});
      await settle(page, 400);
      const tip = await page.evaluate(tooltipText);
      assert.ok(tip.includes(`${bubble.count} points`), `tooltip: ${tip}`);
      assert.ok(tip.includes("more"), tip);
      assert.ok(tip.includes("Click to Expand"), tip);
      await page.mouse.click(bubble.x, bubble.y);
      await settle(page);
      const after = await page.evaluate(drawn);
      assert.ok(after.k >= bubble.split, `zoomed to ${after.k}`);
      const same = after.nodes.find(n => n.key === bubble.key);
      assert.ok(!same || same.count < bubble.count, "split apart");
      const members = after.nodes.filter(
        n =>
          (isPoint(n) && bubble.members.includes(n.key.slice(13))) ||
          (isBubble(n) && n.members.some(m => bubble.members.includes(m))),
      );
      assert.ok(members.length > 1, "its points drawn apart");
      // Points keep their pixel size through zoom.
      const point = after.nodes.find(isPoint);
      const before = nodes.find(n => n.key === point.key);
      if (before) assert.ok(Math.abs(point.r - before.r) < 0.01);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: points that never part fan out on click, and fold back`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: rows, zoom: false}),
        renderer,
      ]);
      const office = (await page.evaluate(drawn)).nodes
        .filter(isBubble)
        .find(n => n.members.includes("office-A"));
      await page.mouse.click(office.x, office.y);
      await settle(page);
      const fanned = (await page.evaluate(drawn)).nodes;
      const legs = fanned.filter(n => n.key.startsWith("geomap-spider-"));
      assert.strictEqual(legs.length, office.count, "a leg to each point");
      const spread = fanned.filter(
        n => isPoint(n) && office.members.includes(n.key.slice(13)),
      );
      assert.strictEqual(spread.length, office.count);
      const spots = new Set(spread.map(n => `${n.x | 0},${n.y | 0}`));
      assert.strictEqual(spots.size, spread.length, "each in its own place");
      assert.ok(
        fanned.some(n => n.key === office.key),
        "the bubble stays at the center",
      );
      // A fanned-out point takes the pointer.
      const names = office.members.map(m => rows.find(r => r.slug === m).city);
      await page.mouse.move(spread[0].x - 2, spread[0].y - 2);
      await page.mouse.move(spread[0].x, spread[0].y, {steps: 3});
      await settle(page, 400);
      const tip = await page.evaluate(tooltipText);
      assert.ok(
        names.some(name => tip.includes(name)) && !/\d+ points/.test(tip),
        `tooltip: ${tip}`,
      );
      await page.mouse.click(office.x, office.y);
      await settle(page);
      const folded = (await page.evaluate(drawn)).nodes;
      assert.ok(!folded.some(n => n.key.startsWith("geomap-spider-")));
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: an animated zoom splits the bubbles once the map has moved, and zooming out merges them`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: rows, duration: 120}),
        renderer,
      ]);
      const start = await page.evaluate(drawn);
      const bubblesAt0 = start.nodes.filter(isBubble).length;
      await page.evaluate(() =>
        window.__viz._zoomToBounds([
          [500, 100],
          [700, 260],
        ]),
      );
      const moving = await page.evaluate(drawn);
      assert.strictEqual(
        moving.nodes.filter(n => isBubble(n) || isPoint(n)).length,
        0,
        "hidden while the map moves",
      );
      await settle(page, 500);
      const zoomed = await page.evaluate(drawn);
      assert.ok(zoomed.k > 2);
      assert.ok(
        zoomed.nodes.filter(isPoint).length >
          start.nodes.filter(isPoint).length,
        "more points apart",
      );
      await page.evaluate(() => window.__viz._zoomToBounds(null));
      await settle(page, 500);
      const back = await page.evaluate(drawn);
      assert.strictEqual(back.k, 1);
      assert.strictEqual(back.nodes.filter(isBubble).length, bubblesAt0);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: hiding a legend color takes its points out of the bubbles`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({topojson: states, data: rows}),
        renderer,
      ]);
      const total = nodes =>
        nodes.filter(isBubble).reduce((s, b) => s + b.count, 0) +
        nodes.filter(isPoint).length;
      await page.evaluate(
        () =>
          new Promise(r =>
            window.__viz
              .config({
                filter: d => d.zone !== "Eastern",
              })
              .render(() => r(true)),
          ),
      );
      const {nodes} = await page.evaluate(drawn);
      const eastern = rows.filter(d => d.zone === "Eastern").length;
      assert.strictEqual(total(nodes), rows.length - eastern);
      assert.ok(
        nodes
          .filter(isBubble)
          .every(b => b.members.every(m => !m.startsWith("office"))),
        "none of the hidden points",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a link to a clustered point runs to its bubble`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: rows,
          links: [
            {source: "office-A", target: "denver-co"},
            {source: "office-A", target: "office-B"},
          ],
        }),
        renderer,
      ]);
      const result = await page.evaluate(() => {
        const viz = window.__viz;
        const links = viz._chartScene.filter(
          n => n.type === "path" && /^geomap-link-[^:]*$/.test(n.key),
        );
        const bubble = viz._chartScene.find(
          n =>
            /^geomap-cluster-\d+$/.test(n.key) &&
            n.datum.__d3plusGeoCluster.rows.some(r => r.slug === "office-A"),
        );
        const start = links[0]?.d.match(/^M([-\d.e]+),([-\d.e]+)/);
        return {
          count: links.length,
          gap: start
            ? Math.hypot(
                +start[1] - bubble.transform.x,
                +start[2] - bubble.transform.y,
              )
            : -1,
          r: bubble.r,
        };
      });
      assert.strictEqual(
        result.count,
        1,
        "the link inside a bubble isn't drawn",
      );
      assert.ok(
        Math.abs(result.gap - result.r) < 3,
        `starts at the bubble's edge: ${result.gap} vs ${result.r}`,
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: small multiples cluster each panel's points`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({
          topojson: states,
          data: rows.filter(d => d.zone === "Eastern" || d.zone === "Central"),
          facet: "zone",
        }),
        renderer,
      ]);
      const {nodes} = await page.evaluate(drawn);
      const east = nodes.filter(
        n => isBubble(n) && n.key.startsWith("facet-Eastern/"),
      );
      const central = nodes.filter(
        n => isBubble(n) && n.key.startsWith("facet-Central/"),
      );
      assert.ok(east.length && central.length, "bubbles in each panel");
      assert.ok(
        east.every(b =>
          b.members.every(m => rows.find(r => r.slug === m).zone === "Eastern"),
        ),
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a mixed bubble is a full pie whose count reads on a halo, light or dark`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const lum = c => {
        const [r, g, b] = c.match(/\d+/g).map(Number);
        return (r + g + b) / 3;
      };
      const rgb = c =>
        c.startsWith("#")
          ? `rgb(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)})`
          : c;
      for (const theme of ["light", "dark"]) {
        await page.evaluate(draw, [
          JSON.stringify({topojson: states, data: rows, theme}),
          renderer,
        ]);
        const result = await page.evaluate(() => {
          const viz = window.__viz;
          const mixed = viz._chartScene.find(
            n =>
              /^geomap-cluster-\d+$/.test(n.key) &&
              viz._chartScene.some(w => w.key === `${n.key}-wedge-1`),
          );
          const label = viz._chartScene.find(
            w => w.key === `${mixed.key}-label`,
          );
          const wedges = viz._chartScene.filter(w =>
            w.key.startsWith(`${mixed.key}-wedge-`),
          );
          return {
            wedges: wedges.map(w => w.d),
            ink: label.paint.fill,
            halo: label.halo ? label.paint.stroke : null,
            outline: mixed.paint.stroke,
          };
        });
        assert.ok(
          result.wedges.every(d => /L0,0Z$/.test(d)),
          "wedges reach the center",
        );
        assert.ok(result.halo, "the count has a halo");
        assert.strictEqual(result.halo, result.outline, "of the background");
        const ink = lum(rgb(result.ink)),
          halo = lum(rgb(result.halo));
        if (theme === "dark") assert.ok(ink > 160 && halo < 80, `${theme}`);
        else assert.ok(ink < 100 && halo > 200, `${theme}`);
      }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}

/**
    Runs in the page: hovers Texas by its centroid, through the scene's
    transforms, and reads the tooltip and the cursor.
*/
const hoverTexas = async page => {
  const at = await page.evaluate(() => {
    const viz = window.__viz;
    const host =
      document.querySelector("#viz svg") ||
      document.querySelector("#viz canvas");
    const rect = host.getBoundingClientRect();
    const tx = viz.ctx.geomapCtx.topoData.find(d => d.id === "04000US48");
    const [x, y] = viz.ctx.path.centroid(tx.feature);
    const ct = viz._chartTransform;
    return [rect.left + ct.x + x, rect.top + ct.y + y];
  });
  await page.mouse.move(at[0] - 3, at[1] - 3);
  await page.mouse.move(at[0], at[1], {steps: 3});
  await settle(page, 400);
  return page.evaluate(() => ({
    tip: Array.from(document.querySelectorAll(".d3plus-tooltip"))
      .filter(el => getComputedStyle(el).opacity !== "0")
      .map(el => el.textContent)
      .join("|"),
    cursor: [
      document.querySelector("#viz svg"),
      document.querySelector("#viz canvas"),
    ]
      .filter(Boolean)
      .map(el => getComputedStyle(el).cursor)
      .join(","),
  }));
};

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: a region notes "Click to Expand" and takes the pointer only where a click drills`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      for (const [groupBy, drills] of [
        [["State ID", "Abbr"], true],
        [["State ID"], false],
      ]) {
        await page.evaluate(() => {
          document.querySelector("#viz").innerHTML = "";
        });
        await page.evaluate(draw, [
          JSON.stringify({
            topojson: states,
            data: stateRows,
            groupBy,
            depth: 0,
            label: false,
            point: false,
            colorScale: "Population",
          }),
          renderer,
        ]);
        const {tip, cursor} = await hoverTexas(page);
        assert.ok(tip.includes("Population"), `Texas's tooltip: ${tip}`);
        assert.strictEqual(
          tip.includes("Click to Expand"),
          drills,
          `${groupBy}: ${tip}`,
        );
        assert.strictEqual(
          cursor.includes("pointer"),
          drills,
          `${groupBy}: ${cursor}`,
        );
        await page.mouse.move(1, 1);
      }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
