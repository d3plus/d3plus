import assert from "assert";
import {
  radialRotation,
  sunburstCollapse,
  sunburstLabelBox,
  sunburstPadAngle,
  sunburstRadii,
  tangentialRotation,
} from "../../es/src/charts/Sunburst/geometry.js";

const TAU = Math.PI * 2;
const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("Sunburst geometry: sunburstRadii: gives the center slot and every ring the same thickness by default", () => {
  const radii = sunburstRadii(300, 2);
  assert.deepStrictEqual(radii, [
    [0, 100],
    [100, 200],
    [200, 300],
  ]);
});

it('Sunburst geometry: sunburstRadii: gives every slot the same area in "area" mode', () => {
  const radii = sunburstRadii(300, 3, "area");
  const areas = radii.map(([r0, r1]) => r1 * r1 - r0 * r0);
  areas.forEach(a => close(a, areas[0], "equal ring area"));
  close(radii[3][1], 300, "outermost edge");
});

it("Sunburst geometry: sunburstRadii: honors an explicit center radius in both modes", () => {
  assert.deepStrictEqual(sunburstRadii(200, 2, "equal", 40), [
    [0, 40],
    [40, 120],
    [120, 200],
  ]);
  const area = sunburstRadii(200, 2, "area", 0);
  assert.deepStrictEqual(area[0], [0, 0]);
  close(area[1][1] ** 2, 200 ** 2 / 2, "half the disc area");
});

it("Sunburst geometry: sunburstRadii: clamps the center radius and handles no rings", () => {
  assert.deepStrictEqual(sunburstRadii(100, 1, "equal", 500), [
    [0, 100],
    [100, 100],
  ]);
  assert.deepStrictEqual(sunburstRadii(100, 0), [[0, 100]]);
  assert.deepStrictEqual(sunburstRadii(-5, 2), [
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
});

it("Sunburst geometry: sunburstPadAngle: converts a pixel gap through d3's default pad radius", () => {
  const arc = {innerRadius: 30, outerRadius: 40};
  close(sunburstPadAngle(arc, 0, 2) * 50, 2, "linear gap");
});

it("Sunburst geometry: sunburstPadAngle: prefers an explicit pad angle and defaults to none", () => {
  assert.strictEqual(
    sunburstPadAngle({innerRadius: 30, outerRadius: 40}, 0.05, 2),
    0.05,
  );
  assert.strictEqual(
    sunburstPadAngle({innerRadius: 30, outerRadius: 40}, 0, 0),
    0,
  );
  assert.strictEqual(
    sunburstPadAngle({innerRadius: 0, outerRadius: 0}, 0, 2),
    0,
  );
});

it("Sunburst geometry: label rotation: runs radial text outward and never upside down", () => {
  assert.strictEqual(radialRotation(90), 0);
  assert.strictEqual(radialRotation(0), -90);
  assert.strictEqual(radialRotation(180), 90);
  assert.strictEqual(radialRotation(270), 0);
});

it("Sunburst geometry: label rotation: runs tangential text along the arc and never upside down", () => {
  assert.strictEqual(tangentialRotation(0), 0);
  assert.strictEqual(tangentialRotation(45), 45);
  assert.strictEqual(tangentialRotation(180), 0);
  assert.strictEqual(tangentialRotation(300), -60);
  assert.strictEqual(tangentialRotation(270), -90);
});

it("Sunburst geometry: sunburstLabelBox: centers an upright box in the full center disc", () => {
  const box = sunburstLabelBox({
    innerRadius: 0,
    outerRadius: 50,
    startAngle: 0,
    endAngle: TAU,
  });
  assert.strictEqual(box.orientation, "center");
  assert.deepStrictEqual([box.x, box.y, box.rotate], [0, 0, 0]);
  assert.ok(box.width > box.height);
});

it("Sunburst geometry: sunburstLabelBox: reads a wide arc tangentially, centered on its middle radius", () => {
  const box = sunburstLabelBox({
    innerRadius: 100,
    outerRadius: 140,
    startAngle: 0,
    endAngle: Math.PI / 2,
  });
  assert.strictEqual(box.orientation, "tangential");
  close(Math.hypot(box.x, box.y), 120, "middle radius");
  close(box.rotate, 45, "tangent at 45°");
  assert.ok(box.width > box.height);
});

it("Sunburst geometry: sunburstLabelBox: reads a thin sliver radially", () => {
  const box = sunburstLabelBox({
    innerRadius: 150,
    outerRadius: 250,
    startAngle: Math.PI / 2,
    endAngle: Math.PI / 2 + 0.12,
  });
  assert.strictEqual(box.orientation, "radial");
  assert.ok(Math.abs(box.rotate) < 5, "near-horizontal at 3 o'clock");
  assert.ok(box.width > box.height);
});

it("Sunburst geometry: sunburstLabelBox: keeps every box corner inside its arc", () => {
  const arc = {
    innerRadius: 80,
    outerRadius: 120,
    startAngle: 0.3,
    endAngle: 0.9,
  };
  const box = sunburstLabelBox(arc);
  const rad = (box.rotate * Math.PI) / 180;
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const lx = (dx * box.width) / 2,
      ly = (dy * box.height) / 2;
    const x = box.x + lx * Math.cos(rad) - ly * Math.sin(rad);
    const y = box.y + lx * Math.sin(rad) + ly * Math.cos(rad);
    const r = Math.hypot(x, y);
    const a = Math.atan2(x, -y);
    assert.ok(
      r >= arc.innerRadius - 1e-6 && r <= arc.outerRadius + 1e-6,
      `radius ${r}`,
    );
    assert.ok(
      a >= arc.startAngle - 1e-6 && a <= arc.endAngle + 1e-6,
      `angle ${a}`,
    );
  }
});

it("Sunburst geometry: sunburstLabelBox: returns null where no label fits", () => {
  assert.strictEqual(
    sunburstLabelBox({
      innerRadius: 100,
      outerRadius: 104,
      startAngle: 0,
      endAngle: 0.02,
    }),
    null,
  );
  assert.strictEqual(
    sunburstLabelBox({
      innerRadius: 100,
      outerRadius: 140,
      startAngle: 1,
      endAngle: 1,
    }),
    null,
  );
  assert.strictEqual(
    sunburstLabelBox({
      innerRadius: 0,
      outerRadius: 5,
      startAngle: 0,
      endAngle: TAU,
    }),
    null,
  );
});

it("Sunburst geometry: sunburstLabelBox: raises the bar with fontMin", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 130,
    startAngle: 0,
    endAngle: 0.4,
  };
  assert.ok(sunburstLabelBox(arc, {fontMin: 6}));
  assert.strictEqual(sunburstLabelBox(arc, {fontMin: 40}), null);
});

