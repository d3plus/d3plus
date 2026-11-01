import {it} from "vitest";
import assert from "assert";
import {geoAlbersUsa, geoMercator, geoOrthographic, geoPath} from "d3-geo";

import {
  featureAnchor,
  flowArc,
  greatCircle,
  isLonLat,
  liftPolyline,
  polylineAt,
  polylineBox,
  polylineEndTip,
  polylineLength,
  polylineMidpoint,
  polylinePath,
  splitRuns,
  unbrokenPath,
} from "../../src/charts/Geomap/flowGeometry.ts";

const close = (a, b, tol = 1e-6, msg) =>
  assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≈ ${b}`);

/** A Mercator fitted to a 400×300 world, with its path generator. */
function mercator() {
  const projection = geoMercator().fitSize([400, 300], {type: "Sphere"});
  return {projection, path: geoPath(projection)};
}

it("isLonLat accepts finite [longitude, latitude] pairs only", () => {
  assert.ok(isLonLat([-74, 40.7]));
  assert.ok(isLonLat([180, -90]));
  assert.ok(!isLonLat([1]));
  assert.ok(!isLonLat([1, 2, 3]));
  assert.ok(!isLonLat(["1", 2]));
  assert.ok(!isLonLat([NaN, 2]));
  assert.ok(!isLonLat([0, 91]), "a latitude past the pole");
  assert.ok(!isLonLat("NYC"));
  assert.ok(!isLonLat({0: 1, 1: 2, length: 2}));
});

it("featureAnchor centers a polygon, and a MultiPolygon on its largest part", () => {
  const square = (x, y, s) => [
    [
      [x, y],
      [x, y + s],
      [x + s, y + s],
      [x + s, y],
      [x, y],
    ],
  ];
  const polygon = {
    type: "Feature",
    geometry: {type: "Polygon", coordinates: square(10, 10, 2)},
  };
  const [lon, lat] = featureAnchor(polygon);
  close(lon, 11, 0.01);
  close(lat, 11, 0.01);

  const islands = {
    type: "Feature",
    geometry: {
      type: "MultiPolygon",
      coordinates: [square(50, 0, 1), square(-20, -20, 6), square(80, 5, 1)],
    },
  };
  const [ilon, ilat] = featureAnchor(islands);
  close(ilon, -17, 0.05, `on the largest part: ${ilon}`);
  close(ilat, -17, 0.1, `on the largest part: ${ilat}`);
});

it("featureAnchor finds a ring wound the wrong way, and null without geometry", () => {
  const reversed = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [10, 10],
          [12, 10],
          [12, 12],
          [10, 12],
          [10, 10],
        ],
      ],
    },
  };
  const [lon, lat] = featureAnchor(reversed);
  close(lon, 11, 0.01);
  close(lat, 11, 0.01);
  assert.strictEqual(featureAnchor({type: "Feature"}), null);
  assert.strictEqual(featureAnchor(null), null);
});

it("greatCircle spaces points evenly from one end to the other", () => {
  const points = greatCircle([0, 0], [90, 0], 3);
  assert.strictEqual(points.length, 4);
  assert.deepStrictEqual(points[0], [0, 0]);
  close(points[1][0], 30);
  close(points[2][0], 60);
  close(points[3][0], 90);
  // A long great circle bows toward the pole.
  const arc = greatCircle([-74, 40.7], [-0.13, 51.5], 10);
  assert.ok(arc[5][1] > 51.5, `north of both ends: ${arc[5][1]}`);
});

it("liftPolyline bows the middle to the left of travel, keeping the ends", () => {
  const line = [
    [0, 0],
    [50, 0],
    [100, 0],
  ];
  const up = liftPolyline(line, 0.2);
  assert.deepStrictEqual(up[0], [0, 0]);
  assert.deepStrictEqual(up[2], [100, 0]);
  // Heading right (east) on screen, left is up (negative y).
  close(up[1][0], 50);
  close(up[1][1], -20);
  const down = liftPolyline(line, -0.2);
  close(down[1][1], 20);
  // The way back bows to the other side, so the two don't overlap.
  const back = liftPolyline([...line].reverse(), 0.2);
  close(back[1][1], 20);
  assert.deepStrictEqual(liftPolyline(line, 0), line);
  const still = [
    [5, 5],
    [5, 5],
  ];
  assert.deepStrictEqual(liftPolyline(still, 0.5), still);
});

it("unbrokenPath checks for one run between the two points", () => {
  assert.ok(unbrokenPath("M0,0L5,5L10,10", [0, 0], [10, 10]));
  assert.ok(unbrokenPath("M0.4,0L10,9.6", [0, 0], [10, 10]), "within a pixel");
  assert.ok(!unbrokenPath("M0,0L5,5M8,8L10,10", [0, 0], [10, 10]));
  assert.ok(!unbrokenPath("M0,0L5,5", [0, 0], [10, 10]), "stops short");
  assert.ok(!unbrokenPath("M3,3L10,10", [0, 0], [10, 10]), "starts late");
  assert.ok(!unbrokenPath("M0,0", [0, 0], [10, 10]));
});

it("polylinePath writes a move then lines, rounded to hundredths", () => {
  assert.strictEqual(
    polylinePath([
      [0, 0],
      [1.234, 5.678],
      [10, 20],
    ]),
    "M0,0L1.23,5.68L10,20",
  );
});

it("polylineLength, polylineAt, and polylineMidpoint measure along a polyline", () => {
  const line = [
    [0, 0],
    [30, 0],
    [30, 40],
  ];
  assert.strictEqual(polylineLength(line), 70);
  const a = polylineAt(line, 10);
  assert.deepStrictEqual([a.x, a.y, a.angle], [10, 0, 0]);
  const b = polylineAt(line, 50);
  assert.deepStrictEqual([b.x, b.y], [30, 20]);
  close(b.angle, Math.PI / 2);
  const end = polylineAt(line, 500);
  assert.deepStrictEqual([end.x, end.y], [30, 40], "clamped to the end");
  const mid = polylineMidpoint(line);
  assert.deepStrictEqual([mid.x, mid.y], [30, 5]);
});

it("polylineEndTip sits inset from an end, pointing into it", () => {
  const line = [
    [0, 0],
    [100, 0],
  ];
  const target = polylineEndTip(line, "target", 10);
  assert.deepStrictEqual([target.x, target.y], [90, 0]);
  close(target.angle, 0);
  const source = polylineEndTip(line, "source", 10);
  assert.deepStrictEqual([source.x, source.y], [10, 0]);
  close(Math.abs(source.angle), Math.PI, 1e-9, "points back to the source");
  const short = polylineEndTip(line, "target", 80);
  assert.strictEqual(short.x, 50, "never past the middle");
});

it("polylineBox bounds a polyline", () => {
  assert.deepStrictEqual(
    polylineBox([
      [5, 9],
      [-2, 4],
      [7, 1],
    ]),
    [
      [-2, 1],
      [7, 9],
    ],
  );
});

it("splitRuns breaks at missing points and wrap-around jumps", () => {
  const runs = splitRuns([
    [0, 0],
    [2, 0],
    [4, 0],
    [396, 0],
    [398, 0],
    [400, 0],
  ]);
  assert.deepStrictEqual(runs.sourceRun, [
    [0, 0],
    [2, 0],
    [4, 0],
  ]);
  assert.deepStrictEqual(runs.targetRun, [
    [396, 0],
    [398, 0],
    [400, 0],
  ]);
  const hidden = splitRuns([[0, 0], [2, 0], null, null]);
  assert.deepStrictEqual(hidden.sourceRun, [
    [0, 0],
    [2, 0],
  ]);
  assert.strictEqual(hidden.targetRun, null, "the target is hidden");
  const lone = splitRuns([null, [3, 3], null]);
  assert.strictEqual(lone.sourceRun, null);
  assert.strictEqual(lone.targetRun, null);
});

it("flowArc follows the great circle, lifted into an arc", () => {
  const {projection, path} = mercator();
  const nyc = [-74, 40.7],
    lon = [-0.13, 51.5];
  const flat = flowArc(nyc, lon, projection, path, 0);
  assert.ok(flat.d.startsWith("M"));
  assert.strictEqual(
    flat.d,
    path({type: "LineString", coordinates: [nyc, lon]}),
  );
  assert.ok(flat.points.length >= 17);
  close(flat.points[0][0], projection(nyc)[0], 1e-6);
  const last = flat.points[flat.points.length - 1];
  close(last[0], projection(lon)[0], 1e-6);
  assert.strictEqual(flat.sourceRun, flat.points);
  assert.strictEqual(flat.targetRun, flat.points);

  const arc = flowArc(nyc, lon, projection, path, 0.3);
  assert.notStrictEqual(arc.d, flat.d);
  const i = Math.floor(arc.points.length / 2);
  assert.ok(
    arc.points[i][1] < flat.points[i][1] - 10,
    "an eastward link bows north (up) on screen",
  );
  close(arc.points[0][0], flat.points[0][0]);
});

it("flowArc leaves a path the projection cuts unlifted, keeping its end runs", () => {
  const {projection, path} = mercator();
  // Sydney to Los Angeles crosses the antimeridian.
  const arc = flowArc([151.2, -33.9], [-118.2, 34], projection, path, 0.3);
  assert.strictEqual((arc.d.match(/M/g) || []).length, 2);
  assert.strictEqual(arc.points, null);
  const end = arc.targetRun[arc.targetRun.length - 1];
  close(end[0], projection([-118.2, 34])[0], 1e-6);
  const start = arc.sourceRun[0];
  close(start[0], projection([151.2, -33.9])[0], 1e-6);
});

it("flowArc drops the end hidden behind a globe, and returns null for nothing to draw", () => {
  const projection = geoOrthographic().rotate([0, 0]).fitSize([300, 300], {
    type: "Sphere",
  });
  const path = geoPath(projection);
  // From the near side (0°E) to the far side (170°E).
  const arc = flowArc([0, 10], [170, 10], projection, path, 0.2);
  assert.ok(arc, "the near part draws");
  assert.strictEqual(arc.points, null);
  assert.ok(arc.sourceRun && arc.sourceRun.length > 1);
  assert.strictEqual(arc.targetRun, null);
  assert.strictEqual(flowArc([5, 5], [5, 5], projection, path, 0.2), null);
  const usa = geoAlbersUsa().fitSize([300, 200], {
    type: "MultiPoint",
    coordinates: [
      [-120, 30],
      [-70, 48],
    ],
  });
  // Both ends outside the projection's lower-48/Alaska/Hawaii insets.
  assert.strictEqual(flowArc([10, 50], [20, 45], usa, geoPath(usa), 0.2), null);
});
