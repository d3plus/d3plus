import assert from "assert";
import {geoEquirectangular, geoMercator} from "d3-geo";

import it from "../jsdom.js";
import {Geomap} from "../../es/index.js";
import {applyGeomapLayout} from "../../es/src/charts/Geomap/applyLayout.js";

// Three off-equator points (lon/lat). Distinct sizes keep the point-size
// scale's domain non-degenerate.
const pointData = [
  {id: "a", coords: [-100, 40], size: 10},
  {id: "b", coords: [-80, 30], size: 20},
  {id: "c", coords: [-90, 45], size: 15},
];

function mockGeomapViz() {
  return {
    _filteredData: pointData,
    _id: d => d.id,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _zoomSet: false,
    ctx: {},
    schema: {
      width: 400,
      height: 300,
      projection: geoMercator(),
      projectionPadding: {top: 0, right: 0, bottom: 0, left: 0},
      topojson: undefined,
      topojsonKey: undefined,
      topojsonId: f => f.id,
      topojsonFilter: undefined,
      fitObject: undefined,
      fitKey: undefined,
      fitFilter: undefined,
      point: d => d.coords,
      pointSize: d => d.size,
      pointSizeScale: "linear",
      pointSizeMin: 5,
      pointSizeMax: 20,
    },
  };
}

it("applyGeomapLayout records the chart dimensions on ctx", () => {
  const viz = mockGeomapViz();
  applyGeomapLayout({viz});
  assert.strictEqual(viz.ctx.geomapWidth, 400);
  assert.strictEqual(viz.ctx.geomapHeight, 300);
});

it("applyGeomapLayout derives point-extent bounds by projecting then inverting", () => {
  const viz = mockGeomapViz();
  applyGeomapLayout({viz});
  // No topojson -> no path features -> shapeData is empty, but the layout still
  // computes an extent from the points (project to pixels, invert back to lon/lat).
  assert.ok(Array.isArray(viz.ctx.geomapCtx.topoData), "geomapCtx exposes topoData");
  assert.ok(viz.ctx.extentBounds.features.length >= 1, "computed point-extent bounds");
  const coords = viz.ctx.extentBounds.features[0].geometry.coordinates;
  // The two inverted corner points must be finite lon/lat pairs.
  coords.forEach(([lon, lat]) => {
    assert.ok(Number.isFinite(lon) && lon >= -180 && lon <= 180, `lon in range: ${lon}`);
    assert.ok(Number.isFinite(lat) && lat >= -90 && lat <= 90, `lat in range: ${lat}`);
  });
});

it("applyGeomapLayout fits the projection so every point lands inside the chart area", () => {
  const viz = mockGeomapViz();
  applyGeomapLayout({viz});
  const {pointX, pointY} = viz.ctx.geomapCtx;
  pointData.forEach((d, i) => {
    const x = pointX(d, i), y = pointY(d, i);
    assert.ok(Number.isFinite(x) && x >= 0 && x <= 400, `point ${d.id} x in [0,400]: ${x}`);
    assert.ok(Number.isFinite(y) && y >= 0 && y <= 300, `point ${d.id} y in [0,300]: ${y}`);
  });
});

it("Geomap.projection resolves a named d3-geo projection (geoMercator)", () => {
  const proj = new Geomap().projection("geoMercator").projection();
  const ref = geoMercator();
  assert.deepStrictEqual(proj([10, 50]), ref([10, 50]), "matches a fresh geoMercator");
});

it("Geomap.projection picks the named projection (equirectangular, not mercator)", () => {
  const proj = new Geomap().projection("geoEquirectangular").projection();
  assert.deepStrictEqual(proj([10, 50]), geoEquirectangular()([10, 50]), "matches a fresh geoEquirectangular");
  assert.notDeepStrictEqual(proj([10, 50]), geoMercator()([10, 50]), "differs from mercator off the equator");
});

it("Geomap.projection falls back to geoMercator for an unknown name", () => {
  const proj = new Geomap().projection("notARealProjection").projection();
  assert.deepStrictEqual(proj([10, 50]), geoMercator()([10, 50]), "unknown name falls back to geoMercator");
});
