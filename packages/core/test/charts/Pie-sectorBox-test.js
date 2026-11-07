import {it} from "vitest";
import assert from "assert";
import {near} from "~test/helpers.js";
import {
  centeredSectorBox,
  largestSectorBox,
  sectorBoxAt,
  sectorBoxRange,
  sectorEdges,
} from "../../src/charts/Pie/sectorBox.ts";
import {bisectorOffset, boxInSector, pointInSector} from "./sectorInside.js";

const deg = d => (d * Math.PI) / 180;

/** A ring segment from `start` to `end` degrees. */
const seg = (start, end, inner = 0, outer = 100, padAngle = 0) => ({
  innerRadius: inner,
  outerRadius: outer,
  startAngle: deg(start),
  endAngle: deg(end),
  padAngle,
});

/** A box's center. */
const centerOf = b => [b.x + b.width / 2, b.y + b.height / 2];

const shapes = {
  "a quarter wedge": seg(0, 90),
  "a thin wedge": seg(30, 40),
  "a half disc": seg(-90, 90),
  "a wedge past half a turn": seg(0, 250),
  "a wedge of most of the turn": seg(20, 340),
  "a ring segment": seg(100, 160, 50),
  "a ring segment past half a turn": seg(0, 300, 40),
  "a padded wedge": seg(0, 72, 0, 100, 0.08),
  "a padded ring segment": seg(200, 290, 60, 100, 0.06),
  "a counter-clockwise wedge": seg(0, -120),
  "a whole disc": seg(0, 360),
  "a whole ring": seg(0, 360, 55),
};

it("sectorEdges — the bisector, span and radii a box keeps within", () => {
  const e = sectorEdges(seg(0, 90));
  near(e.mid, deg(45), 1e-12, "mid");
  near(e.span, deg(90), 1e-12, "span");
  near(e.dir[0], Math.SQRT1_2, 1e-12, "points up and right");
  near(e.dir[1], -Math.SQRT1_2, 1e-12, "points up and right");
  assert.strictEqual(e.inner, 0);
  assert.strictEqual(e.outer, 100);
  assert.strictEqual(e.sides.length, 2);
  for (const s of e.sides) near(s.offset, 0, 1e-12, "no pad");

  const ccw = sectorEdges(seg(0, -90));
  near(ccw.mid, deg(-45), 1e-12, "a counter-clockwise segment");

  const padded = sectorEdges(seg(0, 90, 0, 100, 0.1));
  near(padded.span, deg(90) - 0.1, 1e-12, "a pad narrows a wedge");
  const ring = sectorEdges(seg(0, 90, 30, 100, 0.1));
  near(ring.span, deg(90), 1e-12, "a pad keeps a ring segment's angles");
  near(
    ring.sides[0].offset,
    Math.hypot(30, 100) * Math.sin(0.05),
    1e-12,
    "and moves its sides in by its half-gap",
  );

  const kept = sectorEdges(seg(0, 90, 30, 100), 4);
  assert.deepStrictEqual([kept.inner, kept.outer], [34, 96]);
  assert.strictEqual(kept.sides[0].offset, 4);
  assert.strictEqual(sectorEdges(seg(0, 90), 4).inner, 0, "no hole to pad");

  const full = sectorEdges(seg(-90, 270, 40));
  assert.strictEqual(full.mid, 0, "a full turn's bisector points up");
  assert.strictEqual(full.sides.length, 0);

  assert.strictEqual(sectorEdges(seg(10, 10)), null, "no span");
  assert.strictEqual(sectorEdges(seg(0, 90, 100, 100)), null, "no ring");
  assert.strictEqual(sectorEdges(seg(0, 1, 0, 100, 0.1)), null, "all pad");
});

it("sectorBoxRange — a box fits all along its stretch of the bisector, and not past it", () => {
  for (const [name, arc] of Object.entries(shapes)) {
    const edges = sectorEdges(arc);
    for (const [w, h] of [
      [20, 10],
      [6, 30],
      [40, 4],
    ]) {
      const range = sectorBoxRange(edges, w, h);
      if (!range) continue;
      assert.ok(range.lo <= range.hi, `${name}: ${w}×${h}`);
      for (let k = 0; k <= 10; k++) {
        const t = range.lo + ((range.hi - range.lo) * k) / 10;
        assert.ok(
          boxInSector(arc, sectorBoxAt(edges, t, w, h), 1e-6),
          `${name}: ${w}×${h} fits at ${t}`,
        );
      }
      assert.ok(
        !boxInSector(arc, sectorBoxAt(edges, range.hi + 0.5, w, h)),
        `${name}: ${w}×${h} doesn't fit past ${range.hi}`,
      );
      if (range.lo > 0.5)
        assert.ok(
          !boxInSector(arc, sectorBoxAt(edges, range.lo - 0.5, w, h)),
          `${name}: ${w}×${h} doesn't fit before ${range.lo}`,
        );
    }
  }
});

