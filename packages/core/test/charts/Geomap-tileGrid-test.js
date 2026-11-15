import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {pathRings} from "@d3plus/render";

import {useJsdom} from "~test/jsdom.js";
import {Geomap, TileGridMap} from "../../index.ts";
import {tileGridMapDef} from "../../src/charts/TileGridMap/index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {
  TILE_GRID_FONT_MAX,
  US_STATES_TILE_GRID,
  geomapTileGrid,
  hexPathD,
  regionsReshaped,
  tileGridFields,
  tileGridOcean,
  tileGridOf,
  tileGridRegions,
  tileGridShapes,
  usStateKey,
} from "../../src/charts/Geomap/tileGrid.ts";
import {cartogramLabels} from "../../src/charts/Geomap/cartogramLabels.ts";
import {DEFAULT_OCEAN} from "../../src/charts/Geomap/basemapTheme.ts";
import {tilesShown} from "../../src/charts/Geomap/tileState.ts";
import {dotDensitySettings} from "../../src/charts/Geomap/dotDensityLayout.ts";
import {geoHexbinSettings} from "../../src/charts/Geomap/geoHexbin.ts";
import {geomapEmit} from "../../src/charts/Geomap/emit.ts";

useJsdom();

/**
    Geomap's `tileGrid`: each region an equal hexagon or square at a fixed
    cell, the built-in US states layout and its id matching, and how the
    grid turns the map's other layers off.
*/

const read = file =>
  JSON.parse(
    readFileSync(new URL(`../../dev/charts/Geomap/${file}`, import.meta.url)),
  );
const states = read("State.json");
const population = read("state-population.json");

it("US_STATES_TILE_GRID places the 50 states and DC in distinct cells", () => {
  const keys = Object.keys(US_STATES_TILE_GRID);
  assert.strictEqual(keys.length, 51);
  const cells = new Set(keys.map(k => US_STATES_TILE_GRID[k].join(",")));
  assert.strictEqual(cells.size, 51);
  // West stays west of east, and north above south.
  const [ca, ny] = [US_STATES_TILE_GRID.CA, US_STATES_TILE_GRID.NY];
  assert.ok(ca[0] < ny[0]);
  assert.ok(US_STATES_TILE_GRID.MN[1] < US_STATES_TILE_GRID.TX[1]);
});

it("usStateKey finds a state by abbreviation, FIPS code, or an id ending in it", () => {
  assert.strictEqual(usStateKey("CA"), "CA");
  assert.strictEqual(usStateKey("ca"), "CA");
  assert.strictEqual(usStateKey("06"), "CA");
  assert.strictEqual(usStateKey(6), "CA");
  assert.strictEqual(usStateKey("04000US06"), "CA");
  assert.strictEqual(usStateKey("11"), "DC");
  assert.strictEqual(usStateKey("72"), undefined, "Puerto Rico has no cell");
  assert.strictEqual(usStateKey("ZZ"), undefined);
  assert.strictEqual(usStateKey(undefined), undefined);
  // Every state's FIPS code finds its own cell.
  for (const d of population)
    assert.ok(usStateKey(d["State ID"]) === d.Abbr, d.Abbr);
});

it("tileGridOf resolves a built-in layout or one of the user's, off by default", () => {
  const viz = new Geomap();
  assert.strictEqual(tileGridOf(viz), null);
  viz.tileGrid("us-states");
  const us = tileGridOf(viz);
  assert.deepStrictEqual(
    [us.builtin, us.shape, us.padding, us.key("04000US36")],
    [true, "hex", 2, "NY"],
  );
  viz
    .tileGrid({a: [0, 0], 7: [1, 0]})
    .tileGridShape("square")
    .tileGridPadding(-3);
  const own = tileGridOf(viz);
  assert.deepStrictEqual(
    [
      own.builtin,
      own.shape,
      own.padding,
      own.key("a"),
      own.key(7),
      own.key("b"),
    ],
    [false, "square", 0, "a", "7", undefined],
  );
  viz.tileGrid("nowhere");
  assert.strictEqual(tileGridOf(viz), null, "an unknown name");
});

it("regionsReshaped is on for a cartogram or a tile grid", () => {
  const viz = new Geomap();
  assert.strictEqual(regionsReshaped(viz), false);
  viz.tileGrid("us-states");
  assert.strictEqual(regionsReshaped(viz), true);
  viz.tileGrid(false).cartogram("dorling");
  assert.strictEqual(regionsReshaped(viz), true);
});

it("hexPathD draws a pointy-top hexagon around the center", () => {
  const ring = pathRings(hexPathD(10, 20, 5))[0];
  assert.strictEqual(ring.length, 6);
  assert.deepStrictEqual(ring[0], [10, 15], "the top corner");
  for (const [x, y] of ring)
    assert.ok(Math.abs(Math.hypot(x - 10, y - 20) - 5) < 0.01);
});

