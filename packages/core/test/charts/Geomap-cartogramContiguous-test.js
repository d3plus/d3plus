import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {pathRings} from "@d3plus/render";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {
  CONTIGUOUS_ITERATIONS,
  CONTIGUOUS_TOLERANCE,
  contiguousCartogram,
  largestError,
} from "../../src/charts/Geomap/cartogramContiguous.ts";
import {
  cartogramKind,
  hashText,
} from "../../src/charts/Geomap/cartogramLayout.ts";
import {cartogramLabels} from "../../src/charts/Geomap/cartogramLabels.ts";

useJsdom();

/**
    Geomap's contiguous cartogram: regions stretched until each area
    stands for its value, their shared borders kept shared, worked out
    exactly or on a grid.
*/

const area = ring =>
  Math.abs(
    ring.reduce((s, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );

/** Two 100×100 squares sharing the edge x = 100, drawn with eleven points. */
const edge = Array.from({length: 11}, (_, k) => [100, k * 10]);
const left = [[0, 0], ...edge, [0, 100]];
const right = [[200, 100], ...edge.slice().reverse(), [200, 0]];

it("contiguousCartogram grows a region toward its share and keeps the shared border", () => {
  for (const budget of [Infinity, 10]) {
    const [a, b] = contiguousCartogram(
      [
        {rings: [left], value: 3},
        {rings: [right], value: 1},
      ],
      {budget},
    );
    const ratio = area(a[0]) / area(b[0]);
    assert.ok(ratio > 2.5 && ratio < 3.2, `toward 3:1 (${ratio})`);
    // The left square's edge points, in order, are the right one's, reversed.
    assert.deepStrictEqual(a[0].slice(1, 12), b[0].slice(1, 12).reverse());
    assert.strictEqual(a[0].length, left.length, "every point kept");
    const total = area(a[0]) + area(b[0]);
    assert.ok(Math.abs(total / 20000 - 1) < 0.15, "the map keeps its size");
  }
});

it("contiguousCartogram converges with more passes, and none changes nothing", () => {
  const regions = [
    {rings: [left], value: 3},
    {rings: [right], value: 1},
  ];
  const ratio = iterations => {
    const [a, b] = contiguousCartogram(regions, {iterations});
    return area(a[0]) / area(b[0]);
  };
  assert.ok(CONTIGUOUS_ITERATIONS >= 4);
  assert.ok(ratio(16) > ratio(4));
  assert.ok(Math.abs(ratio(16) - 3) < 0.1);
  assert.deepStrictEqual(contiguousCartogram(regions, {iterations: 0}), [
    [left],
    [right],
  ]);
});

it("contiguousCartogram keeps a region without a value at the mean density", () => {
  const third = [
    [200, 0],
    [200, 100],
    [300, 100],
    [300, 0],
  ];
  const out = contiguousCartogram([
    {rings: [left], value: 2},
    {rings: [right], value: NaN},
    {rings: [third], value: 2},
  ]);
  const areas = out.map(r => area(r[0]));
  assert.ok(
    Math.abs(areas[1] / areas[0] - 1) < 0.1,
    "neither grows nor shrinks",
  );
  // Nothing to size by: the rings come back where they were.
  assert.deepStrictEqual(contiguousCartogram([{rings: [left], value: 0}]), [
    [left],
  ]);
  assert.deepStrictEqual(contiguousCartogram([]), []);
});

it("hashText tells texts apart and continues from a hash", () => {
  assert.strictEqual(hashText("abc"), hashText("abc"));
  assert.notStrictEqual(hashText("abc"), hashText("abd"));
  assert.strictEqual(hashText("bc", hashText("a")), hashText("abc"));
  assert.ok(hashText("") > 0);
});

const read = file =>
  JSON.parse(
    readFileSync(new URL(`../../dev/charts/Geomap/${file}`, import.meta.url)),
  );

/** Runs Geomap's layout over the states as a contiguous cartogram. */
function laidOut(rows) {
  const viz = new Geomap().config({
    width: 800,
    height: 500,
    tiles: false,
    topojson: read("State.json"),
    projection: "geoAlbersUsa",
    groupBy: "State ID",
    colorScale: "Population",
    legend: false,
    cartogram: "contiguous",
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = rows;
  viz._id = d => d["State ID"];
  viz._drawLabel = d => d.Abbr;
  applyGeomapLayout({viz});
  return viz;
}

it("a contiguous Geomap distorts every drawn state, with or without data, and labels none", () => {
  const rows = read("state-population.json").filter(d => d.Abbr !== "TX");
  const viz = laidOut(rows);
  assert.strictEqual(cartogramKind(viz), "contiguous");
  const {cartogram, topoData, pathFn} = viz.ctx.geomapCtx;
  const drawn = topoData.filter(d => pathFn(d));
  assert.strictEqual(cartogram.size, drawn.length, "Texas too");
  for (const region of drawn) {
    const before = pathRings(pathFn(region));
    const after = pathRings(cartogram.get(region.id).d);
    assert.deepStrictEqual(
      after.map(r => r.length),
      before.map(r => r.length),
      `${region.id}: the outline's rings and points`,
    );
  }
  const regionArea = d => pathRings(d).reduce((t, ring) => t + area(ring), 0);
  const share = id => {
    const r = topoData.find(d => d.id === id);
    return regionArea(cartogram.get(id).d) / regionArea(pathFn(r));
  };
  assert.ok(share("04000US06") > 1, "California grows");
  assert.ok(share("04000US56") < 1, "Wyoming shrinks");
  assert.deepStrictEqual(
    cartogramLabels(viz, topoData, cartogram, {fill: "#ccc"}),
    [],
  );
  // The same outlines and values reuse the distortion.
  const again = laidOut(rows);
  assert.strictEqual(
    again.ctx.geomapCtx.cartogram.get("04000US06").d,
    cartogram.get("04000US06").d,
  );
});

it("contiguousCartogram runs 12 passes at most and stops once every region is within 1%", () => {
  assert.strictEqual(CONTIGUOUS_ITERATIONS, 12);
  assert.strictEqual(CONTIGUOUS_TOLERANCE, 0.01);
  const regions = [
    {rings: [left], value: 3},
    {rings: [right], value: 1},
  ];
  // Already within a loose tolerance: no pass runs.
  assert.deepStrictEqual(
    contiguousCartogram(
      [
        {rings: [left], value: 1.05},
        {rings: [right], value: 1},
      ],
      {tolerance: 0.1},
    ),
    [[left], [right]],
  );
  const share = out => area(out[0][0]) / (area(out[0][0]) + area(out[1][0]));
  // A loose tolerance stops sooner than a strict one.
  const loose = share(
    contiguousCartogram(regions, {iterations: 40, tolerance: 0.2}),
  );
  const strict = share(
    contiguousCartogram(regions, {iterations: 40, tolerance: 0.001}),
  );
  assert.ok(Math.abs(loose - 0.75) / 0.75 < 0.2);
  assert.ok(Math.abs(strict - 0.75) < Math.abs(loose - 0.75));
});

it("largestError is the worst share error among the regions with a value", () => {
  const shapes = [{area: 60}, {area: 30}, {area: 10}];
  // Targets: 50% and 40%; the third has no value.
  assert.ok(
    Math.abs(largestError(shapes, [5, 4, 1], [true, true, false], 10) - 0.25) <
      1e-9,
  );
  assert.strictEqual(
    largestError(shapes, [6, 3, 1], [true, true, true], 10),
    0,
  );
});
