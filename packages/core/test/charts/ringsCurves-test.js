import {it} from "vitest";
import assert from "assert";

import {
  applyRingArc,
  arcCubics,
  cubicsArrowEdge,
  cubicsPathD,
  curveRingsEdge,
  fanParallelEdges,
  gapMiddle,
  ringArcRadius,
  ringArcCubics,
  ringRadius,
  ringsGeometry,
} from "../../internal.ts";

const close = (a, b, msg, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);

const point = ([p0, c1, c2, p3], t) => {
  const s = 1 - t;
  return [0, 1].map(
    i =>
      s ** 3 * p0[i] +
      3 * s * s * t * c1[i] +
      3 * s * t * t * c2[i] +
      t ** 3 * p3[i],
  );
};

/** Points finely along joined cubics. */
const sample = curves =>
  curves.flatMap(curve =>
    Array.from({length: 401}, (_, k) => point(curve, k / 400)),
  );

/** The nearest and farthest the joined cubics come to `c`. */
function reach(curves, c) {
  const radii = sample(curves).map(p => Math.hypot(p[0] - c[0], p[1] - c[1]));
  return {near: Math.min(...radii), far: Math.max(...radii)};
}

/** The largest turn, in radians, between neighboring cubics where they join. */
function kink(curves) {
  let worst = 0;
  for (let k = 1; k < curves.length; k++) {
    const [, , c2, p3] = curves[k - 1];
    const [p0, c1] = curves[k];
    assert.deepStrictEqual(p0, p3, "joined end to end");
    const a = Math.atan2(p3[1] - c2[1], p3[0] - c2[0]);
    const b = Math.atan2(c1[1] - p0[1], c1[0] - p0[0]);
    worst = Math.max(
      worst,
      Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))),
    );
  }
  return worst;
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

