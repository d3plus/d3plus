import assert from "assert";

import {collapse, commitTrailScene, cubicInOut, interpolateNode, interpolateScene, parseGradient, TrailLog} from "../es/index.js";

it("cubicInOut matches d3 endpoints and midpoint", () => {
  assert.strictEqual(cubicInOut(0), 0, "start");
  assert.strictEqual(cubicInOut(1), 1, "end");
  assert.strictEqual(cubicInOut(0.5), 0.5, "midpoint is symmetric");
});

it("collapse zeroes geometry and opacity", () => {
  const rect = collapse({type: "rect", key: "a", x: 10, y: 20, width: 40, height: 60});
  assert.strictEqual(rect.width, 0, "rect width collapses");
  assert.strictEqual(rect.height, 0, "rect height collapses");
  assert.strictEqual(rect.x, 30, "rect collapses toward center x");
  assert.strictEqual(rect.y, 50, "rect collapses toward center y");
  assert.strictEqual(rect.paint.opacity, 0, "opacity fades to 0");

  const circle = collapse({type: "circle", key: "b", cx: 5, cy: 5, r: 8});
  assert.strictEqual(circle.r, 0, "circle radius collapses");
});

it("collapse grows bars from their baseline, not their center", () => {
  // Vertical bar: rect spans [-H, 0] with its baseline edge at y=0.
  const up = collapse({type: "rect", shapeType: "Bar", key: "a", x: -20, y: -60, width: 40, height: 60});
  assert.strictEqual(up.y, 0, "vertical bar pins its baseline edge at y=0");
  assert.strictEqual(up.height, 0, "vertical bar collapses its height");
  assert.strictEqual(up.x, -20, "vertical bar keeps its full breadth (x)");
  assert.strictEqual(up.width, 40, "vertical bar keeps its full breadth (width)");

  // Horizontal bar: rect spans [0, W] with its baseline edge at x=0.
  const right = collapse({type: "rect", shapeType: "Bar", key: "b", x: 0, y: -20, width: 80, height: 40});
  assert.strictEqual(right.x, 0, "horizontal bar pins its baseline edge at x=0");
  assert.strictEqual(right.width, 0, "horizontal bar collapses its width");
  assert.strictEqual(right.y, -20, "horizontal bar keeps its full breadth (y)");
  assert.strictEqual(right.height, 40, "horizontal bar keeps its full breadth (height)");
});

it("collapse grows a Sankey link's stroke-width from 0, keeping opacity", () => {
  const link = collapse({
    type: "path",
    shapeType: "Link",
    key: "l",
    d: "M0,0L10,10",
    paint: {stroke: "#000", strokeOpacity: 0.5, strokeWidth: 12},
  });
  assert.strictEqual(link.paint.strokeWidth, 0, "link stroke-width collapses to 0");
  assert.strictEqual(link.paint.strokeOpacity, 0.5, "link keeps its stroke-opacity");
  assert.strictEqual(link.paint.opacity, undefined, "link does not force an opacity fade");

  // A plain (non-link) path still fades via opacity only.
  const plain = collapse({type: "path", key: "p", d: "M0,0L10,10", paint: {strokeWidth: 4}});
  assert.strictEqual(plain.paint.opacity, 0, "plain path fades opacity to 0");
  assert.strictEqual(plain.paint.strokeWidth, 4, "plain path keeps its stroke-width");
});

it("interpolateNode interpolates numeric geometry and color", () => {
  const interp = interpolateNode(
    {type: "rect", key: "a", x: 0, y: 0, width: 0, height: 0, paint: {fill: "#000000"}},
    {type: "rect", key: "a", x: 0, y: 0, width: 100, height: 50, paint: {fill: "#ffffff"}},
  );
  const mid = interp(0.5);
  assert.strictEqual(mid.width, 50, "width halfway");
  assert.strictEqual(mid.height, 25, "height halfway");
  assert.strictEqual(mid.paint.fill, "rgb(128, 128, 128)", "fill color halfway");
});

