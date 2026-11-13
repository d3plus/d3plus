import {it} from "vitest";
import assert from "assert";
import {
  keyTooltipAnchor,
  keyTooltipBox,
  keyTooltipPlacement,
} from "../../src/charts/features/keyTooltip.ts";
import {tooltipPlacement} from "../../src/components/tooltipDom.ts";

/**
    A colorScale swatch's tooltip opens beside the key, on the side away
    from it, pointing at the hovered swatch.
*/

const surface = {width: 600, height: 400};
const box = (x, y, width, height) => ({x, y, width, height});

it("keyTooltipPlacement — beside a side key, toward the chart's middle", () => {
  assert.strictEqual(
    keyTooltipPlacement(box(540, 100, 40, 200), surface, true),
    "left",
  );
  assert.strictEqual(
    keyTooltipPlacement(box(10, 100, 40, 200), surface, true),
    "right",
  );
});

it("keyTooltipPlacement — below a top key, above a bottom one", () => {
  assert.strictEqual(
    keyTooltipPlacement(box(200, 10, 200, 30), surface, false),
    "bottom",
  );
  assert.strictEqual(
    keyTooltipPlacement(box(200, 360, 200, 30), surface, false),
    "top",
  );
});

it("keyTooltipBox — the key across the side, the entry along it", () => {
  const key = box(500, 100, 60, 200);
  const entry = box(510, 140, 20, 20);
  assert.deepStrictEqual(
    keyTooltipBox(key, entry, "left"),
    box(500, 140, 60, 20),
  );
  assert.deepStrictEqual(
    keyTooltipBox(key, entry, "right"),
    box(500, 140, 60, 20),
  );
  const row = box(100, 350, 300, 30);
  const cell = box(150, 355, 40, 10);
  assert.deepStrictEqual(
    keyTooltipBox(row, cell, "top"),
    box(150, 350, 40, 30),
  );
  assert.deepStrictEqual(
    keyTooltipBox(row, cell, "bottom"),
    box(150, 350, 40, 30),
  );
});

const bucket = color => ({color, id: color, _isColorScaleBucket: true});

/** A right-hand key of two swatches at (520, 100), and a chart shape. */
const fakeViz = orient => {
  const a = {
    type: "rect",
    key: "a",
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    datum: bucket("#a"),
  };
  const b = {
    type: "rect",
    key: "b",
    x: 0,
    y: 30,
    width: 20,
    height: 10,
    datum: bucket("#b"),
  };
  const hit = {
    type: "rect",
    key: "b::hit",
    x: 0,
    y: 30,
    width: 60,
    height: 10,
    datum: {__d3plus__: true, data: bucket("#b")},
  };
  const shape = {
    type: "rect",
    key: "s",
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    datum: {id: "s"},
  };
  return {
    nodes: {a, b, hit, shape},
    viz: {
      _colorScaleClass: {schema: {orient}},
      _paintedScene: {
        width: 600,
        height: 400,
        root: {
          type: "group",
          key: "root",
          children: [
            shape,
            {
              type: "group",
              key: "cs",
              transform: {x: 520, y: 100},
              children: [a, b, hit],
            },
          ],
        },
      },
    },
  };
};

it("keyTooltipAnchor — a swatch's tooltip opens left of a right-hand key", () => {
  const {viz, nodes} = fakeViz("right");
  const anchor = keyTooltipAnchor(viz, nodes.b);
  assert.strictEqual(anchor.placement, "left");
  const r = anchor.getBoundingClientRect();
  assert.deepStrictEqual(
    [r.left, r.right, r.top, r.bottom],
    [520, 580, 130, 140],
    "the key's width (with the hit area), the swatch's height",
  );
});

it("keyTooltipAnchor — matches a repainted node by key", () => {
  const {viz, nodes} = fakeViz("right");
  const anchor = keyTooltipAnchor(viz, {...nodes.a});
  assert.deepStrictEqual(
    [anchor.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom],
    [100, 110],
  );
});

it("keyTooltipAnchor — a key along the bottom opens above", () => {
  const {viz, nodes} = fakeViz("bottom");
  viz._paintedScene.root.children[1].transform = {x: 200, y: 350};
  const anchor = keyTooltipAnchor(viz, nodes.a);
  assert.strictEqual(anchor.placement, "top");
  const r = anchor.getBoundingClientRect();
  assert.deepStrictEqual(
    [r.left, r.right, r.top, r.bottom],
    [200, 220, 350, 390],
  );
});

it("keyTooltipAnchor — undefined for a chart shape, or without a scene", () => {
  const {viz, nodes} = fakeViz("right");
  assert.strictEqual(keyTooltipAnchor(viz, nodes.shape), undefined);
  assert.strictEqual(keyTooltipAnchor(viz, undefined), undefined);
  assert.strictEqual(
    keyTooltipAnchor({_paintedScene: undefined}, nodes.a),
    undefined,
  );
});

it("tooltipPlacement — an anchor's own side, else above", () => {
  const rect = () => ({});
  assert.strictEqual(
    tooltipPlacement({getBoundingClientRect: rect, placement: "left"}),
    "left",
  );
  assert.strictEqual(tooltipPlacement({getBoundingClientRect: rect}), "top");
  assert.strictEqual(
    tooltipPlacement({getBoundingClientRect: rect, placement: "middle"}),
    "top",
  );
});
