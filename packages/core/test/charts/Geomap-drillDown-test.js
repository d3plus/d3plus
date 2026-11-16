import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {color} from "d3-color";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {
  applyGeomapLayout,
  drillZooms,
} from "../../src/charts/Geomap/applyLayout.ts";
import {
  drillBounds,
  drillEntries,
  drillKey,
  drillParentRegions,
  drillParentRows,
  drillsOnMap,
  fitTopojson,
  geomapDrill,
  geomapDrillLayout,
  levelFeatures,
  topojsonAt,
  topojsonKeyAt,
} from "../../src/charts/Geomap/drillDown.ts";
import {
  DRILL_NEIGHBOR_OPACITY,
  drillRegionKey,
  emitDrillRegions,
} from "../../src/charts/Geomap/drillEmit.ts";
import {
  installDrillEvents,
  switchDrill,
  syncDrillZoom,
} from "../../src/charts/Geomap/drillEvents.ts";
import {geomapEmit} from "../../src/charts/Geomap/emit.ts";
import {geomapPointClusters} from "../../src/charts/Geomap/pointClusterLayout.ts";
import {
  isPointRow,
  levelDrawsRegions,
} from "../../src/charts/Geomap/pointRows.ts";
import {geomapTopojson} from "../../src/charts/Geomap/topojsonLevels.ts";
import {dataRows} from "../../src/charts/features/featuresColorScale.ts";
import {syncDensityColorScale} from "../../src/charts/Geomap/densityFields.ts";
import {linkTooltipConfig} from "../../src/charts/features/linkInteraction.ts";
import {colorScaleHoverValue} from "../../src/charts/features/colorScaleHover.ts";
import {
  GROUP_DEPTH_KEY,
  GROUP_LABEL_KEY,
} from "../../src/charts/viz/groupRow.ts";
import {hasOwnClick, hasUserClick} from "../../src/charts/viz/userClick.ts";

useJsdom();

/**
    Geomap's geographic drill-down: a topojson per `groupBy` level, the
    regions drilled into and their neighbors at the level above, the
    projection fit, and the neighbor click that switches the drill.
*/

const read = file =>
  JSON.parse(
    readFileSync(new URL(`../../dev/charts/Geomap/${file}`, import.meta.url)),
  );
const states = read("State.json");
const counties = read("County.json");
const stateRows = read("state-population.json");
const stateById = new Map(stateRows.map(d => [d["State ID"], d]));

/** Each county, carrying its state. */
const countyRows = read("county-population.json")
  .map(d => {
    const state = stateById.get(`04000US${d["County ID"].slice(7, 9)}`);
    return state && {...d, "State ID": state["State ID"], State: state.State};
  })
  .filter(Boolean);

const TX = "04000US48";
const OK = "04000US40";
const inTexas = d => d["State ID"] === TX;

/** A drill-down Geomap of states and counties, prepared for a draw. */
function chart(config = {}) {
  const viz = new Geomap().config({
    width: 800,
    height: 500,
    tiles: false,
    topojson: [states, counties],
    projection: "geoAlbersUsa",
    groupBy: ["State ID", "County ID"],
    label: d => (typeof d.County === "string" ? d.County : d.State),
    colorScale: "Population",
    legend: false,
    depth: 0,
    ...config,
  });
  viz._data = countyRows;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  return viz;
}

/** Drills `viz` into a state, as a click does, and lays it out. */
function drillInto(viz, id = TX) {
  viz._history.push({depth: 0, filter: undefined, groupId: id, groupDepth: 0});
  viz.config({depth: 1, filter: d => d["State ID"] === id});
  return laidOut(viz);
}

/** Runs the data prep and Geomap's layout. */
function laidOut(viz) {
  viz._preDraw();
  applyGeomapLayout({viz});
  return viz;
}

it("topojsonAt reads a list's level (none past its end) or the one topojson", () => {
  assert.strictEqual(topojsonAt([states, counties], 0), states);
  assert.strictEqual(topojsonAt([states, counties], 1), counties);
  assert.strictEqual(topojsonAt([states], 1), null);
  assert.strictEqual(topojsonAt(states, 3), states);
  assert.strictEqual(topojsonAt("./State.json", 0), null, "not loaded");
  assert.strictEqual(topojsonAt(false, 0), null);
  assert.strictEqual(topojsonAt([false, counties], 0), null);
});

