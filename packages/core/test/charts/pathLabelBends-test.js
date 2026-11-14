import {it} from "vitest";
import assert from "assert";
import {
  bendStrain,
  holdsBends,
  PATH_LABEL_INNER_RADIUS,
  PATH_LABEL_OUTER_RADIUS,
  sharpestTurn,
  smoothPolyline,
  textFollows,
} from "../../src/charts/features/pathLabelBends.ts";
import {polylineLength} from "../../src/charts/features/pathLabelGeometry.ts";

/**
    An arc of radius `r`, `length` long, running left to right from `[0, 0]`
    and turning toward the top of the screen (`"left"`, where text along it
    sits) or the bottom (`"right"`), a point every pixel.
*/
const arc = (r, length, side) => {
  const sign = side === "left" ? -1 : 1;
  return Array.from({length: Math.round(length) + 1}, (_, k) => {
    const a = k / r;
    return [r * Math.sin(a), sign * r * (1 - Math.cos(a))];
  });
};

/** The least distance from `p` to any of `points`. */
const nearest = (points, p) =>
  Math.min(...points.map(q => Math.hypot(q[0] - p[0], q[1] - p[1])));

it("sharpestTurn — counts the turns toward one side, or both", () => {
  // Right, then up the screen: a turn to the left of its direction.
  const up = [
    [0, 0],
    [10, 0],
    [20, -10],
  ];
  assert.ok(Math.abs(sharpestTurn(up, 20) - Math.PI / 4) < 1e-9);
  assert.ok(Math.abs(sharpestTurn(up, 20, "left") - Math.PI / 4) < 1e-9);
  assert.strictEqual(sharpestTurn(up, 20, "right"), 0);
  // A zig-zag turns both ways, and each side counts only its own turns.
  const zig = [
    [0, 0],
    [10, 0],
    [20, -10],
    [30, -10],
    [40, 0],
  ];
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
  close(sharpestTurn(zig, 100), (3 * Math.PI) / 4);
  close(sharpestTurn(zig, 100, "left"), Math.PI / 4);
  close(sharpestTurn(zig, 100, "right"), Math.PI / 2);
  // Over a circle of radius r, any span turns about span / r.
  const circle = arc(40, 120, "left");
  assert.ok(Math.abs(sharpestTurn(circle, 20, "left") - 21 / 40) < 0.01);
});

it("holdsBends — no tighter than a radius, over a span, on either or one side", () => {
  const circle = arc(40, 120, "left");
  assert.ok(holdsBends(circle, 40, 10));
  assert.ok(holdsBends(circle, 30, 10));
  assert.ok(!holdsBends(circle, 60, 10));
  assert.ok(holdsBends(circle, 60, 10, "right"), "it never turns right");
  assert.ok(!holdsBends(circle, 60, 10, "left"));
  assert.ok(holdsBends(circle, 0), "no radius, no limit");
  // A stretch shorter than the span is measured whole.
  assert.ok(holdsBends(arc(40, 5, "left"), 40, 100));
});

it("bendStrain — tighter toward the text than away from it", () => {
  const fontSize = 10;
  const straight = [
    [0, 0],
    [200, 0],
  ];
  assert.strictEqual(bendStrain(straight, fontSize), 0);
  assert.ok(textFollows(straight, fontSize));
  // Between the two limits: letters crowd bending toward the text, and
  // fan out (allowed) bending away from it.
  const between =
    ((PATH_LABEL_INNER_RADIUS + PATH_LABEL_OUTER_RADIUS) / 2) * 10;
  const toward = arc(between, 100, "left");
  const away = arc(between, 100, "right");
  assert.ok(bendStrain(toward, fontSize) > 1);
  assert.ok(!textFollows(toward, fontSize));
  assert.ok(bendStrain(away, fontSize) <= 1);
  assert.ok(textFollows(away, fontSize));
  // Wider than the inner limit, a bend either way is gentle enough.
  const wide = (PATH_LABEL_INNER_RADIUS + 0.5) * fontSize;
  assert.ok(textFollows(arc(wide, 100, "left"), fontSize));
  assert.ok(textFollows(arc(wide, 100, "right"), fontSize));
  // A kink fails either way.
  const kink = [
    [0, 0],
    [50, 0],
    [100, 50],
  ];
  assert.ok(!textFollows(kink, fontSize));
  assert.ok(
    !textFollows(
      kink.map(([x, y]) => [x, -y]),
      fontSize,
    ),
  );
});

