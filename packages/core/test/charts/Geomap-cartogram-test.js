import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {pathRings} from "@d3plus/render";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {
  cartogramRadii,
  circlePathD,
  squarePathD,
} from "../../src/charts/Geomap/cartogram.ts";
import {
  fitCartogram,
  relaxCartogram,
} from "../../src/charts/Geomap/cartogramRelax.ts";
import {
  CARTOGRAM_FILL,
  cartogramKind,
  cartogramValue,
  geomapCartogram,
  regionHome,
} from "../../src/charts/Geomap/cartogramLayout.ts";
import {
  cartogramLabelBox,
  cartogramLabels,
  wholeLabel,
} from "../../src/charts/Geomap/cartogramLabels.ts";
import {
  cartogramFields,
  geomapFacetHooks,
} from "../../src/charts/Geomap/cartogramFields.ts";
import {
  cartogramScale,
  drawnCartogramScale,
  estimateCartogramScale,
  setCartogramLegend,
} from "../../src/charts/Geomap/cartogramLegend.ts";
import {cartogramAnchors} from "../../src/charts/Geomap/applyLayout.ts";
import {fieldNameOf} from "../../src/utils/fieldAccessor.ts";
import {
  currentTileUrl,
  syncTileAttribution,
  tileExtent,
  tilesShown,
} from "../../src/charts/Geomap/tileState.ts";

useJsdom();

/**
    Geomap's `cartogram`: Dorling circles and Demers squares sized by
    value, placed near home without overlapping, and the labels, layout,
    and small-multiple sharing around them.
*/

const read = file =>
  JSON.parse(
    readFileSync(new URL(`../../dev/charts/Geomap/${file}`, import.meta.url)),
  );
const states = read("State.json");
const population = read("state-population.json");

/** A seeded spread of `n` shapes in a 600×400 box. */
function crowd(n, seed = 7) {
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({length: n}, () => ({
    x: 100 + rand() * 400,
    y: 100 + rand() * 200,
    r: 2 + rand() * rand() * 30,
  }));
}

/** The largest overlap between two placed shapes, less `padding`. */
function worstOverlap(placed, square, padding = 0) {
  let worst = 0;
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i],
        b = placed[j];
      const reach = a.r + b.r + padding;
      const dx = Math.abs(a.x - b.x),
        dy = Math.abs(a.y - b.y);
      const o = square
        ? Math.min(reach - dx, reach - dy)
        : reach - Math.hypot(dx, dy);
      worst = Math.max(worst, o - padding);
    }
  return worst;
}

it("cartogramRadii gives areas in proportion to value, adding up to the area", () => {
  const values = [1, 4, 0, -2, NaN, 5];
  const circles = cartogramRadii(values, 1000, false);
  const area = circles.reduce((s, r) => s + Math.PI * r * r, 0);
  assert.ok(Math.abs(area - 1000) < 1e-9);
  assert.ok(
    Math.abs(circles[1] / circles[0] - 2) < 1e-9,
    "4× the value, 2× the radius",
  );
  assert.deepStrictEqual(circles.slice(2, 5), [0, 0, 0]);
  const squares = cartogramRadii(values, 1000, true);
  const sides = squares.reduce((s, h) => s + 4 * h * h, 0);
  assert.ok(Math.abs(sides - 1000) < 1e-9);
  const shared = cartogramRadii([5], 100, false, 10);
  assert.ok(Math.abs(Math.PI * shared[0] ** 2 - 50) < 1e-9, "against a total");
  assert.deepStrictEqual(cartogramRadii([0, 0], 100, false), [0, 0]);
  assert.deepStrictEqual(cartogramRadii([1], 0, false), [0]);
});

it("circlePathD and squarePathD draw closed polygons around the center", () => {
  const circle = pathRings(circlePathD(50, 40, 10));
  assert.strictEqual(circle.length, 1);
  assert.strictEqual(circle[0].length, 64);
  for (const [x, y] of circle[0])
    assert.ok(Math.abs(Math.hypot(x - 50, y - 40) - 10) < 0.01);
  assert.strictEqual(squarePathD(50, 40, 10), "M40,30L60,30L60,50L40,50Z");
});

it("relaxCartogram parts circles and squares that start on top of each other", () => {
  for (const square of [false, true]) {
    const nodes = crowd(200);
    const placed = relaxCartogram(nodes, {square, padding: 1});
    assert.strictEqual(placed.length, nodes.length);
    assert.ok(
      worstOverlap(placed, square, 1) <= 0.6,
      `${square ? "squares" : "circles"} keep at least half their padding apart`,
    );
    placed.forEach((p, i) => assert.strictEqual(p.r, nodes[i].r));
  }
});