it("interpolateScene fades entering nodes and drops exiting nodes at t=1", () => {
  const prev = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "circle", key: "old", cx: 10, cy: 10, r: 4, paint: {opacity: 1}}],
    },
  };
  const next = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "rect", key: "new", x: 0, y: 0, width: 20, height: 20}],
    },
  };

  const interp = interpolateScene(prev, next);

  const mid = interp(0.5);
  const keys = mid.root.children.map(c => c.key).sort();
  assert.deepStrictEqual(keys, ["new", "old"], "both entering and exiting nodes present mid-animation");
  const entering = mid.root.children.find(c => c.key === "new");
  assert.strictEqual(entering.paint.opacity, 0.5, "entering node is half faded-in");
  const exiting = mid.root.children.find(c => c.key === "old");
  assert.strictEqual(exiting.paint.opacity, 0.5, "exiting node is half faded-out");

  const end = interp(1);
  assert.deepStrictEqual(end.root.children.map(c => c.key), ["new"], "exiting node dropped at t=1");
});

it("interpolateScene streaks a motion trail behind a moving trailed point", () => {
  const circle = extra => ({
    type: "circle", key: "p", cx: 0, cy: 0, r: 5,
    paint: {fill: "#ff0000"}, transform: {x: 10, y: 10}, ...extra,
  });
  const prev = {width: 200, height: 200, root: {type: "group", key: "root", children: [circle()]}};
  const next = {
    width: 200, height: 200,
    root: {type: "group", key: "root", children: [circle({trail: true, transform: {x: 110, y: 90}})]},
  };
  const interp = interpolateScene(prev, next);

  const mid = interp(0.5);
  const trail = mid.root.children.find(c => c.key === "p__trail");
  assert.ok(trail, "trail node emitted mid-move");
  assert.strictEqual(trail.type, "path", "trail is a cone path");
  assert.ok(typeof trail.d === "string" && trail.d.startsWith("M"), "trail has a path d");
  // The tail is closed with a semicircle of the previous radius (an arc command),
  // so its bbox reaches behind A (10,10) — up-left of the tail chord.
  assert.ok(/A5,5 /.test(trail.d), "tail closed by a radius-5 arc");
  assert.ok(trail.gradientBounds.x < 6.9, "bbox extends behind the tail for the round cap");
  assert.ok(trail.gradientBounds, "trail carries its gradient bounds for Canvas");
  // Fill is a gradient fading transparent (tail) → the point's color (head).
  assert.ok(trail.paint.fill.startsWith("gradient:"), "trail fill is a gradient");
  const grad = parseGradient(trail.paint.fill);
  assert.strictEqual(grad.stops.length, 2, "two stops");
  assert.strictEqual(grad.stops[1].color, "#ff0000", "head stop = point color");
  assert.ok(/, ?0\)$/.test(grad.stops[0].color), "tail stop is transparent");
  // Moving down-right, tail sits at the top-left bbox corner, head bottom-right.
  assert.deepStrictEqual(grad.from, [0, 0], "gradient from = tail corner");
  assert.deepStrictEqual(grad.to, [1, 1], "gradient to = head corner");
  assert.ok(trail.paint.opacity > 0 && trail.paint.opacity < 0.6, "trail fading");
  // Trail paints beneath its point.
  const trailIdx = mid.root.children.findIndex(c => c.key === "p__trail");
  const pointIdx = mid.root.children.findIndex(c => c.key === "p");
  assert.ok(trailIdx < pointIdx, "trail is behind the point");

  assert.ok(!interp(1).root.children.some(c => c.key === "p__trail"), "no trail at rest (t=1)");

  // A point that doesn't opt in gets no trail.
  const noOpt = interpolateScene(
    {width: 200, height: 200, root: {type: "group", key: "root", children: [circle()]}},
    {width: 200, height: 200, root: {type: "group", key: "root", children: [circle({transform: {x: 110, y: 90}})]}},
  );
  assert.ok(!noOpt(0.5).root.children.some(c => c.key === "p__trail"), "no trail without trail:true");
});

