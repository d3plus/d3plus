import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {bundleFlowLinks} from "../../src/charts/Geomap/flowLinks.ts";
import {flowLinkBox} from "../../src/charts/Geomap/flowEvents.ts";
import {
  polylineBox,
  polylinePath,
} from "../../src/charts/Geomap/flowGeometry.ts";

useJsdom();

/**
    Geomap's `linkBundle`: on a flat map, links the projection draws
    unbroken take bundled paths between their ends (their label, arrows,
    and focus box follow); a globe, and a link the projection cuts, keep
    their great-circle paths.
*/

/** Four western and four eastern cities, each western one flying east. */
const west = [
  {id: "W0", point: [-120, 30]},
  {id: "W1", point: [-120, 34]},
  {id: "W2", point: [-120, 38]},
  {id: "W3", point: [-120, 42]},
];
const east = [
  {id: "E0", point: [-80, 30]},
  {id: "E1", point: [-80, 34]},
  {id: "E2", point: [-80, 38]},
  {id: "E3", point: [-80, 42]},
];
const far = [
  {id: "SYD", point: [151.2, -33.9]},
  {id: "LAX", point: [-118.2, 34]},
];
const links = [
  ...west.map((w, k) => ({source: w.id, target: east[k].id})),
  {source: "SYD", target: "LAX"},
];

/** Runs Geomap's layout over the cities with `config`. */
function laidOut(config = {}) {
  const viz = new Geomap().config({
    width: 600,
    height: 400,
    tiles: false,
    topojson: false,
    point: d => d.point,
    legend: false,
    links,
    ...config,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = [...west, ...east, ...far];
  viz._id = d => d.id;
  viz._drawLabel = d => d.id;
  applyGeomapLayout({viz});
  return viz;
}

const flows = viz => viz.ctx.geomapCtx.flowLinks;

it("linkBundle bundles a flat map's links between their ends", () => {
  const plain = flows(laidOut());
  const viz = laidOut({linkBundle: true});
  const bundled = flows(viz);
  assert.strictEqual(viz.ctx.linkBundleCache.runs, 1);
  for (let k = 0; k < 4; k++) {
    const a = plain[k];
    const b = bundled[k];
    assert.notDeepStrictEqual(b.points, a.points, "a new path");
    assert.deepStrictEqual(b.points[0], a.points[0], "from the same start");
    assert.deepStrictEqual(b.points.at(-1), a.points.at(-1), "to the same end");
    assert.strictEqual(b.d, polylinePath(b.points));
    assert.deepStrictEqual(b.box, polylineBox(b.points));
    assert.deepStrictEqual(flowLinkBox(viz, b.datum), b.box, "focus box");
  }
  // The outer flows bend in toward the others.
  const midY = l => l.points[Math.floor(l.points.length / 2)][1];
  const [top, , , bottom] = bundled;
  const [topPlain, , , bottomPlain] = plain;
  assert.ok(
    Math.abs(midY(top) - midY(bottom)) <
      Math.abs(midY(topPlain) - midY(bottomPlain)),
    "the bundle narrows",
  );
});

it("a link the projection cuts keeps its path", () => {
  const plain = flows(laidOut());
  const bundled = flows(laidOut({linkBundle: true}));
  const cut = bundled.find(l => l.source.id === "SYD");
  assert.deepStrictEqual(
    cut.d,
    plain.find(l => l.source.id === "SYD").d,
    "across the antimeridian",
  );
});

it("a globe keeps every link's great-circle path", () => {
  const globe = {projection: "geoOrthographic", projectionRotate: [100, -35]};
  const plain = flows(laidOut(globe));
  const viz = laidOut({...globe, linkBundle: true});
  assert.deepStrictEqual(
    flows(viz).map(l => l.d),
    plain.map(l => l.d),
  );
  assert.strictEqual(viz.ctx.linkBundleCache, undefined);
});

it("bundleFlowLinks leaves links alone when linkBundle is off", () => {
  const viz = laidOut();
  const before = flows(viz).map(l => l.d);
  bundleFlowLinks(
    viz,
    flows(viz),
    viz.schema.projection,
    viz.ctx.geomapCtx.pathFn,
  );
  assert.deepStrictEqual(
    flows(viz).map(l => l.d),
    before,
  );
});
