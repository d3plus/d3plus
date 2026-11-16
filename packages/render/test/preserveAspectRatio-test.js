import {it} from "vitest";
import assert from "assert";

import {imageFit, parsePreserveAspectRatio} from "../index.ts";

const DEFAULT = {align: {x: "mid", y: "mid"}, meetOrSlice: "meet"};
const NONE = {align: "none", meetOrSlice: "meet"};
const AXES = {Min: "min", Mid: "mid", Max: "max"};

it("parsePreserveAspectRatio: an omitted or empty value is xMidYMid meet", () => {
  for (const value of [undefined, null, "", "   "])
    assert.deepStrictEqual(
      parsePreserveAspectRatio(value),
      DEFAULT,
      JSON.stringify(value),
    );
});

it("parsePreserveAspectRatio: reads every alignment, alone and with meet or slice", () => {
  for (const [X, x] of Object.entries(AXES))
    for (const [Y, y] of Object.entries(AXES)) {
      const align = `x${X}Y${Y}`;
      assert.deepStrictEqual(
        parsePreserveAspectRatio(align),
        {align: {x, y}, meetOrSlice: "meet"},
        `${align} implies meet`,
      );
      assert.deepStrictEqual(parsePreserveAspectRatio(`${align} meet`), {
        align: {x, y},
        meetOrSlice: "meet",
      });
      assert.deepStrictEqual(parsePreserveAspectRatio(`${align} slice`), {
        align: {x, y},
        meetOrSlice: "slice",
      });
    }
});

it("parsePreserveAspectRatio: none stretches, and ignores meet or slice", () => {
  assert.deepStrictEqual(parsePreserveAspectRatio("none"), NONE);
  assert.deepStrictEqual(parsePreserveAspectRatio("none meet"), NONE);
  assert.deepStrictEqual(parsePreserveAspectRatio("none slice"), NONE);
});

it("parsePreserveAspectRatio: allows SVG whitespace around the keywords", () => {
  assert.deepStrictEqual(parsePreserveAspectRatio("  xMidYMax   meet  "), {
    align: {x: "mid", y: "max"},
    meetOrSlice: "meet",
  });
  assert.deepStrictEqual(parsePreserveAspectRatio("\n\fxMaxYMin\tslice\r"), {
    align: {x: "max", y: "min"},
    meetOrSlice: "slice",
  });
  // Chromium reads the keywords back to back, without a separator.
  assert.deepStrictEqual(parsePreserveAspectRatio("xMinYMinslice"), {
    align: {x: "min", y: "min"},
    meetOrSlice: "slice",
  });
});

it("parsePreserveAspectRatio: an invalid value is xMidYMid meet, as in Chromium", () => {
  for (const value of [
    "defer",
    "defer none",
    "defer xMinYMid slice",
    "defer  xMaxYMid",
    "deferxMinYMin",
    "XMINYMIN",
    "xminymin",
    "xMinYMin Slice",
    "xMinYMin foo",
    "xMinYMin meet slice",
    "xMinYMax,slice",
    "xMidYMid slice",
    "slice",
    "meet",
    "foo",
  ])
    assert.deepStrictEqual(
      parsePreserveAspectRatio(value),
      DEFAULT,
      JSON.stringify(value),
    );
});

const box = {x: 10, y: 20, width: 100, height: 100};
const wide = {width: 40, height: 20};
const tall = {width: 20, height: 40};
const SHARE = {min: 0, mid: 0.5, max: 1};

it("imageFit: none stretches the whole image over the box", () => {
  assert.deepStrictEqual(imageFit(box, wide, NONE), {
    source: {x: 0, y: 0, width: 40, height: 20},
    dest: box,
  });
});

it("imageFit: meet fits the whole image inside the box, at every alignment", () => {
  for (const x of ["min", "mid", "max"])
    for (const y of ["min", "mid", "max"]) {
      const par = {align: {x, y}, meetOrSlice: "meet"};
      assert.deepStrictEqual(
        imageFit(box, wide, par),
        {
          source: {x: 0, y: 0, width: 40, height: 20},
          dest: {x: 10, y: 20 + 50 * SHARE[y], width: 100, height: 50},
        },
        `wide ${x}/${y}: letterboxed above and below, per y`,
      );
      assert.deepStrictEqual(
        imageFit(box, tall, par),
        {
          source: {x: 0, y: 0, width: 20, height: 40},
          dest: {x: 10 + 50 * SHARE[x], y: 20, width: 50, height: 100},
        },
        `tall ${x}/${y}: pillarboxed left and right, per x`,
      );
    }
});

it("imageFit: slice covers the box and crops per the alignment", () => {
  for (const x of ["min", "mid", "max"])
    for (const y of ["min", "mid", "max"]) {
      const par = {align: {x, y}, meetOrSlice: "slice"};
      assert.deepStrictEqual(
        imageFit(box, wide, par),
        {
          source: {x: 20 * SHARE[x], y: 0, width: 20, height: 20},
          dest: box,
        },
        `wide ${x}/${y}: crops the sides, per x`,
      );
      assert.deepStrictEqual(
        imageFit(box, tall, par),
        {
          source: {x: 0, y: 20 * SHARE[y], width: 20, height: 20},
          dest: box,
        },
        `tall ${x}/${y}: crops top and bottom, per y`,
      );
    }
});

it("imageFit: an image shaped like its box is neither letterboxed nor cropped", () => {
  const square = {width: 25, height: 25};
  for (const meetOrSlice of ["meet", "slice"])
    assert.deepStrictEqual(
      imageFit(box, square, {align: {x: "max", y: "min"}, meetOrSlice}),
      {source: {x: 0, y: 0, width: 25, height: 25}, dest: box},
      meetOrSlice,
    );
});

it("imageFit: an image with no natural size stretches", () => {
  for (const natural of [
    {width: 0, height: 0},
    {width: 40, height: 0},
    {width: NaN, height: 20},
  ])
    assert.deepStrictEqual(
      imageFit(box, natural, DEFAULT).dest,
      box,
      JSON.stringify(natural),
    );
});

it("imageFit: parses into the fit an omitted, align-only and invalid value alike", () => {
  const meet = imageFit(box, wide, DEFAULT);
  for (const value of [undefined, "xMidYMid", "defer xMinYMin slice"])
    assert.deepStrictEqual(
      imageFit(box, wide, parsePreserveAspectRatio(value)),
      meet,
      String(value),
    );
});
