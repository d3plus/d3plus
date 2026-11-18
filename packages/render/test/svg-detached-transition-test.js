import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {SvgRenderer} from "../index.ts";

useJsdom({augment: false});

/**
    An animated draw into a container that is off the page: d3 finds a
    transition by walking up from each element, so the draw's shared
    transition has to live inside the renderer's own tree, not on `<html>`.
*/

const scene = cx => ({
  width: 200,
  height: 100,
  root: {
    type: "group",
    key: "root",
    children: [
      {type: "group", key: "g", children: [{type: "circle", key: "c", cx}]},
      {type: "rect", key: `r${cx}`, x: cx, y: 0, width: 5, height: 5},
    ],
  },
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("SvgRenderer animates a draw into a detached container", async () => {
  const container = document.createElement("div");
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});
  renderer.drawScene(scene(0), {duration: 60});
  const el = container.querySelector('[data-key="c"]');
  assert.doesNotThrow(() => renderer.drawScene(scene(100), {duration: 60}));
  await wait(150);
  assert.strictEqual(Number(el.getAttribute("cx")), 100, "reaches its target");
  assert.strictEqual(
    container.querySelectorAll("rect").length,
    1,
    "the exiting rect is removed",
  );
  renderer.destroy();
});

it("SvgRenderer: a new detached draw interrupts the one in flight", async () => {
  const container = document.createElement("div");
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});
  renderer.drawScene(scene(0));
  const el = container.querySelector('[data-key="c"]');
  let ended = 0;
  renderer.drawScene(scene(100), {duration: 200, onEnd: () => ended++});
  await wait(40);
  renderer.drawScene(scene(50), {duration: 60});
  await wait(260);
  assert.strictEqual(Number(el.getAttribute("cx")), 50, "ends at the latest");
  assert.strictEqual(ended, 0, "the interrupted draw never reports its end");
  renderer.destroy();
});

it("SvgRenderer keeps animating after its container leaves the page", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});
  renderer.drawScene(scene(0));
  container.remove();
  renderer.drawScene(scene(100), {duration: 60});
  await wait(150);
  const el = container.querySelector('[data-key="c"]');
  assert.strictEqual(Number(el.getAttribute("cx")), 100, "reaches its target");
  renderer.destroy();
});