it("interpolateScene sizes a rect's trail to its silhouette perpendicular to travel", () => {
  // A 20×20 square (half-extent 10). Move it and read the cone's tail chord.
  const square = extra => ({
    type: "rect", key: "r", x: -10, y: -10, width: 20, height: 20,
    paint: {fill: "#1c7ed6"}, transform: {x: 0, y: 0}, ...extra,
  });
  // The swept-hull width perpendicular to travel: project every polygon vertex
  // onto the motion perpendicular and take the extent. Robust to the hull's
  // vertex count/order (a rectangle for axis-aligned moves, a hexagon otherwise).
  const perpWidth = (dx, dy) => {
    const interp = interpolateScene(
      {width: 300, height: 300, root: {type: "group", key: "root", children: [square()]}},
      {width: 300, height: 300, root: {type: "group", key: "root",
        children: [square({trail: true, transform: {x: dx, y: dy}})]}},
    );
    const trail = interp(0.5).root.children.find(c => c.key === "r__trail");
    assert.ok(trail && trail.type === "path", "rect emits a swept-hull path trail");
    const pts = trail.d.split(/[MLZ]/).filter(s => s.trim()).map(s => s.split(",").map(Number));
    const len = Math.hypot(dx, dy), px = -dy / len, py = dx / len;
    const proj = pts.map(p => p[0] * px + p[1] * py);
    return Math.max(...proj) - Math.min(...proj);
  };

  // Axis-aligned travel presents the square's side (width 20).
  assert.ok(Math.abs(perpWidth(120, 0) - 20) < 1e-6, "horizontal move → side width (20)");
  assert.ok(Math.abs(perpWidth(0, 120) - 20) < 1e-6, "vertical move → side width (20)");
  // A 45° move presents the corner-to-corner diagonal (20·√2 ≈ 28.28).
  assert.ok(Math.abs(perpWidth(120, 120) - 20 * Math.SQRT2) < 1e-6, "45° move → diagonal width (20√2)");
  // An oblique angle sits between the two — wider than the side, under the diagonal.
  const oblique = perpWidth(160, 120);
  assert.ok(oblique > 20 && oblique < 20 * Math.SQRT2, "30-ish° move → between side and diagonal");

  // A rect without trail:true gets no cone.
  const noOpt = interpolateScene(
    {width: 300, height: 300, root: {type: "group", key: "root", children: [square()]}},
    {width: 300, height: 300, root: {type: "group", key: "root",
      children: [square({transform: {x: 120, y: 120}})]}},
  );
  assert.ok(!noOpt(0.5).root.children.some(c => c.key === "r__trail"), "no rect trail without trail:true");
});