it("tileGridShapes fits equal tiles in the bounds, centered, odd rows shifted half a tile", () => {
  const cells = [
    {id: "a", col: 0, row: 0},
    {id: "b", col: 1, row: 0},
    {id: "c", col: 0, row: 1},
  ];
  for (const shape of ["hex", "square"]) {
    const shapes = tileGridShapes(cells, [0, 0, 300, 200], shape, 0);
    const [a, b, c] = ["a", "b", "c"].map(k => shapes.get(k));
    assert.ok(a.r === b.r && b.r === c.r, `${shape}: equal`);
    assert.strictEqual(a.square, shape === "square");
    const step = b.x - a.x;
    assert.ok(
      Math.abs(c.x - a.x - step / 2) < 1e-9,
      `${shape}: odd row shifted`,
    );
    assert.ok(c.y > a.y);
    const rings = [a, b, c].map(s => pathRings(s.d)[0]);
    const xs = rings.flat().map(p => p[0]),
      ys = rings.flat().map(p => p[1]);
    assert.ok(Math.min(...xs) >= -0.01 && Math.max(...xs) <= 300.01);
    assert.ok(Math.min(...ys) >= -0.01 && Math.max(...ys) <= 200.01);
    // Centered: the same room on either side of whichever axis has spare.
    const spareX = Math.min(...xs) + (300 - Math.max(...xs));
    const spareY = Math.min(...ys) + (200 - Math.max(...ys));
    assert.ok(
      Math.abs(Math.min(...xs) - (300 - Math.max(...xs))) < 0.01 ||
        spareX < 0.01,
    );
    assert.ok(
      Math.abs(Math.min(...ys) - (200 - Math.max(...ys))) < 0.01 ||
        spareY < 0.01,
    );
  }
  const padded = tileGridShapes(cells, [0, 0, 300, 200], "square", 10);
  const [a, b] = ["a", "b"].map(k => padded.get(k));
  assert.ok(Math.abs(b.x - b.r - (a.x + a.r) - 10) < 1e-9, "a 10px gap");
  assert.strictEqual(tileGridShapes([], [0, 0, 1, 1], "hex").size, 0);
});

it("tileGridRegions makes a region per cell, joined to the row naming it", () => {
  const grid = {
    layout: {CA: [0, 0], NY: [1, 0]},
    key: usStateKey,
  };
  const row = {id: "06", v: 1};
  const regions = tileGridRegions(grid, {"06": row, 99: {id: "99"}});
  assert.deepStrictEqual(
    regions.map(r => [r.id, r.data]),
    [
      ["06", row],
      ["NY", undefined],
    ],
  );
  assert.ok(
    regions.every(r => r.__d3plus__ && r.feature.geometry === null),
    "a feature with no geometry",
  );
});

/** Runs Geomap's layout over the states with `config`. */
function laidOut(config = {}, rows = population) {
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
  viz._filteredData = rows;
  viz._drawDepth = 0;
  viz._id = d => d["State ID"];
  viz._ids = d => [d["State ID"]];
  viz._drawLabel = d => d.State ?? "";
  applyGeomapLayout({viz});
  return viz;
}

it("geomapTileGrid gives every state in the layout a tile, with or without data", () => {
  const viz = laidOut(
    {tileGrid: "us-states"},
    population.filter(d => d.Abbr !== "TX"),
  );
  const shapes = viz.ctx.geomapCtx.cartogram;
  assert.strictEqual(shapes.size, 51);
  assert.ok(shapes.has("04000US48"), "Texas, without data");
  assert.ok(!shapes.has("04000US72"), "Puerto Rico has no cell");
  const ca = shapes.get("04000US06"),
    ny = shapes.get("04000US36");
  assert.ok(ca.x < ny.x && ca.r === ny.r);
  for (const s of shapes.values())
    for (const [x, y] of pathRings(s.d)[0]) {
      assert.ok(x >= 19.5 && x <= 780.5, "inside the padding");
      assert.ok(y >= 19.5 && y <= 480.5);
    }
  assert.strictEqual(
    geomapTileGrid(laidOut(), viz.ctx.geomapCtx.topoData, [0, 0, 1, 1]),
    null,
  );
});

it("a tile grid without a topojson draws a tile per cell, joined to the data", () => {
  const viz = laidOut({tileGrid: "us-states", topojson: false});
  const {topoData, cartogram} = viz.ctx.geomapCtx;
  assert.strictEqual(topoData.length, 51);
  assert.strictEqual(cartogram.size, 51);
  const ca = topoData.find(t => t.id === "04000US06");
  assert.strictEqual(ca.data.Abbr, "CA");
  const nodes = geomapEmit({viz});
  const paths = nodes.filter(n => n.key.startsWith("geomap-path-"));
  assert.strictEqual(paths.length, 51);
  const labels = nodes.filter(
    n => n.type === "text" && n.key.startsWith("geomap-cartogram-label-"),
  );
  assert.ok(labels.length > 40, "labeled");
  const caLabel = labels.find(n =>
    n.key.startsWith("geomap-cartogram-label-04000US06"),
  );
  assert.deepStrictEqual(
    caLabel.lines.map(l => l.text),
    ["CA"],
    "the abbreviation",
  );
});

