import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {cubicInOut} from "@d3plus/render";
import {levelWindow, showsBars, stackEnterWindows, stackLevels} from "../../src/charts/Plot/stackEnter.ts";

useJsdom();

/**
    A d3-stack result for `rows` ({id, discrete, y}): one series per id, in
    `order` (bottom of the stack first), stacked diverging from zero.
*/
const stackOf = (rows, order) => {
  const ids = Array.from(new Set(rows.map(r => r.id)));
  const discretes = Array.from(new Set(rows.map(r => r.discrete)));
  const stackData = ids.map(id => Object.assign([], {key: id, index: order.indexOf(id)}));
  discretes.forEach((discrete, j) => {
    let up = 0, down = 0;
    for (const id of order) {
      const row = rows.find(r => r.id === id && r.discrete === discrete);
      const v = row ? row.y : 0;
      stackData[ids.indexOf(id)][j] = v < 0 ? [down + v, (down += v) - v] : [up, (up += v)];
    }
  });
  return {
    opp: "y",
    stackData,
    stackKeyIndex: new Map(ids.map((id, i) => [id, i])),
    discreteKeyIndex: new Map(discretes.map((d, j) => [d, j])),
  };
};

const rowsOf = list => list.map(([id, discrete, y]) => ({id, discrete, y, data: {id}}));
const levelsOf = (rows, order) => {
  const {levels, depth} = stackLevels(rows, stackOf(rows, order));
  return {depth, levels: Object.fromEntries(rows.map(r => [`${r.id}${r.discrete}`, levels.get(r)]))};
};

it("stackLevels numbers each segment up its stack, in stack order", () => {
  const rows = rowsOf([["a", 1, 5], ["b", 1, 3], ["c", 1, 2], ["a", 2, 4], ["b", 2, 6]]);
  assert.deepStrictEqual(levelsOf(rows, ["b", "a", "c"]), {
    depth: 3,
    levels: {a1: 1, b1: 0, c1: 2, a2: 1, b2: 0},
  });
});

it("stackLevels counts a diverging stack outward from zero on each side", () => {
  const rows = rowsOf([["a", 1, 5], ["b", 1, -3], ["c", 1, 2], ["d", 1, -1]]);
  assert.deepStrictEqual(levelsOf(rows, ["a", "b", "c", "d"]), {
    depth: 2,
    levels: {a1: 0, b1: 0, c1: 1, d1: 1},
  });
});

it("stackLevels starts each group's stack at a position from the bottom", () => {
  const rows = rowsOf([["a", 1, 5], ["b", 1, 3], ["c", 1, 2], ["d", 1, 4]]);
  rows.forEach((row, i) => (row.group = i < 2 ? "left" : "right"));
  assert.deepStrictEqual(levelsOf(rows, ["a", "b", "c", "d"]), {
    depth: 2,
    levels: {a1: 0, b1: 1, c1: 0, d1: 1},
  });
});

it("stackLevels skips zero, missing, and unstacked segments", () => {
  const rows = rowsOf([["a", 1, 0], ["b", 1, 3], ["c", 1, NaN], ["d", 1, 2]]);
  const ctx = stackOf(rows, ["a", "b", "c", "d"]);
  const stray = {id: "z", discrete: 1, y: 4};
  const {levels, depth} = stackLevels([...rows, stray], ctx);
  assert.strictEqual(depth, 2);
  assert.deepStrictEqual([0, 1, 2, 3].map(i => levels.get(rows[i])), [undefined, 0, undefined, 1]);
  assert.strictEqual(levels.has(stray), false, "a row outside the stack");
});

it("levelWindow gives each level an equal share of the duration, through the easing", () => {
  assert.deepStrictEqual(levelWindow(0, 1), {start: 0, end: 1});
  assert.deepStrictEqual(levelWindow(0, 2), {start: 0, end: 0.5});
  assert.deepStrictEqual(levelWindow(1, 2), {start: 0.5, end: 1});
  assert.deepStrictEqual(levelWindow(1, 3), {start: cubicInOut(1 / 3), end: cubicInOut(2 / 3)});
});

it("showsBars finds a Plot bar anywhere in a scene", () => {
  const scene = children => ({width: 1, height: 1, root: {type: "group", key: "root", children}});
  const bar = {type: "rect", key: "a", shapeType: "Bar", x: 0, y: 0, width: 1, height: 1};
  assert.strictEqual(showsBars(undefined), false);
  assert.strictEqual(showsBars(scene([{...bar, shapeType: "Rect"}])), false);
  assert.strictEqual(showsBars(scene([{type: "group", key: "g", children: [bar]}])), true);
});

/** A bar's scene nodes, as `finishShape` collects them: rect, hit area, error bar, labels. */
const nodesOf = rows => rows.flatMap(row => [
  {type: "rect", key: row.id, shapeType: "Bar", datum: row},
  {type: "rect", key: `${row.id}::hit`, shapeType: "Bar", datum: row},
  {type: "path", key: `${row.id}::confidence`, shapeType: "Bar", datum: row},
  {type: "text", key: `${row.id}_0`, datum: {data: row}},
]);

const emitCtx = (rows, order, viz) => ({
  ...stackOf(rows, order),
  values: rows,
  viz: {schema: {stacked: true}, ...viz},
});

it("stackEnterWindows times each bar, and its labels and error bar, by its stack level", () => {
  const rows = rowsOf([["a", 1, 5], ["b", 1, 3], ["c", 1, -2]]);
  const out = stackEnterWindows(emitCtx(rows, ["a", "b", "c"]), nodesOf(rows));
  const windows = Object.fromEntries(out.map(n => [n.key, n.enterWindow]));
  for (const id of ["a", "b", "c"])
    for (const suffix of ["::hit", "::confidence", "_0"])
      assert.deepStrictEqual(windows[`${id}${suffix}`], windows[id], `${id}${suffix} shares its bar's window`);
  assert.deepStrictEqual(windows.a, {start: 0, end: 0.5});
  assert.deepStrictEqual(windows.b, {start: 0.5, end: 1});
  assert.deepStrictEqual(windows.c, {start: 0, end: 0.5}, "the first segment below zero");
});

it("stackEnterWindows leaves unstacked bars, one-deep stacks, and bars already on screen alone", () => {
  const rows = rowsOf([["a", 1, 5], ["b", 1, 3]]);
  const nodes = nodesOf(rows);
  const onScreen = {root: {type: "group", key: "root", children: [nodes[0]]}};
  assert.strictEqual(stackEnterWindows(emitCtx(rows, ["a", "b"], {schema: {stacked: false}}), nodes), nodes);
  assert.strictEqual(stackEnterWindows(emitCtx(rows, ["a", "b"], {_paintedScene: onScreen}), nodes), nodes);
  const single = rowsOf([["a", 1, 5], ["a", 2, 3]]);
  const singleNodes = nodesOf(single);
  assert.strictEqual(stackEnterWindows(emitCtx(single, ["a"]), singleNodes), singleNodes);
});