it("sectorBoxRange — what bounds the stretch in each kind of segment", () => {
  const disc = sectorBoxRange(sectorEdges(seg(0, 360)), 120, 160);
  near(
    disc.hi,
    0,
    1e-9,
    "a box 200 across corner to corner only fits at a disc's center",
  );
  near(disc.lo, -disc.hi, 1e-12, "a disc's stretch runs through its center");
  const small = sectorBoxRange(sectorEdges(seg(0, 360)), 6, 8);
  near(small.lo, -small.hi, 1e-12, "centered on the disc's center");

  const ring = sectorBoxRange(sectorEdges(seg(0, 360, 50)), 20, 10);
  near(ring.lo, 55, 1e-9, "clears a whole ring's hole");
  near(ring.hi, -5 + Math.sqrt(25 - (125 - 10000)), 1e-9, "inside its rim");

  // A quarter wedge's sides each hold the box back from the center.
  const quarter = sectorBoxRange(sectorEdges(seg(0, 90)), 20, 10);
  near(
    quarter.lo,
    10 / Math.SQRT1_2,
    1e-9,
    "its half-width off the upright side",
  );

  assert.strictEqual(
    sectorBoxRange(sectorEdges(seg(30, 40)), 40, 20),
    null,
    "too big for a thin wedge",
  );
  assert.strictEqual(sectorBoxRange(sectorEdges(seg(0, 360)), 150, 150), null);

  // Past half a turn, the gap (up and to the left here) is cleared by the
  // box's top edge staying below the center, the nearest way round.
  const wide = sectorBoxRange(sectorEdges(seg(0, 300)), 20, 10);
  near(wide.lo, 5 / Math.cos(deg(30)), 1e-9, "clears the gap");
  // Padding keeps the box further from the sides.
  const padded = sectorBoxRange(sectorEdges(seg(0, 90), 5), 20, 10);
  assert.ok(padded.lo > quarter.lo && padded.hi < quarter.hi);
});

it("sectorBoxAt / centeredSectorBox — boxes centered on the bisector, halfway along their stretch", () => {
  const edges = sectorEdges(seg(0, 90));
  const at = sectorBoxAt(edges, 50, 20, 10);
  const [cx, cy] = centerOf(at);
  near(cx, 50 * Math.SQRT1_2, 1e-9, "x");
  near(cy, -50 * Math.SQRT1_2, 1e-9, "y");
  assert.deepStrictEqual([at.width, at.height], [20, 10]);

  for (const [name, arc] of Object.entries(shapes)) {
    const e = sectorEdges(arc);
    const box = centeredSectorBox(e, 12, 8);
    if (!box) continue;
    const range = sectorBoxRange(e, 12, 8);
    const {across, along} = bisectorOffset(arc, centerOf(box));
    near(across, 0, 1e-9, `${name}: on the bisector`);
    near(along, (range.lo + range.hi) / 2, 1e-9, `${name}: halfway along`);
    assert.ok(boxInSector(arc, box), `${name}: inside`);
  }
  assert.strictEqual(centeredSectorBox(sectorEdges(seg(30, 40)), 50, 50), null);
});

it("largestSectorBox — the largest box of a shape that fits, in every kind of segment", () => {
  for (const [name, arc] of Object.entries(shapes)) {
    const edges = sectorEdges(arc);
    for (const aspect of [0.5, 1, 3, 8]) {
      const box = largestSectorBox(edges, s => [s * aspect, s]);
      assert.ok(box, `${name}: a ${aspect}:1 box`);
      assert.ok(boxInSector(arc, box, 1e-6), `${name}: ${aspect}:1 inside`);
      near(bisectorOffset(arc, centerOf(box)).across, 0, 1e-9, name);
      const s = box.height * 1.01;
      assert.strictEqual(
        sectorBoxRange(edges, s * aspect, s),
        null,
        `${name}: a ${aspect}:1 box 1% larger fits nowhere`,
      );
    }
  }
  // A square in a disc: its diagonal is the diameter.
  const square = largestSectorBox(sectorEdges(seg(0, 360)), s => [s, s]);
  near(square.width, 100 * Math.SQRT2, 1e-6, "a square in a disc");
  near(centerOf(square)[0], 0, 1e-9, "at the disc's center");
  // In a half disc, the largest 2:1 box stands on the diameter.
  const half = largestSectorBox(sectorEdges(seg(-90, 90)), s => [s * 2, s]);
  near(half.width, 100 * Math.SQRT2, 1e-6, "a 2:1 box in a half disc");
  near(half.y + half.height, 0, 1e-6, "stands on the diameter");
  assert.strictEqual(
    largestSectorBox(sectorEdges(seg(0, 90)), () => [300, 300]),
    null,
    "a shape that never fits",
  );
});

it("sector checks — the test's own polar check agrees on simple points", () => {
  const arc = seg(0, 90, 20);
  assert.ok(pointInSector(arc, [30, -30]));
  assert.ok(!pointInSector(arc, [-30, -30]), "before the start");
  assert.ok(!pointInSector(arc, [5, -5]), "in the hole");
  assert.ok(!pointInSector(arc, [90, -90]), "past the rim");
  const reflex = seg(0, 270);
  assert.ok(pointInSector(reflex, [-30, 30]), "past half a turn");
  assert.ok(!pointInSector(reflex, [-30, -30]), "in the gap");
});
