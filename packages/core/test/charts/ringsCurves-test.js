import {it} from "vitest";
import assert from "assert";

import {
  archControl,
  cubicReach,
  curveRingsEdge,
  gapMiddle,
  ringRadius,
  ringsGeometry,
} from "../../internal.ts";

const close = (a, b, msg, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);

/** The farthest an edge's cubic reaches from `c`, measured finely. */
function apex(edge, c) {
  let far = 0,
    at = 0;
  for (let i = 0; i <= 4000; i++) {
    const t = i / 4000,
      s = 1 - t;
    const x =
      s ** 3 * edge.sourceX +
      3 * s * s * t * edge.sourceBisectX +
      3 * s * t * t * edge.targetBisectX +
      t ** 3 * edge.targetX;
    const y =
      s ** 3 * edge.sourceY +
      3 * s * s * t * edge.sourceBisectY +
      3 * s * t * t * edge.targetBisectY +
      t ** 3 * edge.targetY;
    const d = Math.hypot(x - c[0], y - c[1]);
    if (d > far) [far, at] = [d, Math.atan2(y - c[1], x - c[0])];
  }
  return {far, at};
}

/** A node on ring `ring` of `geom` at `angle`, centered at (200, 200). */
const node = (geom, id, ring, angle, r = 5) => ({
  id,
  ring,
  radians: angle,
  r,
  x: 200 + geom.rings[ring - 1] * Math.cos(angle),
  y: 200 + geom.rings[ring - 1] * Math.sin(angle),
});

it("ringRadius and gapMiddle follow the rings, and run on past the last", () => {
  const geom = ringsGeometry(400, 400, 3);
  geom.rings.forEach((r, k) =>
    close(ringRadius(geom, k + 1), r, `ring ${k + 1}`),
  );
  close(ringRadius(geom, 4), 200, "one spacing past the last is the edge");
  close(gapMiddle(geom, 1), (geom.rings[0] + geom.rings[1]) / 2, "gap 1");
  close(
    gapMiddle(geom, 3),
    geom.rings[2] + geom.ringWidth / 2,
    "past the last",
  );
});

it("archControl finds the control point that makes a cubic arch reach a radius", () => {
  const c = [0, 0];
  const p0 = [100, 0],
    p3 = [0, 100];
  const u = [Math.SQRT1_2, Math.SQRT1_2];
  const rho = archControl(p0, p3, u, 130, c);
  const ctrl = r => [u[0] * r, u[1] * r];
  close(cubicReach(p0, ctrl(rho), ctrl(rho), p3, c), 130, "reaches 130");
  assert.ok(
    cubicReach(p0, ctrl(rho * 0.9), ctrl(rho * 0.9), p3, c) < 130,
    "and no less would",
  );
});

it("curveRingsEdge: across rings, each end faces the other's ring and bends in the gap between", () => {
  const geom = ringsGeometry(400, 400, 3);
  const inner = node(geom, "p", 2, 0);
  const outer = node(geom, "q", 3, 0, 4);
  const edge = {source: inner, target: outer};
  curveRingsEdge(edge, geom);
  assert.strictEqual(edge.spline, true);
  close(edge.sourceX, inner.x + 5, "the inner end leaves outward");
  close(edge.targetX, outer.x - 4, "the outer end leaves inward");
  close(edge.sourceBisectX, 200 + gapMiddle(geom, 2), "bends in the gap");
});

it("curveRingsEdge: along a ring, the curve reaches the middle of the gap outside it", () => {
  const c = [200, 200];
  for (const hops of [1, 2, 3, 4]) {
    const geom = ringsGeometry(400, 400, hops);
    for (let ring = 1; ring <= hops; ring++) {
      if (hops === 2 && ring === 1) continue;
      for (const span of [0.3, 1, 2, 3]) {
        const a = node(geom, "a", ring, -1);
        const b = node(geom, "b", ring, -1 + span, 3);
        const edge = {source: a, target: b};
        curveRingsEdge(edge, geom);
        close(a.x + 5 * Math.cos(-1), edge.sourceX, "leaves its outer side");
        const {far, at} = apex(edge, c);
        close(
          far,
          gapMiddle(geom, ring),
          `${hops} hops, ring ${ring}, ${span} rad apart`,
          0.05,
        );
        close(at, -1 + span / 2, "the apex sits between the nodes", 0.05);
      }
    }
  }
});

it("curveRingsEdge: the two-ring chart's first-ring links keep their bend at the nodes' angles", () => {
  const geom = ringsGeometry(400, 400);
  const a = node(geom, "a", 1, 0);
  const b = node(geom, "b", 1, 1);
  const edge = {source: a, target: b};
  curveRingsEdge(edge, geom);
  const mid = gapMiddle(geom, 1);
  close(edge.sourceBisectX, 200 + mid, "at a's angle");
  close(edge.targetBisectX, 200 + mid * Math.cos(1), "at b's angle");
});
