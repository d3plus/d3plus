import {it} from "vitest";
import assert from "assert";

import {
  dct2d,
  densify,
  diffusionCartogram,
  fft,
} from "../../src/charts/Geomap/cartogramDiffusion.ts";

/** Experimental: the Gastner–Newman diffusion cartogram prototype. */

const area = ring =>
  Math.abs(
    ring.reduce((s, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );

it("fft and its inverse round-trip, and dct2d's inverse undoes it", () => {
  const re = Float64Array.from([1, 2, 3, 4, 0, -1, 2, 5]),
    im = new Float64Array(8);
  const original = Float64Array.from(re);
  fft(re, im);
  assert.ok(Math.abs(re[0] - 16) < 1e-12, "the DC term is the sum");
  fft(re, im, true);
  re.forEach((v, i) => assert.ok(Math.abs(v / 8 - original[i]) < 1e-12));
  const grid = Float64Array.from({length: 64}, (_, i) => Math.sin(i) + i / 10);
  const copy = Float64Array.from(grid);
  dct2d(grid, 8);
  assert.ok(Math.abs(grid[0] - copy.reduce((a, b) => a + b)) < 1e-9);
  dct2d(grid, 8, true);
  grid.forEach((v, i) => assert.ok(Math.abs(v - copy[i]) < 1e-12));
});

it("densify adds the same points to an edge from either end", () => {
  const ring = [
    [0, 0],
    [10, 0],
    [10, 1],
  ];
  const out = densify(ring, 2.5);
  assert.strictEqual(out.length, 3 + 3 + 4, "the two long edges gain points");
  const forward = densify(
    [
      [0, 0],
      [10, 0],
    ],
    2.5,
  ).slice(1, 4);
  const back = densify(
    [
      [10, 0],
      [0, 0],
    ],
    2.5,
  )
    .slice(1, 4)
    .reverse();
  assert.deepStrictEqual(forward, back);
});

it("diffusionCartogram grows the denser of two squares and keeps their shared border", () => {
  const left = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  const right = [
    [200, 100],
    [100, 100],
    [100, 0],
    [200, 0],
  ];
  const [a, b] = diffusionCartogram(
    [
      {rings: [left], value: 3},
      {rings: [right], value: 1},
    ],
    {grid: 64},
  );
  const ratio = area(a[0]) / area(b[0]);
  assert.ok(ratio > 2.5 && ratio < 3.2, `toward 3:1 (${ratio})`);
  const key = p => p.join(",");
  const shared = a[0].map(key).filter(k => b[0].map(key).includes(k));
  assert.ok(shared.length >= 2, "the border's points are shared");
  assert.deepStrictEqual(diffusionCartogram([]), []);
});