it("a tile grid leaves out points, links, dots, bins and the tiles, and takes a cartogram's place", () => {
  const viz = laidOut(
    {
      tileGrid: "us-states",
      cartogram: "dorling",
      dotDensity: {value: "Population"},
      hexbin: true,
      tiles: true,
      point: d => d.point,
      links: [{source: "04000US06", target: "04000US48"}],
    },
    [...population, {"State ID": "pt", point: [-100, 40], Population: 1}],
  );
  const c = viz.ctx.geomapCtx;
  assert.ok([...c.cartogram.values()].every(s => !s.square && s.r > 0));
  const ring = pathRings(c.cartogram.get("04000US06").d)[0];
  assert.strictEqual(ring.length, 6, "hexagons, not Dorling circles");
  assert.deepStrictEqual(c.pointData, []);
  assert.deepStrictEqual(c.flowLinks, []);
  assert.deepStrictEqual(c.density, {dots: null, bins: null});
  assert.strictEqual(dotDensitySettings(viz), null);
  assert.strictEqual(geoHexbinSettings(viz), null);
  assert.strictEqual(tilesShown(viz), false);
});

it("cartogramLabels can label regions without data, with text of its own", () => {
  const viz = laidOut({tileGrid: "us-states", topojson: false}, []);
  const c = viz.ctx.geomapCtx;
  const config = {fill: "#eee"};
  assert.deepStrictEqual(
    cartogramLabels(viz, c.topoData, c.cartogram, config),
    [],
    "no data, no labels",
  );
  const nodes = cartogramLabels(viz, c.topoData, c.cartogram, config, {
    all: true,
    text: r => `#${r.id}`,
  });
  const texts = nodes.filter(n => n.type === "text");
  assert.ok(texts.length > 40);
  assert.ok(texts.some(n => n.lines.map(l => l.text).join("") === "#CA"));
});

it("tileGridFields declares the tile grid, hexagons with a 2px gap by default", () => {
  assert.deepStrictEqual(
    tileGridFields().map(f => [f.key, f.default]),
    [
      ["tileGrid", false],
      ["tileGridShape", "hex"],
      ["tileGridPadding", 2],
    ],
  );
});

it("tileGridOcean drops the default ocean behind a tile grid, but not one that is set", () => {
  const viz = new Geomap();
  assert.strictEqual(tileGridOcean(viz), DEFAULT_OCEAN);
  viz.tileGrid("us-states");
  assert.strictEqual(tileGridOcean(viz), "transparent");
  viz.ocean("#cde");
  assert.strictEqual(tileGridOcean(viz), "#cde");
});

it("TileGridMap is a Geomap drawing the US states tile grid by default", () => {
  const viz = new TileGridMap();
  assert.ok(viz instanceof Geomap);
  assert.strictEqual(viz.tileGrid(), "us-states");
  assert.strictEqual(viz.tileGridShape(), "hex");
  viz.tileGrid({a: [0, 0]});
  assert.deepStrictEqual(viz.tileGrid(), {a: [0, 0]});
  assert.strictEqual(new Geomap().tileGrid(), false, "Geomap's own is off");
  assert.deepStrictEqual(
    tileGridMapDef.fields.map(f => [f.key, f.default]),
    [["tileGrid", "us-states"]],
  );
});

it("a TileGridMap lays out a tile per state without a topojson", () => {
  const viz = new TileGridMap().config({
    width: 800,
    height: 500,
    groupBy: "State ID",
    colorScale: "Population",
    legend: false,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = population;
  viz._drawDepth = 0;
  viz._id = d => d["State ID"];
  viz._ids = d => [d["State ID"]];
  viz._drawLabel = d => d.State ?? "";
  applyGeomapLayout({viz});
  assert.strictEqual(viz.ctx.geomapCtx.cartogram.size, 51);
});

it("tile-grid labels grow no larger than TILE_GRID_FONT_MAX", () => {
  const viz = laidOut({
    tileGrid: "us-states",
    topojson: false,
    width: 2400,
    height: 1500,
  });
  const texts = geomapEmit({viz}).filter(
    n => n.type === "text" && n.key.startsWith("geomap-cartogram-label-"),
  );
  assert.ok(texts.length > 40);
  for (const n of texts)
    assert.ok(n.font.size <= TILE_GRID_FONT_MAX, `${n.key}: ${n.font.size}`);
  assert.ok(
    texts.some(n => n.font.size === TILE_GRID_FONT_MAX),
    "the cap is reached",
  );
  assert.strictEqual(TILE_GRID_FONT_MAX, 14);
});