it("topojsonKeyAt reads a list's key for a level, or the one key", () => {
  assert.strictEqual(topojsonKeyAt(["states", "counties"], 1), "counties");
  assert.strictEqual(topojsonKeyAt("states", 1), "states");
  assert.strictEqual(topojsonKeyAt(undefined, 0), undefined);
});

it("fitTopojson fits a list's first loaded level, or the one topojson", () => {
  assert.deepStrictEqual(fitTopojson([states, counties]), {
    topo: states,
    depth: 0,
  });
  assert.deepStrictEqual(fitTopojson([null, counties]), {
    topo: counties,
    depth: 1,
  });
  assert.deepStrictEqual(fitTopojson(states), {topo: states, depth: 0});
  assert.strictEqual(fitTopojson(["./x.json"]), null);
  assert.strictEqual(fitTopojson(false), null);
});

it("geomapTopojson keeps a list of one file a list once it loads", () => {
  const viz = new Geomap();
  viz.topojson(["./State.json"]);
  // Loading a list of one file stores just the file.
  viz.schema.topojson = states;
  assert.deepStrictEqual(geomapTopojson(viz), [states]);
  assert.deepStrictEqual(viz.topojson(), [states]);
  viz.topojson(states);
  assert.strictEqual(geomapTopojson(viz), states);
  viz.topojson([states, counties]);
  assert.deepStrictEqual(geomapTopojson(viz), [states, counties]);
});

it("levelFeatures reads a level's features through topojsonFilter", () => {
  const viz = chart({topojsonFilter: f => f.id !== TX});
  assert.strictEqual(levelFeatures(viz, 0).length, 55);
  assert.strictEqual(levelFeatures(viz, 1).length, 3231);
  assert.deepStrictEqual(levelFeatures(viz, 2), []);
  const keyed = chart({topojson: [states, states], topojsonKey: ["states"]});
  assert.strictEqual(levelFeatures(keyed, 1).length, 56);
});

it("levelDrawsRegions and isPointRow: a listed level draws its rows as regions", () => {
  const point = {point: [-97, 31]};
  const viz = chart({point: d => d.point});
  viz._drawDepth = 0;
  assert.ok(levelDrawsRegions(viz));
  assert.ok(!isPointRow(viz, point, 0));
  viz._drawDepth = 2;
  assert.ok(!levelDrawsRegions(viz), "past the list");
  assert.ok(isPointRow(viz, point, 0));
  assert.ok(!isPointRow(viz, {}, 0));
  const single = chart({topojson: states, point: d => d.point});
  single._drawDepth = 0;
  assert.ok(!levelDrawsRegions(single), "one topojson keeps its points");
  assert.ok(isPointRow(single, point, 0));
});

it("drillEntries lists the drill-downs on a Back history, oldest first", () => {
  const a = {depth: 0, groupId: TX, groupDepth: 0};
  const b = {depth: 1, groupId: "x", groupDepth: 1};
  const legend = {kind: "legend", hidden: [], solo: []};
  assert.deepStrictEqual(drillEntries([a, legend, b]), [a, b]);
  assert.deepStrictEqual(drillEntries(undefined), []);
});

it("drillsOnMap needs a topojson list and regions drawn as themselves", () => {
  assert.ok(drillsOnMap(chart()));
  assert.ok(!drillsOnMap(chart({topojson: states})));
  assert.ok(!drillsOnMap(chart({cartogram: "dorling"})));
  assert.ok(!drillsOnMap(chart({tileGrid: "us-states"})));
  assert.ok(!drillsOnMap(chart({dotDensity: {value: "Population"}})));
});