const radii = [
  [0, 50],
  [50, 100],
  [100, 150],
];
const focus = {startAngle: 1, endAngle: 2, depth: 1};

it("Sunburst geometry: sunburstCollapse: folds arcs before and after the focus range to 0 and 2π", () => {
  const before = sunburstCollapse(
    {startAngle: 0, endAngle: 0.5},
    1,
    focus,
    radii,
  );
  assert.deepStrictEqual([before.startAngle, before.endAngle], [0, 0]);
  const after = sunburstCollapse(
    {startAngle: 2.5, endAngle: 3},
    2,
    focus,
    radii,
  );
  assert.deepStrictEqual([after.startAngle, after.endAngle], [TAU, TAU]);
});

it("Sunburst geometry: sunburstCollapse: moves each ring inward by the focus depth", () => {
  assert.deepStrictEqual(
    [
      sunburstCollapse({startAngle: 0, endAngle: 0.5}, 1, focus, radii)
        .innerRadius,
      sunburstCollapse({startAngle: 0, endAngle: 0.5}, 2, focus, radii)
        .innerRadius,
    ],
    [0, 50],
  );
  const inner = sunburstCollapse(
    {startAngle: 0, endAngle: 0.5},
    0,
    focus,
    radii,
  );
  assert.deepStrictEqual([inner.innerRadius, inner.outerRadius], [0, 0]);
  const outside = sunburstCollapse(
    {startAngle: 0, endAngle: 0.5},
    9,
    focus,
    radii,
  );
  assert.deepStrictEqual(
    [outside.innerRadius, outside.outerRadius],
    [150, 150],
  );
});

it("Sunburst geometry: sunburstCollapse: maps an angle inside the focus proportionally", () => {
  const mid = sunburstCollapse(
    {startAngle: 1.25, endAngle: 1.5},
    2,
    focus,
    radii,
  );
  close(mid.startAngle, TAU / 4, "quarter");
  close(mid.endAngle, TAU / 2, "half");
});