it("persistent trails grow forward in time, cap, and rewind on scrub-back", () => {
  const scene = (x, y, persist) => ({
    width: 300, height: 300,
    root: {type: "group", key: "root", children: [{
      type: "circle", key: "p", cx: 0, cy: 0, r: 6, paint: {fill: "#1c7ed6"},
      transform: {x, y}, trail: true, trailPersist: persist,
    }]},
  });
  // The trail is one node per mark (a single fill, so overlaps don't double);
  // each segment is a subpath, so count the "M" commands in its `d`.
  const trailOf = frame => frame.root.children.find(c => String(c.key) === "p__trail");
  const segCount = frame => {
    const n = trailOf(frame);
    return n ? (n.d.match(/M/g) || []).length : 0;
  };

  // --- Forward accumulation + persist cap (trailPersist: 2) ---
  const log = new TrailLog();
  const s = (x, y) => scene(x, y, 2);
  const s0 = s(10, 10), s1 = s(110, 60), s2 = s(60, 150), s3 = s(160, 200), s4 = s(40, 250);

  // First (seeding) draw at seq 0: a trail needs a forward move to appear.
  commitTrailScene(log, s0, 0);
  assert.strictEqual(segCount(interpolateScene(s0, s0, log)(1)), 0, "no trail before moving");

  // Forward move (seq 1) → one segment that — unlike the ephemeral trail — stays at rest.
  commitTrailScene(log, s1, 1);
  const mid1 = interpolateScene(s0, s1, log)(0.5);
  const node = trailOf(mid1);
  assert.ok(node && node.type === "path", "one trail path emitted");
  assert.ok(node.paint.fill.startsWith("gradient:"), "trail filled by a single gradient");
  assert.strictEqual(segCount(mid1), 1, "one segment after first forward move");
  assert.strictEqual(segCount(interpolateScene(s0, s1, log)(1)), 1, "segment persists at rest (t=1)");

  commitTrailScene(log, s2, 2);
  assert.strictEqual(segCount(interpolateScene(s1, s2, log)(0.5)), 2, "two segments after second forward move");

  // trailPersist: 2 caps the window — after more forward moves it never exceeds 2.
  commitTrailScene(log, s3, 3);
  commitTrailScene(log, s4, 4);
  assert.strictEqual(segCount(interpolateScene(s3, s4, log)(1)), 2, "older segments drop past the persist length");

  // --- Direction: playing newest → oldest draws no trail ---
  const back = new TrailLog();
  const b0 = s(10, 10), b1 = s(110, 60), b2 = s(60, 150);
  commitTrailScene(back, b0, 5);         // seed at the newest period
  commitTrailScene(back, b1, 4);         // step backward in time
  commitTrailScene(back, b2, 3);         // and again
  assert.strictEqual(segCount(interpolateScene(b1, b2, back)(1)), 0, "backward playback from the start leaves no trail");

  // --- Rewind: after building forward, a backward step retracts, not appends ---
  const rw = new TrailLog();
  const p = (x, y) => scene(x, y, true); // long persist, so nothing caps
  const r0 = p(0, 0), r1 = p(50, 0), r2 = p(50, 50), r3 = p(100, 50);
  commitTrailScene(rw, r0, 0);
  commitTrailScene(rw, r1, 1);
  commitTrailScene(rw, r2, 2);
  commitTrailScene(rw, r3, 3);
  assert.strictEqual(segCount(interpolateScene(r2, r3, rw)(1)), 3, "three forward segments");
  // Step back to seq 2: the newest segment retracts (still drawn while animating),
  // but no NEW segment is added — the count doesn't grow.
  commitTrailScene(rw, r2, 2);
  assert.strictEqual(segCount(interpolateScene(r3, r2, rw)(0.5)), 3, "backward retracts the newest, doesn't append");
  // Step back again: the retracted one is dropped and the next retracts → two remain.
  commitTrailScene(rw, r1, 1);
  assert.strictEqual(segCount(interpolateScene(r2, r1, rw)(0.5)), 2, "rewinding drops segments as it goes back");

  // Multi-step back: jump straight from seq 3 to seq 1 in one commit — every
  // segment after seq 1 must drop, not just the newest.
  const jump = new TrailLog();
  commitTrailScene(jump, r0, 0);
  commitTrailScene(jump, r1, 1);
  commitTrailScene(jump, r2, 2);
  commitTrailScene(jump, r3, 3);
  assert.strictEqual(segCount(interpolateScene(r2, r3, jump)(1)), 3, "three forward segments before the jump");
  commitTrailScene(jump, r1, 1); // jump back two periods at once
  assert.strictEqual(segCount(interpolateScene(r3, r1, jump)(0.5)), 2, "a two-step jump back drops both later segments, not one");

  // Coarse forward jump then a single step back: the jump made ONE segment
  // spanning the skipped period; stepping back into it must truncate that
  // segment to the now-revealed position (reconnecting to the mark), not retract
  // the whole jump and detach.
  const coarse = new TrailLog();
  const g0 = p(0, 0), g2 = p(100, 100), g1 = p(40, 60); // g1 is off the g0→g2 line
  commitTrailScene(coarse, g0, 0);
  commitTrailScene(coarse, g2, 2); // jump forward two periods → one coarse segment
  commitTrailScene(coarse, g1, 1); // step back one period; mark revealed at (40,60)
  const {committed, animating} = coarse.segments("p");
  assert.strictEqual(committed.length, 1, "coarse segment truncated to a single segment");
  assert.strictEqual(animating, null, "no leftover retract");
  assert.deepStrictEqual(committed[0].B, [40, 60], "truncated segment ends at the revealed position, reconnecting the mark");
});