it("geomapDrill reads the newest drill-down one level above the one drawn", () => {
  const viz = chart();
  laidOut(viz);
  assert.strictEqual(geomapDrill(viz), null, "nothing drilled");
  drillInto(viz);
  const drill = geomapDrill(viz);
  assert.strictEqual(drill.depth, 0);
  assert.deepStrictEqual([...drill.ids], [TX]);
  assert.strictEqual(drill.entry, viz._history[0]);
  assert.strictEqual(drill.nested, false);
  // A legend click after the drill leaves it in place.
  viz._history.push({kind: "legend", hidden: [], solo: []});
  assert.ok(geomapDrill(viz));
  // A threshold bucket's id lists its regions.
  viz._history[0].groupId = [TX, OK];
  assert.deepStrictEqual([...geomapDrill(viz).ids], [TX, OK]);
  // Without a topojson list, or drawn at the top level, there is none.
  viz.topojson(counties);
  assert.strictEqual(geomapDrill(viz), null);
  const top = chart({depth: 1});
  laidOut(top);
  assert.strictEqual(geomapDrill(top), null, "drawn at depth 1 by hand");
});

it("drillParentRows merges each region's rows into a group row at its level", () => {
  const viz = drillInto(chart());
  const rows = drillParentRows(viz, geomapDrill(viz));
  assert.strictEqual(rows.size, 51);
  const ok = rows.get(OK);
  assert.strictEqual(ok[GROUP_DEPTH_KEY], 0);
  assert.strictEqual(ok[GROUP_LABEL_KEY], "Oklahoma");
  const okTotal = countyRows
    .filter(d => d["State ID"] === OK)
    .reduce((s, d) => s + d.Population, 0);
  assert.strictEqual(ok.Population, okTotal);
  // The filter before the drill narrows them.
  viz._history[0].filter = d => d["State ID"] !== OK;
  assert.ok(!drillParentRows(viz, geomapDrill(viz)).has(OK));
});

it("drillParentRegions draws the level as it was drawn, the drilled region active", () => {
  const viz = drillInto(chart());
  const drill = geomapDrill(viz);
  const regions = drillParentRegions(viz, drill, drillParentRows(viz, drill));
  assert.strictEqual(regions.length, 56, "every state");
  const tx = regions.find(r => r.id === TX);
  assert.ok(tx.active && tx.data);
  assert.ok(!regions.find(r => r.id === OK).active);
  assert.ok(
    regions.some(r => !r.data),
    "regions without data stay drawn",
  );
  // A level that was itself drilled into drew only its regions with data.
  const nested = drillParentRegions(viz, {...drill, nested: true}, new Map());
  assert.deepStrictEqual(
    nested.map(r => r.id),
    [TX],
  );
});

it("drillBounds frames the regions drilled into", () => {
  const bounds = f => f.box;
  const regions = [
    {
      active: true,
      box: [
        [10, 20],
        [30, 40],
      ],
    },
    {
      active: true,
      box: [
        [0, 30],
        [20, 60],
      ],
    },
    {
      active: false,
      box: [
        [-100, -100],
        [500, 500],
      ],
    },
  ].map(r => ({...r, feature: r}));
  assert.deepStrictEqual(drillBounds(regions, bounds), [
    [0, 20],
    [30, 60],
  ]);
  assert.strictEqual(drillBounds(regions.slice(2), bounds), null);
  assert.strictEqual(
    drillBounds(
      [
        {
          active: true,
          feature: {
            box: [
              [NaN, 0],
              [1, 1],
            ],
          },
        },
      ],
      bounds,
    ),
    null,
  );
});

it("drillKey names the drill's level, regions, and chart size", () => {
  const layout = {drill: {depth: 0, ids: new Set([TX, OK])}, regions: []};
  assert.strictEqual(drillKey(layout, 800, 500), `0:${OK}|${TX}:800x500`);
});

it("geomapDrillLayout pairs the drill with its level's regions", () => {
  assert.strictEqual(geomapDrillLayout(laidOut(chart())), null);
  const layout = geomapDrillLayout(drillInto(chart()));
  assert.strictEqual(layout.drill.depth, 0);
  assert.strictEqual(layout.regions.length, 56);
});

