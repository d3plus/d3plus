import {it} from "vitest";
import assert from "assert";
import {drawText} from "../src/canvas/canvasDraw.ts";

/** A 2D context stand-in that records each fillText with its alignment; every character is 10px wide. */
function recorder() {
  const calls = [];
  return {
    calls,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    direction: "inherit",
    globalAlpha: 1,
    fillStyle: "",
    measureText: text => ({width: text.length * 10}),
    fillText(text, x, y) {
      calls.push({text, x, y, align: this.textAlign, dir: this.direction});
    },
  };
}

const node = (font, lines) => ({
  type: "text",
  key: "t",
  x: 0,
  y: 0,
  font: {size: 10, ...font},
  paint: {fill: "#000"},
  lines,
});

it("drawText — right-to-left start text is right-aligned at its x", () => {
  const ctx = recorder();
  drawText(
    ctx,
    node({anchor: "start", dir: "rtl"}, [
      {text: "abc", x: 100, y: 10, width: 30},
    ]),
    1,
  );
  assert.deepStrictEqual(ctx.calls, [
    {text: "abc", x: 100, y: 10, align: "right", dir: "rtl"},
  ]);
  assert.strictEqual(ctx.direction, "inherit", "restores the direction");
});

it("drawText — positioned runs paint at their own x", () => {
  const ctx = recorder();
  drawText(
    ctx,
    node({anchor: "start"}, [
      {
        text: "ab cd",
        x: 0,
        y: 10,
        width: 100,
        runs: [
          {text: "ab ", x: 0},
          {text: "c", x: 80, style: {weight: 700}},
          {text: "d"},
        ],
      },
    ]),
    1,
  );
  assert.deepStrictEqual(
    ctx.calls.map(c => [c.text, c.x, c.align]),
    [
      ["ab ", 0, "left"],
      ["c", 80, "left"],
      ["d", 90, "left"],
    ],
  );
});

it("drawText — right-to-left runs flow leftward from their x", () => {
  const ctx = recorder();
  drawText(
    ctx,
    node({anchor: "start", dir: "rtl"}, [
      {
        text: "ab cd",
        x: 100,
        y: 10,
        width: 100,
        runs: [{text: "ab ", x: 100}, {text: "c", x: 20}, {text: "d"}],
      },
    ]),
    1,
  );
  assert.deepStrictEqual(
    ctx.calls.map(c => [c.text, c.x, c.align]),
    [
      ["ab ", 100, "right"],
      ["c", 20, "right"],
      ["d", 10, "right"],
    ],
  );
});

it("drawText — unpositioned runs start at the line's left edge", () => {
  // A middle-anchored styled line centers as a whole.
  const ctx = recorder();
  drawText(
    ctx,
    node({anchor: "middle"}, [
      {
        text: "abcd",
        x: 100,
        y: 10,
        width: 40,
        runs: [{text: "ab"}, {text: "cd", style: {weight: 700}}],
      },
    ]),
    1,
  );
  assert.deepStrictEqual(
    ctx.calls.map(c => [c.text, c.x, c.align]),
    [
      ["ab", 80, "left"],
      ["cd", 100, "left"],
    ],
  );
});
