import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {SvgRenderer} from "../index.ts";

useJsdom({augment: false});

it("SvgRenderer writes a positioned run's x on its tspan", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  const draw = runs =>
    renderer.drawScene({
      width: 200,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [
          {
            type: "text",
            key: "t",
            x: 0,
            y: 0,
            font: {size: 10, anchor: "start"},
            lines: [{text: "ab cd", x: 0, y: 10, width: 100, runs}],
          },
        ],
      },
    });
  draw([
    {text: "ab ", x: 0},
    {text: "cd", x: 80},
  ]);
  const runs = () =>
    [...document.querySelectorAll("text > tspan > tspan")].map(t => [
      t.textContent,
      t.getAttribute("x"),
    ]);
  assert.deepStrictEqual(runs(), [
    ["ab ", "0"],
    ["cd", "80"],
  ]);
  // A run without an x drops the attribute, so it follows the run before.
  draw([{text: "ab "}, {text: "cd"}]);
  assert.deepStrictEqual(runs(), [
    ["ab ", null],
    ["cd", null],
  ]);
});
