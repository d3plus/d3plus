import {it} from "vitest";
import assert from "assert";
import {
  offsetPolyline,
  PolylineRuler,
  uprightPoints,
} from "../../src/charts/features/pathLabelGeometry.ts";
import {
  bestStretchAt,
  curvature,
  labelBand,
  PointGrid,
  resample,
  scoreStretch,
} from "../../src/charts/Plot/lineLabelsAlong.ts";

// Reference implementations: a stretch walked from the polyline's start
// every time, an offset taking each segment's normal at both its ends, a
// score over the whole band at once, and the resampler and stretch search
// built on them.

function refLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  return total;
}

function refTrim(points, from, to) {
  const out = [];
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const len = Math.hypot(bx - ax, by - ay);
    const next = walked + len;
    const at = s => {
      const t = len ? (s - walked) / len : 0;
      return [ax + (bx - ax) * t, ay + (by - ay) * t];
    };
    if (next >= from && walked <= to) {
      if (!out.length) out.push(at(Math.max(from, walked)));
      if (next <= to) out.push([bx, by]);
      else {
        out.push(at(to));
        break;
      }
    }
    walked = next;
  }
  return out;
}

function refResample(points, step) {
  const length = refLength(points);
  const out = [];
  for (let s = 0; s <= length; s += step) {
    const [p] = refTrim(points, s, s);
    if (p) out.push(p);
  }
  return out;
}

function refOffset(points, distance) {
  if (points.length < 2 || !distance) return points;
  const normal = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  };
  return points.map((p, i) => {
    const before = i > 0 ? normal(points[i - 1], p) : null;
    const after = i < points.length - 1 ? normal(p, points[i + 1]) : null;
    const n =
      before && after
        ? [before[0] + after[0], before[1] + after[1]]
        : (before ?? after);
    const len = Math.hypot(n[0], n[1]) || 1;
    return [p[0] + (n[0] / len) * distance, p[1] + (n[1] / len) * distance];
  });
}

function refBand(points, ctx) {
  const step = Math.max(2, ctx.fontSize / 2);
  return [0, 0.35, 0.7].flatMap(f =>
    refResample(refOffset(points, ctx.lift + f * ctx.fontSize), step),
  );
}

function refScore(points, ctx) {
  const band = refBand(points, ctx);
  const {rect, minClearance = 2} = ctx;
  let clearance = Infinity;
  for (const p of band) {
    if (p[0] < rect.x0 || p[0] > rect.x1 || p[1] < rect.y0 || p[1] > rect.y1)
      return null;
    clearance = Math.min(clearance, ctx.grid.nearest(p, ctx.ignore));
    if (clearance < minClearance) return null;
  }
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const slope = Math.abs(Math.atan2(y1 - y0, x1 - x0));
  const {roomReach = ctx.fontSize, roomWeight = 0.5} = ctx;
  const room = Math.min(clearance, roomReach) / roomReach;
  return curvature(points) * 2 + slope * 0.5 - room * roomWeight;
}

