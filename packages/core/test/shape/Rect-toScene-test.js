import assert from "assert";
import {SvgRenderer} from "@d3plus/render";
import {Rect} from "../../es/index.js";
import it from "../jsdom.js";

it("Shape/Rect toScene → SvgRenderer", () => {
  const rect = new Rect()
    .data([{id: "a"}, {id: "b"}])
    .width(40)
    .height(20)
    .x((d, i) => 100 + i * 50)
    .y(30)
    .fill("red");

  const scene = rect.toScene();

  // Scene structure mirrors the accessors render() would apply to the DOM.
  assert.strictEqual(scene.type, "group", "root is a group");
  assert.strictEqual(scene.children.length, 2, "one node per datum");

  const a = scene.children[0];
  assert.strictEqual(a.type, "rect", "rect node");
  assert.strictEqual(a.key, "a", "key from id accessor");
  assert.strictEqual(a.width, 40, "width accessor");
  assert.strictEqual(a.height, 20, "height accessor");
  assert.strictEqual(a.x, -20, "centered on the transform origin (x = -w/2)");
  assert.strictEqual(a.y, -10, "centered on the transform origin (y = -h/2)");
  assert.deepStrictEqual(a.transform, {x: 100, y: 30, scale: 1, rotate: 0}, "transform from x/y/scale/rotate");
  assert.strictEqual(a.paint.fill, "red", "fill accessor resolved");
  assert.strictEqual(scene.children[1].transform.x, 150, "second datum x via index accessor");

  // The same scene drives the real SVG backend.
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 300, height: 100});
  renderer.drawScene({width: 300, height: 100, root: scene});

  const rects = document.querySelectorAll("rect.d3plus-render-rect");
  assert.strictEqual(rects.length, 2, "two rects rendered to the DOM");
  assert.strictEqual(rects[0].getAttribute("width"), "40", "width reaches the DOM");
  assert.strictEqual(rects[0].getAttribute("fill"), "red", "fill reaches the DOM");
  assert.strictEqual(
    document.querySelector('[data-key="a"]').getAttribute("transform"),
    "translate(100,30)",
    "transform reaches the DOM",
  );

  renderer.destroy();
});
