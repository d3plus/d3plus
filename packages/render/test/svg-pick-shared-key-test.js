import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {SvgRenderer} from "../index.ts";
import {buildIndex, elementNode} from "../src/svg/svgNodeAttrs.ts";

useJsdom({augment: false});

const rect = (key, x, extra = {}) => ({
  type: "rect",
  key,
  x,
  y: 0,
  width: 10,
  height: 10,
  ...extra,
});

const group = (key, children) => ({type: "group", key, children});

it("buildIndex — records every node by key, and the nodes that share one", () => {
  const first = rect("0", 0);
  const second = rect("0", 20);
  const third = rect("0", 40);
  const only = rect("only", 60);
  const root = group("root", [
    group("a", [first, only]),
    group("b", [second]),
    group("c", [third]),
  ]);
  const index = new Map();
  const shared = new Map();
  buildIndex(root, index, shared);
  assert.strictEqual(
    index.get("0"),
    third,
    "the last node drawn holds the key",
  );
  assert.strictEqual(index.get("only"), only);
  assert.strictEqual(index.get("root"), root);
  assert.deepStrictEqual([...shared.keys()], ["0"]);
  assert.deepStrictEqual(shared.get("0"), [first, second, third]);
});

it("buildIndex — stringifies keys, and works without a shared map", () => {
  const index = new Map();
  buildIndex(group("root", [rect(1, 0), rect("1", 20)]), index);
  assert.deepStrictEqual([...index.keys()], ["root", "1"]);
});

it("elementNode — the element's own node among those sharing its key", () => {
  const first = rect("0", 0);
  const second = rect("0", 20);
  const only = rect("only", 40);
  const index = new Map();
  const shared = new Map();
  buildIndex(group("root", [first, second, only]), index, shared);
  const el = data =>
    Object.assign(document.createElement("div"), {__data__: data});
  assert.strictEqual(elementNode(el(first), "0", index, shared), first);
  assert.strictEqual(elementNode(el(second), "0", index, shared), second);
  assert.strictEqual(
    elementNode(el(rect("0", 0)), "0", index, shared),
    second,
    "a node from another scene falls back to the key's node",
  );
  assert.strictEqual(
    elementNode(document.createElement("div"), "0", index, shared),
    second,
    "an element with nothing bound",
  );
  assert.strictEqual(
    elementNode(el(rect("only", 0)), "only", index, shared),
    only,
    "a key held by one node resolves through the index",
  );
  assert.strictEqual(
    elementNode(el(first), "missing", index, shared),
    undefined,
  );
});

it("SvgRenderer picks each element's own node when nodes share a key", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const draw = tag =>
    renderer.drawScene({
      width: 200,
      height: 100,
      root: group("root", [
        group("x", [rect("0", 0, {datum: `x${tag}`})]),
        group("y", [rect("0", 20, {datum: `y${tag}`})]),
        group("z", [rect("0", 40, {datum: `z${tag}`, interactive: false})]),
      ]),
    });
  draw(1);
  const picks = [];
  renderer.on(e => e.type === "mousemove" && picks.push(e.pick?.datum ?? null));
  const move = parent =>
    document
      .querySelector(
        `svg.d3plus-render-svg [data-key="${parent}"] [data-key="0"]`,
      )
      .dispatchEvent(
        new window.MouseEvent("mousemove", {
          bubbles: true,
          clientX: 1,
          clientY: 1,
        }),
      );
  move("x");
  move("y");
  move("z");
  assert.deepStrictEqual(picks, ["x1", "y1", null]);

  // A redraw rebinds each element to the new scene's node.
  draw(2);
  move("x");
  move("y");
  assert.deepStrictEqual(picks.slice(3), ["x2", "y2"]);
  renderer.destroy();
});