it("a drilled map draws the region's children above it and its neighbors", () => {
  const viz = drillInto(chart());
  const {topoData, drill} = viz.ctx.geomapCtx;
  assert.strictEqual(topoData.length, 254, "Texas's counties only");
  assert.ok(topoData.every(d => inTexas(d.data)));
  assert.strictEqual(drill.regions.length, 56);
  const [[x0, y0], [x1, y1]] = drill.bounds;
  assert.ok(x1 - x0 > 50 && x1 - x0 < 400, "Texas's box, at the national fit");
  assert.ok(y1 > y0);
  const nodes = geomapEmit({viz});
  const tx = nodes.find(n => n.key === `geomap-path-${TX}`);
  const ok = nodes.find(n => n.key === `geomap-path-${OK}`);
  assert.deepStrictEqual(
    [tx.interactive, tx.paint.opacity, ok.interactive, ok.paint.opacity],
    [false, 1, true, DRILL_NEIGHBOR_OPACITY],
  );
  assert.strictEqual(ok.datum[GROUP_DEPTH_KEY], 0);
  assert.strictEqual(ok.aria.label, "Oklahoma.");
  assert.strictEqual(ok.paint.fill, "#f5f5f3", "the fill of no data");
  // The states lie beneath the counties.
  const first = nodes.findIndex(n => n.key.startsWith("geomap-path-05000"));
  assert.ok(nodes.indexOf(ok) < first && nodes.indexOf(tx) < first);
});

it("a drilled map that zooms keeps its national fit; one that can't fits the region", () => {
  const zooms = drillInto(chart());
  assert.ok(drillZooms(zooms));
  assert.strictEqual(zooms.ctx.fitDrill, "");
  const scale = zooms.schema.projection.scale();
  const fitted = drillInto(chart({zoom: false}));
  assert.ok(!drillZooms(fitted));
  assert.strictEqual(fitted.ctx.fitDrill, `0:${TX}`);
  assert.ok(fitted.schema.projection.scale() > scale * 2, "zoomed to Texas");
  // Back at the top level, it fits the nation again.
  fitted._history = [];
  fitted.config({depth: 0, filter: false});
  laidOut(fitted);
  assert.strictEqual(fitted.ctx.fitDrill, "");
  assert.ok(Math.abs(fitted.schema.projection.scale() - scale) < 1);
});

it("the projection fits a topojson list's first level at every depth", () => {
  const top = laidOut(chart());
  const scale = top.schema.projection.scale();
  const counties1 = laidOut(chart({depth: 1}));
  assert.ok(Math.abs(counties1.schema.projection.scale() - scale) < 1);
  assert.strictEqual(counties1.ctx.geomapCtx.topoData.length, 3231);
});

it("drillZooms: off without zoom, in small multiples, and in a server render", () => {
  const viz = chart();
  assert.ok(drillZooms(viz));
  viz._facetStep = "panel";
  assert.ok(!drillZooms(viz));
  viz._facetStep = undefined;
  viz._ssr = true;
  assert.ok(!drillZooms(viz));
});

it("drillRegionKey keeps a region's key unless a child shares its id", () => {
  assert.strictEqual(drillRegionKey(TX, new Set(["a"])), `geomap-path-${TX}`);
  assert.strictEqual(drillRegionKey("a", new Set(["a"])), "geomap-drill-a");
});

it("emitDrillRegions outlines regions a shade lighter over a dark basemap", () => {
  const viz = drillInto(chart({topojsonNeighborOpacity: 0.25}));
  const scene = viz.ctx.geomapCtx.drill;
  const pathD = () => "M0,0L1,0L1,1Z";
  const light = emitDrillRegions(viz, scene, pathD);
  const neighbor = light.find(n => n.key === `geomap-path-${OK}`);
  assert.strictEqual(neighbor.paint.opacity, 0.25);
  viz._basemapDark = true;
  const dark = emitDrillRegions(viz, scene, pathD).find(
    n => n.key === `geomap-path-${OK}`,
  );
  assert.strictEqual(dark.paint.fill, "#3d3e44");
  assert.ok(color(dark.paint.stroke).r > 0x3d, "lighter than the fill");
  // A region whose path doesn't project draws nothing.
  assert.deepStrictEqual(
    emitDrillRegions(viz, scene, () => null),
    [],
  );
});