function refBestStretchAt(pieces, length, ctx, allow) {
  let best = null;
  let bestScore = Infinity;
  const step = Math.max(4, ctx.fontSize / 2);
  const maxTurn = ctx.maxTurn ?? Math.PI / 2;
  for (let index = 0; index < pieces.length; index++) {
    const piece = pieces[index];
    const total = refLength(piece);
    for (let from = 0; from + length <= total; from += step) {
      if (allow && !allow(from, index)) continue;
      const stretch = uprightPoints(
        refTrim(piece, from, from + length),
        ctx.steep,
      );
      if (curvature(stretch) > maxTurn) continue;
      const score = refScore(stretch, ctx);
      if (score !== null && score < bestScore) {
        bestScore = score;
        best = {points: stretch, piece: index, from};
      }
    }
  }
  return best;
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Random polylines: walks, with repeated points, collinear runs, and the degenerate cases. */
function polylines(random) {
  const out = [
    [],
    [[5, 5]],
    [
      [3, 3],
      [3, 3],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ];
  out.push([
    [0, 0],
    [10, 0],
    [20, 0],
    [30, 0],
  ]);
  for (let n = 0; n < 40; n++) {
    const count = 2 + Math.floor(random() * 60);
    let x = random() * 400,
      y = random() * 300;
    const line = [[x, y]];
    for (let k = 1; k < count; k++) {
      const r = random();
      if (r < 0.1) line.push([x, y]);
      else {
        x += (random() - 0.3) * 30;
        y += (random() - 0.5) * 30;
        line.push([x, y]);
      }
    }
    out.push(line);
  }
  return out;
}

it("PolylineRuler — trim and at match trimming from the start, in any order", () => {
  const random = seeded(7);
  for (const line of polylines(random)) {
    const ruler = new PolylineRuler(line);
    assert.strictEqual(ruler.length, refLength(line));
    const total = ruler.length;
    // Forward walks, then jumps back and forth, past both ends, and backwards ranges.
    const queries = [];
    for (let s = 0; s <= total + 5; s += 3.7) queries.push([s, s + 25]);
    for (let k = 0; k < 60; k++) {
      const a = (random() * 1.4 - 0.2) * total;
      queries.push([a, a + (random() - 0.2) * total]);
    }
    queries.push([0, 0], [total, total], [-5, -1], [NaN, 10], [0, NaN]);
    for (const [from, to] of queries) {
      assert.deepStrictEqual(
        ruler.trim(from, to),
        refTrim(line, from, to),
        `trim ${from}..${to}`,
      );
      assert.deepStrictEqual(
        ruler.at(from),
        refTrim(line, from, from)[0],
        `at ${from}`,
      );
    }
  }
});

it("resample — matches resampling by trimming from the start", () => {
  const random = seeded(11);
  for (const line of polylines(random))
    for (const step of [0.5, 2, 3, 7.3, 1000])
      assert.deepStrictEqual(resample(line, step), refResample(line, step));
});

it("bestStretchAt — matches the search that trims each candidate from the start", () => {
  const random = seeded(23);
  const lines = polylines(random).filter(l => l.length > 1);
  const rect = {x0: -50, y0: -50, x1: 600, y1: 450};
  let found = 0;
  for (let k = 0; k < lines.length; k += 3) {
    const pieces = lines.slice(k, k + 2);
    for (const fontSize of [8, 12]) {
      const grid = new PointGrid(fontSize);
      // Obstacles: other lines, and an offset copy of these pieces.
      for (const other of lines.slice(k + 2, k + 5))
        grid.add(refResample(other, 2));
      for (const piece of pieces)
        grid.add(refResample(offsetPolyline(piece, 9), 2), 1);
      const ctx = {grid, rect, fontSize, lift: 3.5, ignore: 1};
      const allow = (from, piece) => piece === 1 || from % 3 < 2;
      for (const length of [20, 60, 140]) {
        const spot = bestStretchAt(pieces, length, ctx);
        assert.deepStrictEqual(spot, refBestStretchAt(pieces, length, ctx));
        if (spot) found++;
        assert.deepStrictEqual(
          bestStretchAt(pieces, length, {...ctx, steep: 0.5}, allow),
          refBestStretchAt(pieces, length, {...ctx, steep: 0.5}, allow),
        );
      }
    }
  }
  assert.ok(found > 10, `${found} stretches found`);
  assert.strictEqual(bestStretchAt([], 10, {fontSize: 12}), null);
});

it("offsetPolyline, labelBand and scoreStretch — match the references", () => {
  const random = seeded(31);
  const lines = polylines(random);
  const grid = new PointGrid(10);
  for (const line of lines.slice(20)) grid.add(refResample(line, 2));
  const rect = {x0: 0, y0: 0, x1: 500, y1: 400};
  let scored = 0;
  for (const line of lines.slice(0, 25))
    for (const distance of [0, 3.5, -4.2, 11]) {
      assert.deepStrictEqual(
        offsetPolyline(line, distance),
        refOffset(line, distance),
      );
      if (line.length < 2) continue;
      for (const minClearance of [0, 2, 6]) {
        const ctx = {grid, rect, fontSize: 10, lift: distance, minClearance};
        assert.deepStrictEqual(labelBand(line, ctx), refBand(line, ctx));
        const score = scoreStretch(line, ctx);
        assert.deepStrictEqual(score, refScore(line, ctx));
        if (score !== null) scored++;
      }
    }
  assert.ok(scored > 20, `${scored} stretches scored`);
});
