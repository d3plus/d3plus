import assert from "assert";
import {
  closestFreeOffset,
  fitSwarms,
  swarmExtent,
  swarmFitScale,
  swarmLayout,
} from "../../es/src/charts/Plot/swarmLayout.js";

/** Deterministic pseudo-random values with a bell-ish distribution. */
function sample(n, seed = 11, spread = 200) {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({length: n}, () => {
    let v = 0;
    for (let k = 0; k < 4; k++) v += rand();
    return (v / 4) * spread;
  });
}

/** Smallest gap between any two circles (negative = overlap). */
function minGap(nodes, offsets, padding = 0, scale = 1) {
  let gap = Infinity;
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(
        nodes[i].value - nodes[j].value,
        offsets[i] - offsets[j],
      );
      gap = Math.min(
        gap,
        d - (nodes[i].r + nodes[j].r) * scale - padding * scale,
      );
    }
  return gap;
}

it("closestFreeOffset — the centerline when nothing blocks it", () => {
  assert.strictEqual(closestFreeOffset([]), 0);
  assert.strictEqual(
    closestFreeOffset([
      [2, 4],
      [-5, -1],
    ]),
    0,
  );
});

it("closestFreeOffset — the nearest edge of the blocked run around 0", () => {
  assert.strictEqual(closestFreeOffset([[-1, 3]]), -1);
  assert.strictEqual(closestFreeOffset([[-3, 1]]), 1);
  // Overlapping intervals merge into one run [-4, 2].
  assert.strictEqual(
    closestFreeOffset([
      [-1, 2],
      [-4, 0],
    ]),
    2,
  );
});

it("closestFreeOffset — ties go to the negative side; touching intervals leave the seam free", () => {
  assert.strictEqual(closestFreeOffset([[-2, 2]]), -2);
  assert.strictEqual(
    closestFreeOffset([
      [-2, 0],
      [0, 2],
    ]),
    0,
  );
  assert.strictEqual(
    closestFreeOffset([
      [-2, 2],
      [2, 6],
      [-6, -2],
    ]),
    -2,
  );
  assert.strictEqual(
    closestFreeOffset([
      [-2, 2],
      [1, 6],
      [-6, -1],
    ]),
    -6,
  );
});

it("swarmLayout — no two circles overlap", () => {
  const values = sample(400);
  const nodes = values.map((value, i) => ({value, r: 2 + (i % 4)}));
  const offsets = swarmLayout(nodes, 1);
  assert.strictEqual(offsets.length, nodes.length);
  assert.ok(
    minGap(nodes, offsets, 1) > -1e-6,
    `min gap ${minGap(nodes, offsets, 1)}`,
  );
});

it("swarmLayout — deterministic, and independent of input order for distinct values", () => {
  const nodes = sample(150).map((value, i) => ({
    value: value + i * 1e-6,
    r: 3,
  }));
  const a = swarmLayout(nodes, 1);
  assert.deepStrictEqual(swarmLayout(nodes, 1), a, "same input, same output");
  const reversed = nodes.slice().reverse();
  const b = swarmLayout(reversed, 1).reverse();
  b.forEach((o, i) => assert.ok(Math.abs(o - a[i]) < 1e-9, `node ${i}`));
});

it("swarmLayout — identical values stack outward, alternating sides", () => {
  const nodes = Array.from({length: 5}, () => ({value: 10, r: 5}));
  assert.deepStrictEqual(swarmLayout(nodes, 0), [0, -10, 10, -20, 20]);
  assert.deepStrictEqual(swarmLayout(nodes.slice(0, 3), 2), [0, -12, 12]);
});

it("swarmLayout — leaves isolated circles on the centerline", () => {
  const nodes = [0, 50, 100].map(value => ({value, r: 5}));
  assert.deepStrictEqual(swarmLayout(nodes, 1), [0, 0, 0]);
  assert.deepStrictEqual(swarmLayout([], 1), []);
  assert.deepStrictEqual(swarmLayout([{value: 3, r: 2}], 1), [0]);
});

it("swarmLayout — respects each circle's radius", () => {
  const nodes = [
    {value: 0, r: 20},
    {value: 5, r: 3},
    {value: 10, r: 3},
  ];
  const offsets = swarmLayout(nodes, 0);
  assert.strictEqual(offsets[0], 0);
  // The small circles clear the big one: |offset| ≥ sqrt((20+3)² - dx²).
  assert.ok(Math.abs(offsets[1]) >= Math.sqrt(23 * 23 - 25) - 1e-9);
  assert.ok(minGap(nodes, offsets) > -1e-9);
});

it("swarmLayout — packs a few thousand circles quickly", () => {
  const nodes = sample(3000, 5, 600).map(value => ({value, r: 2}));
  const t0 = Date.now();
  swarmLayout(nodes, 0.5);
  assert.ok(Date.now() - t0 < 1500, `took ${Date.now() - t0}ms`);
});

it("swarmExtent — farthest circle edge from the centerline", () => {
  const nodes = [
    {value: 0, r: 2},
    {value: 0, r: 3},
  ];
  assert.strictEqual(swarmExtent(nodes, [0, -5]), 8);
  assert.strictEqual(swarmExtent(nodes, [0, -5], 0.5), 6.5);
  assert.strictEqual(swarmExtent([], []), 0);
});

it("swarmFitScale — 1 when the swarm fits, smaller (and fitting) when it doesn't", () => {
  const sparse = [0, 50, 100].map(value => ({value, r: 5}));
  assert.strictEqual(swarmFitScale(sparse, 1, 20), 1);
  const dense = sample(500, 3, 100).map(value => ({value, r: 4}));
  const scale = swarmFitScale(dense, 1, 30);
  assert.ok(scale < 1 && scale > 0, `scale ${scale}`);
  const scaled = dense.map(n => ({value: n.value, r: n.r * scale}));
  assert.ok(swarmExtent(dense, swarmLayout(scaled, scale), scale) <= 30 + 1e-9);
});

it("fitSwarms — shrink uses one scale for every swarm and fits each band", () => {
  const groups = [
    sample(300, 2, 100).map(value => ({value, r: 4})),
    sample(20, 9, 100).map(value => ({value, r: 4})),
  ];
  const {offsets, scale} = fitSwarms(groups, {
    padding: 1,
    extent: 25,
    overflow: "shrink",
  });
  assert.ok(scale < 1, "the dense swarm forced a shrink");
  assert.ok(
    scale <= swarmFitScale(groups[0], 1, 25) + 1e-12,
    "shared scale is the smallest",
  );
  groups.forEach((g, k) => {
    assert.ok(
      swarmExtent(g, offsets[k], scale) <= 25 + 1e-9,
      `group ${k} fits`,
    );
    assert.ok(
      minGap(g, offsets[k], 1, scale) > -1e-6,
      `group ${k} has no overlaps`,
    );
  });
});

it("fitSwarms — clamp keeps sizes and holds circles inside the band; visible lets them spill", () => {
  const group = sample(200, 4, 60).map(value => ({value, r: 4}));
  const clamped = fitSwarms([group], {
    padding: 1,
    extent: 15,
    overflow: "clamp",
  });
  assert.strictEqual(clamped.scale, 1);
  assert.ok(swarmExtent(group, clamped.offsets[0]) <= 15 + 1e-9);
  const visible = fitSwarms([group], {
    padding: 1,
    extent: 15,
    overflow: "visible",
  });
  assert.strictEqual(visible.scale, 1);
  assert.deepStrictEqual(visible.offsets[0], swarmLayout(group, 1));
  assert.ok(swarmExtent(group, visible.offsets[0]) > 15);
});