it("relaxCartogram keeps shapes near home and is deterministic", () => {
  const nodes = crowd(120, 3);
  const a = relaxCartogram(nodes);
  const b = relaxCartogram(nodes);
  assert.deepStrictEqual(a, b);
  const lone = relaxCartogram([{x: 10, y: 20, r: 5}]);
  assert.deepStrictEqual(lone, [{x: 10, y: 20, r: 5}], "nothing to push");
  // Shapes sharing one home spread out around it.
  const same = relaxCartogram(
    Array.from({length: 5}, () => ({x: 0, y: 0, r: 4})),
  );
  assert.ok(worstOverlap(same, false) <= 0.1);
  const cx = same.reduce((s, p) => s + p.x, 0) / 5;
  assert.ok(Math.abs(cx) < 8, "around their home");
});

it("fitCartogram shrinks the shapes until they stay inside the bounds", () => {
  const nodes = Array.from({length: 9}, (_, i) => ({
    x: 50 + (i % 3) * 5,
    y: 50 + Math.floor(i / 3) * 5,
    r: 20,
  }));
  const bounds = [0, 0, 100, 100];
  const loose = relaxCartogram(nodes);
  const spill = p =>
    Math.max(
      ...p.map(d =>
        Math.max(-d.x + d.r, -d.y + d.r, d.x + d.r - 100, d.y + d.r - 100),
      ),
    );
  assert.ok(spill(loose) > 0.5, "the relaxed shapes spill out");
  const fitted = fitCartogram(nodes, bounds);
  assert.ok(fitted[0].r < 20, "shrunk");
  assert.ok(spill(fitted) < spill(loose));
  const roomy = fitCartogram(
    nodes.map(d => ({...d, r: 1})),
    bounds,
  );
  assert.strictEqual(roomy[0].r, 1, "a cartogram that fits keeps its sizes");
});

it("cartogramKind and cartogramValue read the config", () => {
  const viz = {schema: {cartogram: "dorling"}, ctx: {}};
  assert.strictEqual(cartogramKind(viz), "dorling");
  viz.schema.cartogram = "demers";
  assert.strictEqual(cartogramKind(viz), "demers");
  for (const off of [false, undefined, "contiguous", "circles"]) {
    viz.schema.cartogram = off;
    assert.strictEqual(cartogramKind(viz), false);
  }
  assert.strictEqual(
    cartogramValue(viz, {}, 0),
    1,
    "the same size without a value",
  );
  viz.schema.colorScale = d => d.pop;
  assert.strictEqual(
    cartogramValue(viz, {pop: "12"}, 0),
    12,
    "the colorScale value",
  );
  viz.schema.cartogramSize = d => d.gdp;
  assert.strictEqual(cartogramValue(viz, {pop: 1, gdp: 7}, 0), 7);
  assert.ok(Number.isNaN(cartogramValue(viz, {}, 0)), "a missing value");
});

it("regionHome is the center of a region's largest ring", () => {
  const d = "M0,0L10,0L10,10L0,10ZM100,100L101,100L101,101Z";
  assert.deepStrictEqual(regionHome(d), [5, 5]);
  assert.strictEqual(regionHome(null), null);
  assert.strictEqual(regionHome(""), null);
});

it("cartogramLabelBox fits inside its circle or square", () => {
  const box = cartogramLabelBox({r: 10, square: false});
  const corner = Math.hypot(box.x, box.y);
  assert.ok(Math.abs(corner - 10) < 1e-9, "inscribed in the circle");
  assert.strictEqual(box.width, -2 * box.x);
  assert.deepStrictEqual(cartogramLabelBox({r: 10, square: true}), {
    x: -10,
    y: -10,
    width: 20,
    height: 20,
  });
});

it("wholeLabel tells a wrapped label from one cut short", () => {
  assert.ok(wholeLabel(["United", "States"], "United States"));
  assert.ok(wholeLabel(["Pak-", "istan"], "Pakistan"), "hyphenated");
  assert.ok(!wholeLabel(["DR..."], "DR Congo"));
  assert.ok(!wholeLabel(["..."], "Tanzania"));
  assert.ok(wholeLabel([], ""));
});

