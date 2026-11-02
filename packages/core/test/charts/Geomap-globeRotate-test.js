import {it} from "vitest";
import assert from "assert";
import {geoMercator, geoOrthographic} from "d3-geo";
import {zoomIdentity} from "d3-zoom";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {
  cartesian,
  dragRotation,
  globeHome,
  globeRotates,
  installGlobeRotation,
  surfaceToMap,
  versor,
  versorDelta,
  versorMultiply,
  versorRotation,
} from "../../src/charts/Geomap/globeRotate.ts";

useJsdom();

const close = (a, b, tol = 1e-6, msg) =>
  assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≈ ${b}`);
const closeAll = (a, b, tol, msg) =>
  a.forEach((v, i) =>
    close(v, b[i], tol, `${msg ?? ""} [${i}] ${v} ≈ ${b[i]}`),
  );

/** An orthographic globe 300px across, centered in a 300×300 box. */
const globe = (rotate = [0, 0, 0]) =>
  geoOrthographic().rotate(rotate).fitSize([300, 300], {type: "Sphere"});

it("versor and versorRotation convert a rotation and back", () => {
  for (const r of [
    [0, 0, 0],
    [30, -20, 0],
    [-120, 45, 10],
    [170, -80, -30],
  ])
    closeAll(versorRotation(versor(r)), r, 1e-9, `${r}`);
  closeAll(versor([0, 0, 0]), [1, 0, 0, 0], 1e-12);
});

it("cartesian places coordinates on the unit sphere", () => {
  closeAll(cartesian([0, 0]), [1, 0, 0], 1e-12);
  closeAll(cartesian([90, 0]), [0, 1, 0], 1e-12);
  closeAll(cartesian([0, 90]), [0, 0, 1], 1e-12);
});

it("versorDelta turns one point of the sphere onto another, and multiplies", () => {
  const a = cartesian([0, 0]),
    b = cartesian([40, 25]);
  const q = versorDelta(a, b);
  close(Math.hypot(...q), 1, 1e-12, "a unit quaternion");
  closeAll(versorDelta(a, a), [1, 0, 0, 0], 1e-12, "no turn for one point");
  // Multiplying by the identity changes nothing.
  closeAll(versorMultiply(q, [1, 0, 0, 0]), q, 1e-12);
  closeAll(versorMultiply([1, 0, 0, 0], q), q, 1e-12);
});

it("dragRotation keeps the place grabbed under the pointer", () => {
  const projection = globe([10, -20, 0]);
  const start = projection.rotate();
  for (const [from, to] of [
    [
      [150, 150],
      [200, 170],
    ],
    [
      [120, 90],
      [60, 200],
    ],
    [
      [180, 200],
      [175, 120],
    ],
  ]) {
    const place = projection.invert(from);
    const rotation = dragRotation(projection, start, from, to);
    closeAll(projection.rotate(), start, 1e-9, "the projection is left alone");
    projection.rotate(rotation);
    closeAll(projection(place), to, 1e-6, "under the pointer");
    projection.rotate(start);
  }
});

it("dragRotation keeps a place dragged past the edge on the horizon", () => {
  const projection = globe();
  const place = projection.invert([200, 150]);
  const rotation = dragRotation(projection, [0, 0, 0], [200, 150], [400, 150]);
  projection.rotate(rotation);
  const [x, y] = projection(place);
  close(Math.hypot(x - 150, y - 150), 150, 1e-6, "on the horizon");
  assert.ok(x > 150, "on the side dragged to");
});

it("dragRotation turns by longitude and latitude off the globe", () => {
  const projection = globe();
  const degreesPerPixel = 180 / Math.PI / projection.scale();
  const off = dragRotation(projection, [0, 0, 0], [-50, -50], [-40, -60]);
  closeAll(off, [10 * degreesPerPixel, 10 * degreesPerPixel, 0], 1e-9);
  const pole = dragRotation(projection, [0, 80, 0], [-50, -50], [-50, -5000]);
  assert.strictEqual(pole[1], 90, "latitude is held to the pole");
});

it("surfaceToMap undoes the zoom transform and the chart's offset", () => {
  const t = zoomIdentity.translate(40, 10).scale(2);
  assert.deepStrictEqual(surfaceToMap([140, 110], t, {x: 20, y: 5}), [30, 45]);
  assert.deepStrictEqual(surfaceToMap([7, 8], zoomIdentity), [7, 8]);
});

it("globeRotates only on a zoomable globe, and globeHome reads the home rotation", () => {
  const viz = new Geomap().projection("geoOrthographic");
  assert.ok(globeRotates(viz));
  viz.zoom(false);
  assert.ok(!globeRotates(viz), "not without zoom");
  viz.zoom(true).projection("geoMercator");
  assert.ok(!globeRotates(viz), "not on a flat map");

  viz.projection("geoOrthographic");
  assert.strictEqual(globeHome(viz), undefined, "an unturned globe");
  viz._globeHome = {projection: viz.projection(), rotate: [5, 5, 0]};
  assert.deepStrictEqual(globeHome(viz), [5, 5, 0]);
  viz.projection("geoOrthographic");
  assert.strictEqual(
    globeHome(viz),
    undefined,
    "forgotten with its projection",
  );
  viz.projectionRotate([30, -10]);
  assert.deepStrictEqual(globeHome(viz), [30, -10], "the configured one wins");
  assert.deepStrictEqual(viz.projectionRotate(), [30, -10], "and reads back");
});

/** A Geomap globe whose zoom surface is a 300×300 box, with its gesture. */
function gestureFixture(projection = geoOrthographic()) {
  const viz = new Geomap().projection(projection);
  viz.schema.projection.fitSize([300, 300], {type: "Sphere"});
  const node = document.createElement("div");
  node.getBoundingClientRect = () => ({left: 0, top: 0});
  let stored = zoomIdentity;
  viz._zoomEventTarget = {
    node: () => node,
    property: (key, value) => {
      if (key === "__zoom") stored = value;
    },
  };
  viz._chartTransform = {x: 0, y: 0};
  const calls = {layout: 0, paint: 0};
  viz._drawSceneToTarget = () => calls.paint++;
  installGlobeRotation(viz, () => calls.layout++);
  const mouse = (type, x, y) => ({type, clientX: x, clientY: y});
  return {viz, calls, mouse, stored: () => stored};
}

it("the globe gesture rotates on a drag and leaves the zoom transform alone", () => {
  const {viz, calls, mouse, stored} = gestureFixture();
  const gesture = viz._zoomGesture;
  const projection = viz.schema.projection;
  const place = projection.invert([150, 150]);
  const t0 = zoomIdentity;
  gesture.start({transform: t0, sourceEvent: mouse("mousedown", 150, 150)});
  const moved = zoomIdentity.translate(30, 0);
  assert.strictEqual(
    gesture.zoom({transform: moved, sourceEvent: mouse("mousemove", 180, 140)}),
    true,
    "the drag is the globe's",
  );
  assert.strictEqual(stored(), t0, "the zoom transform is held");
  assert.strictEqual(viz._globeDragging, true);
  gesture.end({transform: t0, sourceEvent: mouse("mouseup", 180, 140)});
  assert.strictEqual(viz._globeDragging, false);
  closeAll(projection(place), [180, 140], 1e-6, "turned under the pointer");
  assert.ok(calls.layout >= 1 && calls.paint >= 1, "re-laid out and painted");
  assert.deepStrictEqual(viz._globeHome.rotate, [0, 0, 0], "home noted");

  // A wheel zooms.
  gesture.start({transform: t0, sourceEvent: {type: "wheel"}});
  assert.strictEqual(
    gesture.zoom({transform: t0, sourceEvent: {type: "wheel"}}),
    false,
  );

  // Reset turns it home.
  gesture.reset();
  closeAll(projection.rotate(), [0, 0, 0], 1e-9);
});

it("the globe gesture hands a pinch to the zoom, and leaves flat maps to pan", () => {
  const {viz} = gestureFixture();
  const gesture = viz._zoomGesture;
  const touch = n => ({
    type: n === 1 ? "touchstart" : "touchmove",
    touches: Array.from({length: n}, () => ({clientX: 100, clientY: 100})),
  });
  gesture.start({transform: zoomIdentity, sourceEvent: touch(1)});
  assert.strictEqual(
    gesture.zoom({transform: zoomIdentity, sourceEvent: touch(2)}),
    false,
    "two fingers zoom",
  );

  const flat = gestureFixture(geoMercator());
  flat.viz._zoomGesture.start({
    transform: zoomIdentity,
    sourceEvent: flat.mouse("mousedown", 10, 10),
  });
  assert.strictEqual(
    flat.viz._zoomGesture.zoom({
      transform: zoomIdentity.translate(5, 5),
      sourceEvent: flat.mouse("mousemove", 15, 15),
    }),
    false,
    "a flat map pans",
  );
  flat.viz._zoomGesture.reset();
  closeAll(flat.viz.schema.projection.rotate(), [0, 0, 0], 1e-9);
});