it("smoothPolyline — leaves a polyline that never turns as it is", () => {
  const straight = [
    [0, 0],
    [50, 25],
    [100, 50],
  ];
  assert.strictEqual(smoothPolyline(straight, 10), straight);
  const two = [
    [0, 0],
    [100, 30],
  ];
  assert.strictEqual(smoothPolyline(two, 10), two);
  const bent = [
    [0, 0],
    [50, 0],
    [100, 50],
  ];
  assert.strictEqual(smoothPolyline(bent, 0), bent, "no radius");
});

it("smoothPolyline — rounds a kink off, its ends where they were", () => {
  const corner = [
    [0, 0],
    [100, 0],
    [100, 100],
  ];
  const out = smoothPolyline(corner, 10);
  assert.deepStrictEqual(out[0], [0, 0]);
  assert.deepStrictEqual(out[out.length - 1], [100, 100]);
  // Points no more than 2px apart.
  for (let k = 1; k < out.length; k++)
    assert.ok(
      Math.hypot(out[k][0] - out[k - 1][0], out[k][1] - out[k - 1][1]) <=
        2 + 1e-9,
    );
  // The quarter turn spreads over about twice the radius (half of it within
  // any quarter of that), cutting the corner by no more than a third of
  // the radius.
  const quarter = Math.PI / 2;
  assert.ok(sharpestTurn(corner, 5) > quarter - 1e-9);
  assert.ok(sharpestTurn(out, 5) < 0.6 * quarter, `${sharpestTurn(out, 5)}`);
  assert.ok(sharpestTurn(out, 20) > 0.95 * quarter);
  const cut = nearest(out, [100, 0]);
  assert.ok(cut > 1 && cut < 10 / 3, `cuts the corner by ${cut}`);
  // Away from the corner it stays on the line.
  assert.ok(nearest(out, [40, 0]) < 1e-9);
  assert.ok(nearest(out, [100, 60]) < 1e-9);
  // Its length shrinks by little more than the corner it cuts.
  assert.ok(polylineLength(out) > 195 && polylineLength(out) < 200);
});

it("smoothPolyline — smooths a closed ring all the way round", () => {
  const square = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
    [0, 0],
  ];
  const out = smoothPolyline(square, 10);
  assert.deepStrictEqual(out[0], out[out.length - 1], "still closed");
  // Every corner is rounded alike, the one where the ring starts too.
  const cuts = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ].map(p => nearest(out, p));
  for (const cut of cuts) assert.ok(Math.abs(cut - cuts[1]) < 0.5, `${cuts}`);
  // Read across the seam, it turns as sharply as at any other corner.
  const across = [...out.slice(-20), ...out.slice(1, 20)];
  const at = k => out.slice(k - 20, k + 20);
  const corner = out.findIndex(p => p[0] > 99 && p[1] > 0);
  assert.ok(sharpestTurn(across, 10) < 0.6 * Math.PI);
  assert.ok(
    Math.abs(sharpestTurn(across, 10) - sharpestTurn(at(corner), 10)) < 0.05,
  );
});

it("smoothPolyline — a zig-zag shorter than a letter flattens enough to follow", () => {
  const fontSize = 10;
  const jitter = Array.from({length: 41}, (_, k) => [
    k * 5,
    k % 2 ? 1.5 : -1.5,
  ]);
  assert.ok(!textFollows(jitter, fontSize));
  const out = smoothPolyline(jitter, fontSize);
  // Away from its pinned ends.
  const middle = out.filter(([x]) => x > 20 && x < 180);
  assert.ok(textFollows(middle, fontSize));
  assert.ok(middle.every(([, y]) => Math.abs(y) < 1));
});
