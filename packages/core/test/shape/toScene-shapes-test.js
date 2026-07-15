import assert from "assert";
import {SvgRenderer} from "@d3plus/render";
import {Area, Circle, Line, Path, Rect} from "../../es/index.js";
import it from "../jsdom.js";

function render(scene) {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 300, height: 200});
  renderer.drawScene({width: 300, height: 200, root: scene});
  return renderer;
}

it("Shape/Circle toScene", () => {
  const scene = new Circle().data([{id: "c"}]).r(8).x(20).y(30).fill("blue").toScene();
  const n = scene.children[0];
  assert.strictEqual(n.type, "circle");
  assert.strictEqual(n.r, 8, "radius");
  assert.strictEqual(n.cx, 0, "circle centered on transform origin");
  assert.deepStrictEqual(n.transform, {x: 20, y: 30, scale: 1, rotate: 0}, "positioned by transform");
  assert.strictEqual(n.paint.fill, "blue");

  const r = render(scene);
  const el = document.querySelector("circle.d3plus-render-circle");
  assert.strictEqual(el.getAttribute("r"), "8", "radius reaches DOM");
  assert.strictEqual(el.getAttribute("transform"), "translate(20,30)", "transform reaches DOM");
  r.destroy();
});

it("Shape/Path toScene", () => {
  const scene = new Path().data([{id: "p", path: "M0,0L10,10"}]).fill("green").toScene();
  const n = scene.children[0];
  assert.strictEqual(n.type, "path");
  assert.strictEqual(n.d, "M0,0L10,10", "d from accessor");

  const r = render(scene);
  assert.strictEqual(
    document.querySelector("path.d3plus-render-path").getAttribute("d"),
    "M0,0L10,10",
    "d reaches DOM",
  );
  r.destroy();
});

it("Shape/Line toScene (path via generator, centered)", () => {
  const scene = new Line()
    .data([{id: "L", x: 0, y: 0}, {id: "L", x: 10, y: 20}])
    .x(d => d.x)
    .y(d => d.y)
    .toScene();

  // Two children per line: the fat transparent hit area (behind) + the visible
  // line. The hit area is pushed first so it sits behind.
  assert.strictEqual(scene.children.length, 2, "hit area + visible line");
  const hit = scene.children[0];
  assert.strictEqual(hit.paint.stroke, "transparent", "hit area is the invisible fat stroke");
  const n = scene.children[1];
  assert.strictEqual(n.type, "path");
  // center = midpoint of x/y extents = (5, 10); points are relative to it.
  assert.deepStrictEqual(n.transform, {x: 5, y: 10, scale: 1, rotate: 0}, "centered transform");
  assert.strictEqual(n.d, "M-5,-10L5,10", "line points baked relative to center");
  assert.strictEqual(hit.d, n.d, "hit area overlaps the visible line's geometry");

  const r = render(scene);
  assert.ok(document.querySelector("path.d3plus-render-path"), "line path rendered");
  r.destroy();
});

it("Shape/Area toScene (path via generator, centered)", () => {
  const scene = new Area()
    .data([{id: "A", x: 0, y: 5}, {id: "A", x: 10, y: 15}])
    .toScene();

  assert.strictEqual(scene.children.length, 1, "grouped into one area");
  const n = scene.children[0];
  assert.strictEqual(n.type, "path");
  assert.match(n.d, /^M/, "area produced a path string");
  assert.strictEqual(n.transform.x, 5, "centered x (extent midpoint)");
  assert.strictEqual(n.transform.y, 7.5, "centered y (extent midpoint)");

  const r = render(scene);
  assert.ok(document.querySelector("path.d3plus-render-path").getAttribute("d"), "area d reaches DOM");
  r.destroy();
});

it("Shape texture resolves to a pattern token and renders as a pattern fill", () => {
  const scene = new Rect()
    .data([{id: "a"}])
    .width(20)
    .height(20)
    .x(10)
    .y(10)
    .fill("#f00")
    .texture("circles")
    .toScene();

  assert.match(scene.children[0].paint.fill, /^pattern:/, "textured fill is a pattern token");

  const r = render(scene);
  assert.match(
    document.querySelector('[data-key="a"]').getAttribute("fill"),
    /^url\(#/,
    "SvgRenderer materializes the token into a pattern url",
  );
  assert.ok(document.querySelector("pattern"), "a <pattern> def was created");
  r.destroy();
});
