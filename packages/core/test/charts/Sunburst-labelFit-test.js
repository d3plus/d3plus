import assert from "assert";
import {
  boxInArc,
  fitRotation,
  labelRotations,
  maxBoxWidth,
  sunburstLabelBox,
  wrapLineCount,
} from "../../es/src/charts/Sunburst/labelFit.js";

const TAU = Math.PI * 2;
const deg = d => (d * Math.PI) / 180;
// Every character 0.6em wide, so a word's width at 1px is 0.6 × its length.
const metrics = text => ({
  words: text.split(" ").map(w => w.length * 0.6),
  space: 0.3,
});

it("Sunburst labelFit: boxInArc keeps a box inside the outer and inner radius and the span", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 200,
    startAngle: deg(60),
    endAngle: deg(120),
  };
  const at = (a, r) => [r * Math.sin(deg(a)), -r * Math.cos(deg(a))];
  const [x, y] = at(90, 150);
  assert.ok(boxInArc(arc, {x, y, width: 60, height: 20, rotate: 0}));
  assert.ok(
    !boxInArc(arc, {x, y, width: 120, height: 20, rotate: 0}),
    "pokes past the outer or inner radius",
  );
  assert.ok(
    !boxInArc(arc, {x, y, width: 20, height: 200, rotate: 0}),
    "pokes past the span",
  );
  const [ix, iy] = at(90, 105);
  assert.ok(
    !boxInArc(arc, {x: ix, y: iy, width: 20, height: 20, rotate: 0}),
    "dips under the inner radius",
  );
});

it("Sunburst labelFit: boxInArc samples the edges of a span wider than a half turn", () => {
  const arc = {
    innerRadius: 0,
    outerRadius: 200,
    startAngle: deg(10),
    endAngle: deg(350),
  };
  // A box straddling 12 o'clock crosses the 20° gap even with its corners clear of it.
  assert.ok(!boxInArc(arc, {x: 0, y: -100, width: 60, height: 40, rotate: 0}));
  assert.ok(boxInArc(arc, {x: 0, y: 100, width: 60, height: 40, rotate: 0}));
  assert.ok(
    boxInArc(
      {innerRadius: 0, outerRadius: 50, startAngle: 0, endAngle: TAU},
      {x: 0, y: 0, width: 60, height: 20, rotate: 0},
    ),
  );
});

it("Sunburst labelFit: maxBoxWidth finds the widest fitting box, or 0", () => {
  const disc = {innerRadius: 0, outerRadius: 50, startAngle: 0, endAngle: TAU};
  const w = maxBoxWidth(disc, 0, 0, 0, 60);
  assert.ok(
    Math.abs(w - 80) < 0.01,
    `a 60px-tall box in a 50px disc is 80px wide: ${w}`,
  );
  assert.strictEqual(maxBoxWidth(disc, 0, 0, 0, 120), 0);
});

it("Sunburst labelFit: wrapLineCount wraps between words and rejects a word wider than the line", () => {
  const m = metrics("aaaa bbbb cccc");
  assert.strictEqual(wrapLineCount(m, 10, 200), 1);
  assert.strictEqual(wrapLineCount(m, 10, 60), 2);
  assert.strictEqual(wrapLineCount(m, 10, 24), 3);
  assert.strictEqual(wrapLineCount(m, 10, 20), Infinity);
});

it("Sunburst labelFit: fitRotation returns the largest whole font size that fits", () => {
  const disc = {innerRadius: 0, outerRadius: 60, startAngle: 0, endAngle: TAU};
  const fit = fitRotation(disc, [0, 0], 0, metrics("Backend"), {fontMax: 40});
  assert.ok(fit.fontSize > 8 && fit.fontSize < 40, `${fit.fontSize}`);
  const bigger = fitRotation(disc, [0, 0], 0, metrics("Backend"), {
    fontMax: 40,
    fontMin: fit.fontSize + 1,
  });
  assert.strictEqual(bigger, null, "one size up doesn't fit");
  assert.ok(fit.width > 0 && fit.height > 0);
  assert.strictEqual(
    fitRotation(disc, [0, 0], 0, metrics("Supercalifragilisticexpialidocious")),
    null,
  );
});

it("Sunburst labelFit: sunburstLabelBox centers an upright label in the center disc", () => {
  const box = sunburstLabelBox(
    {innerRadius: 0, outerRadius: 60, startAngle: 0, endAngle: TAU},
    metrics("Backend"),
  );
  assert.deepStrictEqual(
    [box.orientation, box.x, box.y, box.rotate],
    ["center", 0, 0, 0],
  );
});

it("Sunburst labelFit: labelRotations gives exactly two rotations, 90° apart, never upside down", () => {
  for (let a = 0; a < 360; a += 7.5) {
    const {tangential, radial} = labelRotations(a);
    assert.ok(
      tangential >= -90 && tangential <= 90 && radial >= -90 && radial <= 90,
      `${a}°`,
    );
    assert.strictEqual(
      Math.abs(tangential - radial),
      90,
      `${a}°: ${tangential} vs ${radial}`,
    );
  }
  assert.deepStrictEqual(labelRotations(45), {tangential: 45, radial: -45});
  assert.deepStrictEqual(labelRotations(180), {tangential: 0, radial: 90});
});

it("Sunburst labelFit: sunburstLabelBox reads along a wide arc", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 140,
    startAngle: deg(20),
    endAngle: deg(70),
  };
  const box = sunburstLabelBox(arc, metrics("Orders"));
  assert.strictEqual(box.orientation, "tangential");
  assert.strictEqual(box.rotate, 45);
  const along = fitRotation(arc, [box.x, box.y], 45, metrics("Orders"));
  const across = fitRotation(arc, [box.x, box.y], -45, metrics("Orders"));
  assert.ok(
    along.fontSize >= (across ? across.fontSize : 0),
    "the larger fit wins",
  );
});

it("Sunburst labelFit: sunburstLabelBox turns a label radial on a thin sliver", () => {
  const arc = {
    innerRadius: 150,
    outerRadius: 250,
    startAngle: deg(42),
    endAngle: deg(48),
  };
  const box = sunburstLabelBox(arc, metrics("Migrations"));
  assert.strictEqual(box.orientation, "radial");
  assert.strictEqual(box.rotate, -45);
});

it("Sunburst labelFit: sunburstLabelBox keeps the chosen box inside its arc", () => {
  const arc = {
    innerRadius: 80,
    outerRadius: 120,
    startAngle: 0.3,
    endAngle: 0.9,
  };
  const box = sunburstLabelBox(arc, metrics("Users"));
  assert.ok(boxInArc(arc, box));
  assert.ok(box.fontSize >= 8 && box.fontSize <= 24);
});

it("Sunburst labelFit: sunburstLabelBox skips a label whose word fits nowhere", () => {
  const arc = {
    innerRadius: 100,
    outerRadius: 130,
    startAngle: 0,
    endAngle: 0.3,
  };
  assert.strictEqual(sunburstLabelBox(arc, metrics("Containerization")), null);
  assert.strictEqual(sunburstLabelBox(arc, {words: [], space: 0}), null);
  assert.strictEqual(
    sunburstLabelBox({...arc, endAngle: 0}, metrics("a")),
    null,
  );
});
