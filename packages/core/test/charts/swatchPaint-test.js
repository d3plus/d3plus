import {it} from "vitest";
import assert from "assert";
import {
  markSwatch,
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
});

it("swatchColor — a texture shows its background", () => {
  assert.strictEqual(swatchColor("#abc"), "#abc");
  assert.strictEqual(swatchColor(pattern("#123456")), "#123456");
  assert.strictEqual(swatchColor(pattern("none")), undefined);
  assert.strictEqual(swatchColor("pattern:{oops"), undefined, "a bad token");
  assert.strictEqual(swatchColor("none"), undefined);
  assert.strictEqual(swatchColor(undefined), undefined);
});

it("swatchOutline — the mark's stroke at its width", () => {
  assert.deepStrictEqual(swatchOutline({stroke: "red", strokeWidth: 1.5}), {
    stroke: "red",
    strokeWidth: 1.5,
  });
  assert.deepStrictEqual(
    swatchOutline({stroke: "red", strokeWidth: "2"}),
    {stroke: "red", strokeWidth: 2},
    "a numeric string width",
  );
});

it("swatchOutline — at most a fifth of the swatch", () => {
  assert.deepStrictEqual(
    swatchOutline({stroke: "red", strokeWidth: 8}, {size: 10}),
    {stroke: "red", strokeWidth: 2},
  );
  assert.deepStrictEqual(
    swatchOutline({stroke: "red", strokeWidth: 1}, {size: 10}),
    {stroke: "red", strokeWidth: 1},
    "a thinner stroke keeps its width",
  );
  assert.strictEqual(
    swatchOutline({stroke: "red", strokeWidth: 8}, {size: 12}).strokeWidth,
    2.4,
  );
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
    {stroke: "#222", strokeWidth: 2},
  );
});

it("markSwatch — a fill outlined by its stroke", () => {
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "navy", strokeWidth: 1}, "Path"),
    {color: "blue", outline: {stroke: "navy", strokeWidth: 1}},
  );
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "navy", strokeWidth: 0}, "Rect"),
    {color: "blue"},
    "no outline without a stroke width",
  );
  assert.deepStrictEqual(
    markSwatch(
      {fill: pattern("#123456"), stroke: "navy", strokeWidth: 1},
      "Rect",
    ),
    {color: "#123456", outline: {stroke: "navy", strokeWidth: 1}},
    "a texture's background",
  );
  assert.deepStrictEqual(
    markSwatch({fill: "blue", stroke: "navy", strokeWidth: 9}, "Circle", {
      size: 10,
    }),
    {color: "blue", outline: {stroke: "navy", strokeWidth: 2}},
  );
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
