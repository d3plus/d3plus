import {it} from "vitest";
import assert from "assert";
import {
  isTexture,
  markSwatch,
  SWATCH_OUTLINE,
  swatchColor,
  swatchOutline,
  visibleColor,
} from "../../src/charts/features/swatchPaint.ts";

const pattern = background =>
  `pattern:${JSON.stringify({texture: "lines", background, stroke: "#000"})}`;

it("visibleColor — a color that shows", () => {
  assert.strictEqual(visibleColor("red"), "red");
  for (const c of ["none", "transparent", undefined, null, 3])
    assert.strictEqual(visibleColor(c), undefined, `${c}`);
  assert.strictEqual(
    visibleColor('gradient:{"type":"linear"}'),
    undefined,
    "a gradient is no one color",
  );
});

it("swatchColor — a texture shows its background", () => {
  assert.strictEqual(swatchColor("#abc"), "#abc");
  assert.strictEqual(swatchColor(pattern("#123456")), "#123456");
  assert.strictEqual(swatchColor(pattern("none")), undefined);
  assert.strictEqual(swatchColor("pattern:{oops"), undefined, "a bad token");
  assert.strictEqual(swatchColor("none"), undefined);
  assert.strictEqual(swatchColor(undefined), undefined);
});

it("swatchOutline — 1px of the mark's stroke, whatever its width", () => {
  for (const strokeWidth of [0.5, 1, 1.5, 2, "3", 8])
    assert.deepStrictEqual(
      swatchOutline({stroke: "red", strokeWidth}),
      {stroke: "red", strokeWidth: 1},
      `${strokeWidth}`,
    );
  assert.strictEqual(SWATCH_OUTLINE, 1);
});

it("swatchOutline — none for a stroke that doesn't show", () => {
  for (const paint of [
    {stroke: "red"},
    {stroke: "red", strokeWidth: 0},
    {stroke: "red", strokeWidth: -1},
    {stroke: "red", strokeWidth: NaN},
    {stroke: "none", strokeWidth: 1},
    {stroke: "transparent", strokeWidth: 1},
    {strokeWidth: 1},
    {stroke: "red", strokeWidth: 1, strokeOpacity: 0},
  ])
    assert.strictEqual(swatchOutline(paint), undefined, JSON.stringify(paint));
});

it("swatchOutline — none for a stroke in the chart's background", () => {
  for (const stroke of ["#ffffff", "white", "rgb(255, 255, 255)"])
    assert.strictEqual(
      swatchOutline({stroke, strokeWidth: 2}, {background: "#fff"}),
      undefined,
      stroke,
    );
  assert.deepStrictEqual(
    swatchOutline({stroke: "#222", strokeWidth: 2}, {background: "#fff"}),
    {stroke: "#222", strokeWidth: 1},
  );
});

it("markSwatch — a fill outlined by its stroke", () => {
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "navy", strokeWidth: 3}, "Path"),
    {color: "blue", outline: {stroke: "navy", strokeWidth: 1}},
  );
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "navy", strokeWidth: 0}, "Rect"),
    {color: "blue"},
    "no outline without a stroke width",
  );
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "#fff", strokeWidth: 2}, "Circle", {
      background: "white",
    }),
    {color: "blue"},
    "no outline in the chart's background",
  );
});

it("markSwatch — a texture over its background", () => {
  const token = pattern("#123456");
  assert.deepStrictEqual(
    markSwatch({fill: token, stroke: "navy", strokeWidth: 1}, "Rect"),
    {
      color: "#123456",
      texture: token,
      outline: {stroke: "navy", strokeWidth: 1},
    },
  );
  assert.deepStrictEqual(
    markSwatch({fill: token}, "Circle"),
    {color: "#123456", texture: token},
    "without a stroke",
  );
});

it("isTexture — a pattern token", () => {
  assert.ok(isTexture(pattern("#fff")));
  for (const fill of ["#fff", "none", undefined, 3])
    assert.ok(!isTexture(fill), `${fill}`);
});

it("markSwatch — a Line is its stroke, with no outline", () => {
  assert.deepStrictEqual(
    markSwatch({fill: "none", stroke: "red", strokeWidth: 3}, "Line"),
    {color: "red"},
  );
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "transparent"}, "Line"),
    {color: "blue"},
    "a Line without a stroke falls back to its fill",
  );
});

it("markSwatch — an unfilled mark is its stroke", () => {
  assert.deepStrictEqual(
    markSwatch({fill: "none", stroke: "black", strokeWidth: 1}, "Rect"),
    {color: "black"},
  );
  assert.deepStrictEqual(markSwatch(undefined, "Rect"), {}, "no paint");
});
