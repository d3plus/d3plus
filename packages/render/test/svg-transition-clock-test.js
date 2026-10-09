import assert from "assert";
import {select} from "d3-selection";
import "d3-transition";

import it from "./jsdom.js";
import {SvgRenderer} from "../es/index.js";

const scene = cx => ({
  width: 200,
  height: 100,
  root: {
    type: "group",
    key: "root",
    children: [{type: "circle", key: "c", cx, cy: 50, r: 5}],
  },
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("SvgRenderer plays a transition from its start after a long synchronous task", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene(0));
  const el = document.querySelector('[data-key="c"]');

  // Something early in the task reads d3's clock (as a chart's own
  // transitions do), then the task keeps working well past a frame.
  select(document.body).transition();
  const until = performance.now() + 300;
  while (performance.now() < until);

  renderer.drawScene(scene(100), {duration: 400});
  const seen = [];
  for (let k = 0; k < 6; k++) {
    await wait(50);
    seen.push(Number(el.getAttribute("cx")));
  }
  await wait(300);
  const end = Number(el.getAttribute("cx"));

  assert.ok(
    seen[0] < 50,
    `starts near its beginning, not ${seen[0]}% of the way in`,
  );
  assert.ok(
    seen.some(cx => cx > 0 && cx < 100),
    `intermediate frames are drawn: ${seen.join(", ")}`,
  );
  assert.ok(
    seen.every((cx, i) => i === 0 || cx >= seen[i - 1]),
    "and progress forward",
  );
  assert.strictEqual(end, 100, "it ends at its target");
  renderer.destroy();
});

it("SvgRenderer leaves an unstalled transition's timing alone", async () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene(0));
  const el = document.querySelector('[data-key="c"]');
  renderer.drawScene(scene(100), {duration: 200});
  await wait(320);
  assert.strictEqual(Number(el.getAttribute("cx")), 100, "finishes on time");
  renderer.destroy();
});