it("cartogramFields declares the cartogram config and its defaults", () => {
  const fields = Object.fromEntries(cartogramFields().map(f => [f.key, f]));
  assert.strictEqual(fields.cartogram.default, false);
  assert.strictEqual(fields.cartogramPadding.default, 1);
  assert.strictEqual(fields.cartogramSize.coerce(false), false);
  const fn = d => d.v;
  assert.strictEqual(fields.cartogramSize.coerce(fn), fn);
  assert.strictEqual(fieldNameOf(fields.cartogramSize.coerce("pop")), "pop");
  const viz = new Geomap().cartogram("demers").cartogramSize("pop");
  assert.strictEqual(viz.cartogram(), "demers");
  assert.strictEqual(viz.cartogramSize()({pop: 3}), 3);
  assert.strictEqual(viz.cartogramPadding(), 1);
});

it("geomapFacetHooks shares the largest panel total when panels share scales", () => {
  const viz = {schema: {cartogram: "dorling", colorScale: d => d.v}, ctx: {}};
  const total = geomapFacetHooks.share(viz, [
    [{v: 1}, {v: 2}],
    [{v: 5}, {v: -1}],
  ]);
  assert.strictEqual(total, 5);
  const undo = geomapFacetHooks.panel(viz, {shared: true, scales: total});
  assert.strictEqual(viz.ctx.cartogramTotal, 5);
  undo();
  assert.strictEqual(viz.ctx.cartogramTotal, undefined);
  geomapFacetHooks.panel(viz, {shared: false, scales: total})();
  viz.schema.cartogram = false;
  assert.strictEqual(geomapFacetHooks.share(viz, [[{v: 1}]]), undefined);
});

