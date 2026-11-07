import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";
import {
  geoAlbersUsa,
  geoClipCircle,
  geoMercator,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import {geoSatellite} from "d3-geo-projection";
import {feature} from "topojson-client";

import {
  cachedPaths,
  fitExtentOnce,
  projectionState,
  sameGeo,
  topoFeatures,
} from "../../src/charts/Geomap/geoCache.ts";

/**
    Geomap's caches give what the work they skip would: the features
    `topojson-client` converts, the scale and translate `fitExtent` sets, and
    the path `geoPath` draws.
*/

const states = JSON.parse(
  readFileSync(new URL("../../dev/charts/Geomap/State.json", import.meta.url)),
);

it("topoFeatures: equals topojson-client's features, with new feature objects each time", () => {
  const expected = feature(states, "states");
  const first = topoFeatures(states, "states");
  const second = topoFeatures(states);
  assert.deepStrictEqual(first, expected);
  assert.deepStrictEqual(second, expected, "the first object by default");
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.features, second.features);
  first.features.forEach((f, i) => {
    assert.notStrictEqual(f, second.features[i]);
    assert.strictEqual(f.geometry, second.features[i].geometry);
  });
  assert.deepStrictEqual(topoFeatures(states, "missing"), expected);
  // An object that isn't a collection converts to a single feature.
  const single = {
    ...states,
    objects: {one: states.objects.states.geometries[0]},
  };
  assert.deepStrictEqual(topoFeatures(single), feature(single, "one"));
});

it("sameGeo: same objects, arrays, and numbers", () => {
  const ring = [
    [0, 0],
    [1, 1],
  ];
  assert.ok(sameGeo(ring, ring));
  assert.ok(sameGeo(ring, [[0, 0], ring[1]]));
  assert.ok(sameGeo({type: "A", c: [1, NaN]}, {type: "A", c: [1, NaN]}));
  assert.ok(!sameGeo([0], [-0]));
  assert.ok(!sameGeo([1, 2], [1, 2, 3]));
  assert.ok(!sameGeo({a: 1}, {a: 1, b: 2}));
  assert.ok(!sameGeo({a: 1, b: undefined}, {a: 1, c: undefined}));
  assert.ok(!sameGeo([1], {0: 1, length: 1}));
  assert.ok(!sameGeo({a: 1}, null));
  assert.ok(!sameGeo(new Date(0), new Date(0)), "only plain objects");
});

it("projectionState: steady, and changed by every setting and custom parameter", () => {
  const base = () => geoMercator().scale(200).translate([100, 50]);
  const steady = base();
  assert.strictEqual(projectionState(steady), projectionState(steady));
  const changed = [
    p => p.scale(201),
    p => p.translate([100, 51]),
    p => p.rotate([10, 0]),
    p => p.center([5, 5]),
    p => p.angle(10),
    p => p.reflectX(true),
    p => p.clipAngle(80),
    p =>
      p.clipExtent([
        [0, 0],
        [50, 50],
      ]),
    p => p.precision(1),
    p => p.preclip(geoClipCircle(60)),
  ];
  for (const change of changed) {
    const p = base();
    const before = projectionState(p);
    change(p);
    assert.notStrictEqual(projectionState(p), before, String(change));
  }
  // A parameter outside the settings shows where points land.
  const satellite = geoSatellite().distance(1.5);
  const before = projectionState(satellite);
  assert.strictEqual(projectionState(satellite), before);
  satellite.distance(1.6);
  assert.notStrictEqual(projectionState(satellite), before);
  assert.strictEqual(
    projectionState({
      scale: () => {
        throw new Error("unreadable");
      },
    }),
    null,
  );
});

/** Fits a fresh copy of the projection, the way the cache would have to. */
const fitted = (make, setup, extent, object) => {
  const p = setup(make());
  p.fitExtent(extent, object);
  return [p.scale(), p.translate()];
};

it("fitExtentOnce: the scale and translate fitExtent sets, fitting only when something changed", () => {
  const all = topoFeatures(states);
  const some = {...all, features: all.features.slice(0, 10)};
  const cases = [
    [geoMercator, p => p],
    [geoAlbersUsa, p => p],
    [geoOrthographic, p => p.rotate([90, -30])],
  ];
  for (const [make, setup] of cases) {
    const projection = setup(make());
    let calls = 0;
    const fit = projection.fitExtent;
    projection.fitExtent = (...args) => {
      calls++;
      return fit.apply(projection, args);
    };
    const check = (extent, object, expectFit, label) => {
      const before = calls;
      fitExtentOnce(projection, extent, object);
      assert.strictEqual(calls - before, expectFit ? 1 : 0, `${label}: fits`);
      const rotate = projection.rotate ? projection.rotate() : undefined;
      const [scale, translate] = fitted(
        make,
        p => (rotate ? setup(p).rotate(rotate) : setup(p)),
        extent,
        object,
      );
      assert.ok(Object.is(projection.scale(), scale), `${label}: scale`);
      assert.deepStrictEqual(projection.translate(), translate, label);
    };
    const a = [
      [10, 10],
      [390, 290],
    ];
    const b = [
      [0, 0],
      [400, 300],
    ];
    check(a, all, true, "first fit");
    check(a, all, false, "same fit");
    check(
      [
        [10, 10],
        [390, 290],
      ],
      {...all, features: [...all.features]},
      false,
      "equal copies",
    );
    check(b, all, true, "new extent");
    check(b, some, true, "new features");
    check(b, some, false, "same again");
    projection.scale(1);
    check(b, some, true, "scale changed by hand");
    if (projection.rotate) {
      projection.rotate([20, 10]);
      check(b, some, true, "rotated");
      check(b, some, false, "rotated, same again");
    }
    check(b, {type: "Sphere"}, true, "sphere");
    check(b, {type: "Sphere"}, false, "sphere again");
  }
});

it("cachedPaths: the path geoPath draws, redrawn when the projection changes", () => {
  const {features} = topoFeatures(states);
  const projection = geoAlbersUsa().fitExtent(
    [
      [0, 0],
      [800, 500],
    ],
    {type: "FeatureCollection", features},
  );
  let calls = 0;
  const path = f => {
    calls++;
    return geoPath().projection(projection)(f);
  };
  const expect = () => {
    const reference = geoPath().projection(projection);
    return features.map(f => reference(f));
  };
  const first = cachedPaths(projection, path);
  assert.deepStrictEqual(features.map(first), expect());
  assert.strictEqual(calls, features.length);
  // A new draw with new feature objects around the same geometries.
  const again = cachedPaths(projection, path);
  assert.deepStrictEqual(topoFeatures(states).features.map(again), expect());
  assert.strictEqual(calls, features.length, "reused");
  projection.scale(projection.scale() * 2);
  const zoomed = cachedPaths(projection, path);
  assert.deepStrictEqual(features.map(zoomed), expect());
  assert.strictEqual(calls, features.length * 2, "redrawn");
  // Features without a geometry object are drawn each time.
  const empty = {type: "Feature", geometry: null};
  assert.strictEqual(zoomed(empty), geoPath().projection(projection)(empty));
});