it("switchDrill moves the drill to a neighbor in place of the region", () => {
  const viz = drillInto(chart());
  let rendered = 0;
  viz.render = () => (rendered++, viz);
  const ok = drillParentRows(viz, geomapDrill(viz)).get(OK);
  assert.ok(switchDrill(viz, ok));
  assert.strictEqual(rendered, 1);
  assert.strictEqual(viz._history.length, 1, "Back still goes up a level");
  assert.strictEqual(viz._history[0].groupId, OK);
  const filter = viz.schema.filter;
  assert.ok(filter({"State ID": OK}, 0) && !filter({"State ID": TX}, 0));
  // The region drilled into, a child, or an undrilled map: not a switch.
  laidOut(viz);
  assert.ok(switchDrill(viz, drillParentRows(viz, geomapDrill(viz)).get(OK)));
  assert.strictEqual(rendered, 1, "already drilled into");
  assert.ok(!switchDrill(viz, countyRows[0]));
  assert.ok(!switchDrill(laidOut(chart()), ok));
});

it("installDrillEvents puts the neighbor click before the chart's own", () => {
  const viz = chart();
  installDrillEvents(viz);
  assert.ok(hasOwnClick(viz, "click.shape"), "the pointer and note stay");
  const calls = [];
  viz.schema.on["click.shape"] = (...a) => calls.push(a);
  installDrillEvents(viz);
  assert.ok(!hasOwnClick(viz, "click.shape"), "a user's handler stays theirs");
  assert.ok(hasUserClick(viz, "click.shape"));
  viz.schema.on["click.shape"](countyRows[0], 0, undefined, {});
  assert.strictEqual(calls.length, 1, "not a neighbor: passed on");
});

it("syncDrillZoom does nothing on a map that can't zoom", () => {
  const viz = drillInto(chart());
  syncDrillZoom(viz);
  assert.strictEqual(viz.ctx.drillZoomKey, undefined, "not rendered yet");
});

it("dataRows rolls the data up to a depth", () => {
  const viz = laidOut(chart());
  assert.strictEqual(dataRows(viz, 0).length, 51);
  assert.strictEqual(dataRows(viz).length, countyRows.length);
});

it("a drill-down map's colorScale reads the level drawn", () => {
  const viz = laidOut(chart());
  syncDensityColorScale(viz);
  assert.strictEqual(viz._colorScaleRows().length, 51, "states");
  drillInto(viz);
  syncDensityColorScale(viz);
  assert.strictEqual(
    viz._colorScaleRows().length,
    countyRows.length,
    "every county, through the drill",
  );
  const single = laidOut(chart({topojson: states}));
  syncDensityColorScale(single);
  assert.strictEqual(single._colorScaleRows, undefined);
});

it("a neighbor marks nothing on the colorScale, a child its value", () => {
  const viz = drillInto(chart());
  const nodes = geomapEmit({viz});
  const ok = nodes.find(n => n.key === `geomap-path-${OK}`);
  const harris = nodes.find(n => n.key === "geomap-path-05000US48201");
  viz._colorScaleClass = {hover: () => undefined};
  assert.strictEqual(colorScaleHoverValue(viz, ok), null);
  assert.strictEqual(
    colorScaleHoverValue(viz, harris),
    harris.datum.data?.Population ?? harris.datum.Population,
  );
});

it("a group row titles its tooltip with its own label", () => {
  const viz = drillInto(chart());
  const ok = drillParentRows(viz, geomapDrill(viz)).get(OK);
  assert.strictEqual(linkTooltipConfig(viz).title(ok, 0), "Oklahoma");
});

it("geomapPointClusters clusters points that don't overlap when asked", () => {
  const viz = new Geomap().config({
    projection: "geoAlbersUsa",
    point: d => d.point,
  });
  const rows = [{point: [-120, 40]}, {point: [-75, 40]}];
  assert.strictEqual(
    geomapPointClusters(viz, rows, () => 5),
    null,
  );
  const state = geomapPointClusters(viz, rows, () => 5, 1, true);
  assert.strictEqual(state.rows.length, 2);
});