/** Runs Geomap's layout over the states with `config`. */
function laidOut(config = {}) {
  const viz = new Geomap().config({
    width: 800,
    height: 500,
    tiles: false,
    topojson: states,
    projection: "geoAlbersUsa",
    groupBy: "State ID",
    colorScale: "Population",
    legend: false,
    ...config,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = config.rows ?? population;
  viz._id = d => d["State ID"];
  viz._drawLabel = d => d.Abbr ?? d.id;
  applyGeomapLayout({viz});
  return viz;
}

it("geomapCartogram sizes and places each state with data", () => {
  for (const kind of ["dorling", "demers"]) {
    const viz = laidOut({cartogram: kind});
    const shapes = viz.ctx.geomapCtx.cartogram;
    assert.strictEqual(shapes.size, population.length);
    const placed = [...shapes.values()];
    assert.ok(placed.every(s => s.square === (kind === "demers")));
    assert.ok(
      worstOverlap(placed, kind === "demers", 1) <= 0.6,
      `${kind}: apart`,
    );
    const ca = shapes.get("04000US06"),
      tx = shapes.get("04000US48");
    const ratio = (ca.r / tx.r) ** 2;
    assert.ok(
      Math.abs(ratio - 39538223 / 29145505) < 1e-6,
      "areas follow value",
    );
    assert.ok(ca.x < tx.x, "California stays west of Texas");
    for (const s of placed) {
      assert.ok(s.x - s.r >= 19.5 && s.x + s.r <= 780.5, "inside the padding");
      assert.ok(s.y - s.r >= 19.5 && s.y + s.r <= 480.5);
    }
    // Coordinate points aren't drawn on a cartogram (and no links are set).
    assert.deepStrictEqual(viz.ctx.geomapCtx.pointData, []);
    assert.deepStrictEqual(viz.ctx.geomapCtx.flowLinks, []);
  }
});

it("geomapCartogram leaves out regions without data or value, and reuses its layout", () => {
  const rows = population
    .map(d => (d.Abbr === "TX" ? {...d, Population: null} : d))
    .filter(d => d.Abbr !== "CA");
  const viz = laidOut({cartogram: "dorling", rows});
  const shapes = viz.ctx.geomapCtx.cartogram;
  assert.ok(!shapes.has("04000US06"), "no data");
  assert.ok(!shapes.has("04000US48"), "no value");
  assert.strictEqual(shapes.size, rows.length - 1);
  const again = geomapCartogram(viz, viz.ctx.geomapCtx.topoData, {
    pathD: r => viz.ctx.geomapCtx.pathFn(r),
    area: r => viz.ctx.path.area(r.feature),
    bounds: [20, 20, 780, 480],
  });
  assert.strictEqual(
    again.get("04000US36"),
    shapes.get("04000US36"),
    "the same placement object, from the cache",
  );
  assert.strictEqual(laidOut({cartogram: false}).ctx.geomapCtx.cartogram, null);
});

it("geomapCartogram fills a share of the regions' area, or of a shared total's", () => {
  const viz = laidOut({cartogram: "dorling", cartogramPadding: 0});
  const {topoData, cartogram} = viz.ctx.geomapCtx;
  const area = topoData
    .filter(r => cartogram.has(r.id))
    .reduce((s, r) => s + viz.ctx.path.area(r.feature), 0);
  const drawn = [...cartogram.values()].reduce(
    (s, c) => s + Math.PI * c.r * c.r,
    0,
  );
  assert.ok(drawn <= area * CARTOGRAM_FILL + 1e-6);
  const half = laidOut({cartogram: "dorling", cartogramPadding: 0});
  const sum = population.reduce((s, d) => s + d.Population, 0);
  half.ctx.cartogramTotal = sum * 2;
  applyGeomapLayout({viz: half});
  const ny = half.ctx.geomapCtx.cartogram.get("04000US36");
  assert.ok(
    ny.r < cartogram.get("04000US36").r,
    "smaller against a larger total",
  );
});

it("cartogramLabels labels the shapes that fit their label, and none that don't", () => {
  const viz = laidOut({cartogram: "dorling"});
  const {topoData, cartogram} = viz.ctx.geomapCtx;
  const nodes = cartogramLabels(viz, topoData, cartogram, {fill: "#ccc"});
  const texts = nodes.filter(n => n.type === "text");
  const keys = texts.map(n => n.key);
  assert.ok(
    keys.some(k => k.startsWith("geomap-cartogram-label-04000US06")),
    "California",
  );
  // A label too long for the smaller circles is left off them, never cut short.
  const long = cartogramLabels(viz, topoData, cartogram, {
    fill: "#ccc",
    label: d => `${d.State} has ${d.Population} residents`,
  });
  const longTexts = long.filter(n => n.type === "text");
  assert.ok(longTexts.length < texts.length, "fewer fit");
  for (const n of longTexts)
    assert.ok(
      wholeLabel(
        n.lines.map(l => l.text),
        `${n.datum.data.State} has ${n.datum.data.Population} residents`,
      ),
    );
  for (const n of texts) {
    const row = n.datum.data;
    assert.ok(
      wholeLabel(
        n.lines.map(l => l.text),
        row.Abbr,
      ),
    );
  }
  assert.deepStrictEqual(
    cartogramLabels(viz, topoData, cartogram, {label: false}),
    [],
  );
  const named = cartogramLabels(viz, topoData, cartogram, {
    fill: "#ccc",
    label: d => d.State,
  });
  assert.ok(
    named.some(
      n =>
        n.type === "text" &&
        n.lines
          .map(l => l.text)
          .join(" ")
          .includes("Cali"),
    ),
  );
});

it("tilesShown hides the tiles under a cartogram, and the credit with them", () => {
  const viz = new Geomap().config({width: 400, height: 300});
  assert.ok(tilesShown(viz));
  syncTileAttribution(viz);
  const credit = viz.schema.attribution;
  assert.ok(credit, "the default tiles carry a credit");
  viz.cartogram("dorling");
  assert.ok(!tilesShown(viz));
  syncTileAttribution(viz);
  assert.strictEqual(viz.schema.attribution, "", "no tiles, no credit");
  viz.cartogram(false);
  syncTileAttribution(viz);
  assert.strictEqual(viz.schema.attribution, credit, "back with the tiles");
  viz.schema.attribution = "Mine";
  viz.cartogram("demers");
  syncTileAttribution(viz);
  assert.strictEqual(
    viz.schema.attribution,
    "Mine",
    "a credit set by hand stays",
  );
  viz.tiles(false).cartogram(false);
  assert.ok(!tilesShown(viz));
});

it("currentTileUrl and tileExtent read the theme and the map area", () => {
  const viz = new Geomap().config({width: 400, height: 300});
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz.tileUrl({light: "light/{z}/{x}/{y}", dark: "dark/{z}/{x}/{y}"});
  assert.strictEqual(currentTileUrl(viz), "light/{z}/{x}/{y}");
  viz._basemapDark = true;
  assert.strictEqual(currentTileUrl(viz), "dark/{z}/{x}/{y}");
  const [[x0, y0], [x1, y1]] = tileExtent(viz);
  assert.deepStrictEqual([x0, y0], [0, 0]);
  assert.ok(x1 > 0 && y1 > 0);
});

it("cartogramScale draws a value at c·√value", () => {
  const scale = cartogramScale(2, 4, 100);
  assert.deepStrictEqual(scale.domain(), [4, 100]);
  assert.ok(Math.abs(scale(4) - 4) < 1e-9);
  assert.ok(Math.abs(scale(25) - 10) < 1e-9);
  assert.ok(Math.abs(scale.invert(20) - 100) < 1e-9);
});

it("setCartogramLegend picks squares for Demers and titles the legend by the sizing key", () => {
  const viz = new Geomap().colorScale("Population");
  assert.strictEqual(setCartogramLegend(viz), false);
  assert.strictEqual(viz._sizeKey, undefined);
  viz.cartogram("dorling");
  assert.strictEqual(setCartogramLegend(viz), true);
  assert.strictEqual(viz._sizeLegendShape, "circle");
  assert.strictEqual(viz._sizeKey, "Population");
  viz.cartogram("demers").cartogramSize("GDP");
  setCartogramLegend(viz);
  assert.strictEqual(viz._sizeLegendShape, "square");
  assert.strictEqual(viz._sizeKey, "GDP");
  viz.cartogramSize(d => d.GDP);
  setCartogramLegend(viz);
  assert.strictEqual(viz._sizeKey, undefined, "an accessor has no key");
});

it("estimateCartogramScale sizes the legend before layout, none when sizes don't differ", () => {
  const viz = laidOut({cartogram: "dorling"});
  const scale = estimateCartogramScale(viz, {width: 800, height: 500});
  const values = population.map(d => d.Population);
  assert.deepStrictEqual(scale.domain(), [
    Math.min(...values),
    Math.max(...values),
  ]);
  assert.ok(scale(Math.max(...values)) > 0);
  viz._filteredData = population.map(d => ({...d, Population: 5}));
  assert.strictEqual(
    estimateCartogramScale(viz, {width: 800, height: 500}),
    null,
  );
});

it("drawnCartogramScale matches the shapes drawn, and a Dorling Geomap paints its legend with it", () => {
  for (const kind of ["dorling", "demers"]) {
    const viz = laidOut({cartogram: kind});
    const {topoData, cartogram} = viz.ctx.geomapCtx;
    const scale = drawnCartogramScale(viz, topoData, cartogram);
    for (const id of ["04000US06", "04000US56", "04000US36"]) {
      const value = population.find(d => d["State ID"] === id).Population;
      assert.ok(
        Math.abs(scale(value) - cartogram.get(id).r) < 1e-6,
        `${kind} ${id}`,
      );
    }
    assert.strictEqual(viz._sizeLegendFinal(39538223), scale(39538223));
  }
  const plain = laidOut({cartogram: false});
  assert.strictEqual(plain._sizeLegendFinal, null);
});

it("cartogramAnchors lists each shape's center and radius by id", () => {
  const anchors = cartogramAnchors(
    new Map([
      [6, {d: "", x: 10, y: 20, r: 5, square: false}],
      ["ny", {d: "", x: 1, y: 2, r: 0, square: false}],
    ]),
  );
  assert.deepStrictEqual(anchors.get("6"), {at: [10, 20], r: 5});
  assert.deepStrictEqual(anchors.get("ny"), {at: [1, 2], r: 0});
});

it("links on a cartogram run between the shapes' centers, leaving out other ends", () => {
  const links = [
    {source: "04000US06", target: "04000US48"},
    {source: "04000US06", target: [-74, 40.7]},
    {source: "nowhere", target: "04000US48"},
  ];
  const viz = laidOut({cartogram: "dorling", links});
  const {flowLinks, cartogram} = viz.ctx.geomapCtx;
  assert.strictEqual(flowLinks.length, 1);
  const [link] = flowLinks;
  const ca = cartogram.get("04000US06"),
    tx = cartogram.get("04000US48");
  assert.deepStrictEqual(link.sourceAt, [ca.x, ca.y]);
  assert.deepStrictEqual(link.targetAt, [tx.x, tx.y]);
  assert.strictEqual(link.source.r, ca.r, "stops at the circle's outline");
  assert.deepStrictEqual(link.points[0], [ca.x, ca.y]);
  assert.deepStrictEqual(link.points.at(-1), [tx.x, tx.y]);
  const map = laidOut({cartogram: false, links});
  assert.strictEqual(
    map.ctx.geomapCtx.flowLinks.length,
    2,
    "both drawn on the map",
  );
});
