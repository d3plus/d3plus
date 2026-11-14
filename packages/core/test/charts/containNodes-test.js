import assert from "node:assert";
import {it} from "vitest";

import {containNodes} from "../../internal.ts";

/**
    `containNodes` moves a network's nodes in so each node's reach (its box
    and loops) stays inside the chart, without resizing any of them.
*/

const node = (x, y, w, h = w) => ({
  x,
  y,
  left: w,
  right: w,
  top: h,
  bottom: h,
});

/** The nodes' reach after `move`, as [x0, x1, y0, y1]. */
const extentAfter = (nodes, {scale, dx, dy}) => [
  Math.min(...nodes.map(n => n.x * scale + dx - n.left)),
  Math.max(...nodes.map(n => n.x * scale + dx + n.right)),
  Math.min(...nodes.map(n => n.y * scale + dy - n.top)),
  Math.max(...nodes.map(n => n.y * scale + dy + n.bottom)),
];

it("containNodes leaves nodes that fit where they are", () => {
  assert.deepStrictEqual(
    containNodes([node(50, 50, 10), node(150, 80, 20)], 200, 100),
    {scale: 1, dx: 0, dy: 0},
  );
  assert.deepStrictEqual(containNodes([], 200, 100), {
    scale: 1,
    dx: 0,
    dy: 0,
  });
});

it("containNodes shifts nodes that fit side to side but sit past an edge", () => {
  const nodes = [node(5, 50, 10), node(100, 50, 10)];
  const move = containNodes(nodes, 200, 100);
  assert.strictEqual(move.scale, 1);
  assert.strictEqual(move.dx, 5, "only as far as needed");
  assert.strictEqual(move.dy, 0);
});

it("containNodes pulls wide boxes in until every one fits", () => {
  const nodes = [node(20, 50, 70, 15), node(280, 50, 70, 15)];
  const move = containNodes(nodes, 300, 200, 3);
  assert.ok(move.scale < 1);
  const [x0, x1, y0, y1] = extentAfter(nodes, move);
  assert.ok(
    Math.abs(x0 - 3) < 1e-6 && Math.abs(x1 - 297) < 1e-6,
    `${x0}–${x1}`,
  );
  assert.ok(y0 >= 3 && y1 <= 197);
});

it("containNodes reads each side's own reach (a loop on one side)", () => {
  const nodes = [{x: 150, y: 100, left: 10, right: 160, top: 10, bottom: 10}];
  const move = containNodes(nodes, 300, 200);
  const [x0, x1] = extentAfter(nodes, move);
  assert.ok(x0 >= 0 && x1 <= 300, `${x0}–${x1}`);
});

it("containNodes centers what can't fit at all", () => {
  const nodes = [node(0, 0, 400), node(10, 10, 400)];
  const move = containNodes(nodes, 300, 200);
  assert.strictEqual(move.scale, 0);
  assert.strictEqual(move.dx, 150);
  assert.strictEqual(move.dy, 100);
});