it("ringArcRadius sits a little over a quarter of the way into the gap, clear of big nodes", () => {
  const geom = ringsGeometry(400, 400, 3);
  close(
    ringArcRadius(geom, 1, [{r: 1}, {r: 2}]),
    geom.rings[0] + geom.ringWidth * 0.28,
    "0.28 of the gap",
  );
  close(
    ringArcRadius(geom, 3, [{r: 1}]),
    geom.rings[2] + geom.ringWidth * 0.28,
    "0.28 of a spacing past the last",
  );
  const big = geom.ringWidth / 2;
  close(ringArcRadius(geom, 2, [{r: 1}, {r: big}]), geom.rings[1] + big + 2);
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

it("arcCubics follows a circle a quarter turn or less at a time, either way", () => {
  for (const sweep of [0.4, -1.2, 2.5, -Math.PI]) {
    const curves = arcCubics([0, 0], 100, 0.3, sweep);
    assert.strictEqual(
      curves.length,
      Math.ceil(Math.abs(sweep) / (Math.PI / 2)),
    );
    const {near, far} = reach(curves, [0, 0]);
    assert.ok(near > 99.97 && far < 100.03, `on the circle: ${near}–${far}`);
    close(kink(curves), 0, "smooth joins", 1e-9);
    const end = curves[curves.length - 1][3];
    close(Math.atan2(end[1], end[0]), 0.3 + sweep, `ends ${sweep} on`);
  }
});

it("ringArcCubics: out to the circle, around it the shorter way, and back in, outside the ring", () => {
  const c = [200, 200];
  for (const hops of [1, 2, 3, 4]) {
    const geom = ringsGeometry(400, 400, hops);
    for (let ring = 1; ring <= hops; ring++) {
      const mid = gapMiddle(geom, ring);
      for (const span of [0.05, 0.3, 1, 2, 3, Math.PI]) {
        for (const dir of [1, -1]) {
          const a = node(geom, "a", ring, -1);
          const b = node(geom, "b", ring, -1 + dir * span, 3);
          const curves = ringArcCubics(a, b, c, mid);
          const label = `${hops} hops, ring ${ring}, ${dir * span} rad`;
          const first = curves[0][0];
          const last = curves[curves.length - 1][3];
          close(
            first[0],
            a.x + 5 * Math.cos(-1),
            `${label}: leaves a's outer side`,
          );
          close(
            last[1],
            b.y + 3 * Math.sin(b.radians),
            `${label}: ends on b's`,
          );
          const {near, far} = reach(curves, c);
          assert.ok(
            near >= geom.rings[ring - 1] - 1e-9,
            `${label}: stays outside its ring (${near})`,
          );
          close(far, mid, `${label}: reaches the gap's middle`, mid * 0.01);
          assert.ok(kink(curves) < 1e-6, `${label}: smooth joins`);
          // The middle of the path sits between the nodes, the shorter way.
          const pts = sample(curves);
          const [mx, my] = pts[Math.floor(pts.length / 2)];
          const at = Math.atan2(my - 200, mx - 200);
          if (span < Math.PI)
            close(
              Math.atan2(
                Math.sin(at - (-1 + (dir * span) / 2)),
                Math.cos(at - (-1 + (dir * span) / 2)),
              ),
              0,
              `${label}: the middle is between them`,
              0.15,
            );
        }
      }
    }
  }
});

it("ringArcCubics runs along the circle when the nodes sit far apart", () => {
  const geom = ringsGeometry(400, 400);
  const a = node(geom, "a", 2, 0);
  const b = node(geom, "b", 2, 2.5);
  const curves = ringArcCubics(a, b, [200, 200], gapMiddle(geom, 2));
  assert.ok(curves.length >= 3, "a turn out, the arc, and a turn back");
  const arc = curves.slice(1, -1);
  const {near, far} = reach(arc, [200, 200]);
  close(near, gapMiddle(geom, 2), "the arc keeps to the circle", 0.1);
  close(far, gapMiddle(geom, 2), "the arc keeps to the circle", 0.1);
});

it("curveRingsEdge: across rings, each end faces the other's ring and bends in the gap between", () => {
  const geom = ringsGeometry(400, 400, 3);
  const inner = node(geom, "p", 2, 0);
  const outer = node(geom, "q", 3, 0, 4);
  const edge = {source: inner, target: outer};
  curveRingsEdge(edge, geom);
  assert.strictEqual(edge.spline, true);
  assert.strictEqual(edge.segments, undefined);
  close(edge.sourceX, inner.x + 5, "the inner end leaves outward");
  close(edge.targetX, outer.x - 4, "the outer end leaves inward");
  close(edge.sourceBisectX, 200 + gapMiddle(geom, 2), "bends in the gap");
});

it("curveRingsEdge: along a ring, every hops (the first ring too) runs a little over a quarter of the way into the gap", () => {
  for (const hops of [1, 2, 3]) {
    const geom = ringsGeometry(400, 400, hops);
    const a = node(geom, "a", 1, 0);
    const b = node(geom, "b", 1, 1);
    const edge = {source: a, target: b};
    curveRingsEdge(edge, geom);
    assert.deepStrictEqual(edge.arc, {
      cx: 200,
      cy: 200,
      radius: geom.rings[0] + (ringRadius(geom, 2) - geom.rings[0]) * 0.28,
    });
    assert.ok(edge.segments.length >= 2);
    assert.deepStrictEqual([edge.sourceX, edge.sourceY], edge.segments[0][0]);
    assert.deepStrictEqual(
      [edge.targetX, edge.targetY],
      edge.segments[edge.segments.length - 1][3],
    );
  }
});

it("fanParallelEdges circles parallel links along a ring at different distances", () => {
  const geom = ringsGeometry(400, 400);
  const a = node(geom, "a", 2, 0);
  const b = node(geom, "b", 2, 2);
  const edges = [0, 1, 2].map(() => ({source: a, target: b, size: 1}));
  edges.forEach(e => curveRingsEdge(e, geom));
  fanParallelEdges(edges);
  const radii = edges.map(e => e.arc.radius);
  assert.strictEqual(new Set(radii).size, 3, "three circles");
  close(
    radii[1],
    ringArcRadius(geom, 2, [a, b]),
    "the middle one keeps the ring's circle",
  );
  edges.forEach(e => {
    const {near, far} = reach(e.segments, [200, 200]);
    assert.ok(near >= geom.rings[1], "outside the ring");
    close(far, e.arc.radius, "reaches its circle", e.arc.radius * 0.01);
  });
  // Re-laying one out from its arc gives the same curves.
  const before = JSON.stringify(edges[0].segments);
  applyRingArc(edges[0]);
  assert.strictEqual(JSON.stringify(edges[0].segments), before);
});

it("cubicsArrowEdge ends the stroke inside heads on the first and last cubics", () => {
  const geom = ringsGeometry(400, 400);
  const curves = ringArcCubics(
    node(geom, "a", 2, 0),
    node(geom, "b", 2, 2),
    [200, 200],
    gapMiddle(geom, 2),
  );
  const none = cubicsArrowEdge(curves, {
    ends: {source: false, target: false},
    size: 8,
    source: 0,
    target: 0,
  });
  assert.strictEqual(none.d, cubicsPathD(curves));
  const both = cubicsArrowEdge(curves, {
    ends: {source: true, target: true},
    size: 8,
    source: 8,
    target: 8,
  });
  const end = curves[curves.length - 1][3];
  const start = curves[0][0];
  close(
    Math.hypot(both.target.tip[0] - end[0], both.target.tip[1] - end[1]),
    0,
    "target tip",
    1e-6,
  );
  close(
    Math.hypot(both.source.tip[0] - start[0], both.source.tip[1] - start[1]),
    0,
    "source tip",
    1e-6,
  );
  const cut = both.target.cut;
  close(
    Math.hypot(cut[0] - both.target.tip[0], cut[1] - both.target.tip[1]),
    8,
    "the stroke stops at the target head's base",
  );
  assert.ok(
    both.d.endsWith(
      `L${Math.round(cut[0] * 100) / 100},${Math.round(cut[1] * 100) / 100}`,
    ),
  );
  assert.strictEqual(
    (both.d.match(/C/g) || []).length,
    curves.length,
    "keeps every cubic",
  );
});
