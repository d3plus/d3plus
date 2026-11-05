import {it} from "vitest";
import assert from "assert";

import {interpolateScene, transitionOrder} from "../index.ts";

/**
    Mid-transition paint order on the Canvas backend: siblings paint in the
    target scene's order, so a node entering beneath existing ones (a theme's
    background) stays beneath them, and an exiting node keeps its place.
*/

const rect = (key, fill = "#000") => ({
  type: "rect",
  key,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  paint: {fill},
});
const keys = list => list.map(n => n.key);
const scene = children => ({
  width: 10,
  height: 10,
  root: {type: "group", key: "root", children},
});

it("transitionOrder keeps the target's order, entering nodes included", () => {
  const prev = [rect("a"), rect("b")];
  const next = [rect("bg"), rect("a"), rect("c"), rect("b")];
  assert.deepStrictEqual(keys(transitionOrder(prev, next)), [
    "bg",
    "a",
    "c",
    "b",
  ]);
});

it("transitionOrder puts each exiting node after the sibling it followed", () => {
  const prev = [rect("x"), rect("a"), rect("y"), rect("z"), rect("b")];
  const next = [rect("b"), rect("a"), rect("c")];
  assert.deepStrictEqual(keys(transitionOrder(prev, next)), [
    // `x` led the list, so it stays first.
    "x",
    "b",
    "a",
    // `y` and `z` followed `a`.
    "y",
    "z",
    "c",
  ]);
  assert.deepStrictEqual(keys(transitionOrder([], [rect("a")])), ["a"]);
  assert.deepStrictEqual(keys(transitionOrder([rect("a")], [])), ["a"]);
});

it("interpolateScene paints an entering background beneath the marks, at every t", () => {
  const prev = scene([rect("mark", "#c00")]);
  const next = scene([rect("bg", "#111"), rect("mark", "#c00")]);
  const interp = interpolateScene(prev, next);
  for (const t of [0, 0.5, 1])
    assert.deepStrictEqual(
      keys(interp(t).root.children),
      ["bg", "mark"],
      `t=${t}`,
    );
});

it("interpolateScene keeps an exiting node in place, and drops it at t=1", () => {
  const prev = scene([rect("a"), rect("gone"), rect("b")]);
  const next = scene([rect("a"), rect("b")]);
  const interp = interpolateScene(prev, next);
  assert.deepStrictEqual(keys(interp(0.5).root.children), ["a", "gone", "b"]);
  assert.deepStrictEqual(keys(interp(1).root.children), ["a", "b"]);
});
