import {it} from "vitest";
import assert from "assert";
import {Bar} from "../../index.ts";

/**
    A Bar's `hitAreaStyle` rides on its hit area as `hoverPaint`, the paint
    the chart lays over it while the bar is hovered (its band). Without a
    style, or without a hit area, there is none, and an `interactive: false`
    hit area lets the pointer through.
*/

const data = [{id: "a", x: 10, y: 20}];
const hitOf = scene =>
  scene.children.find(c => String(c.key).endsWith("::hit"));
const area = {x: -10, y: -50, width: 20, height: 100};

it("Bar: hitAreaStyle becomes its hit area's hoverPaint", () => {
  const style = {fill: "#222", fillOpacity: 0.1};
  const scene = new Bar()
    .data(data)
    .config({hitArea: area, hitAreaStyle: style})
    .toScene();
  const hit = hitOf(scene);
  assert.deepStrictEqual(hit.hoverPaint, style);
  assert.strictEqual(hit.paint.fill, "transparent", "unhovered, unseen");
  assert.strictEqual(hit.interactive, undefined);
});

it("Bar: hitAreaStyle merges over the style set before it", () => {
  const bar = new Bar()
    .data(data)
    .config({hitArea: area, hitAreaStyle: {fill: "#222", fillOpacity: 0.1}});
  bar.config({hitAreaStyle: {fillOpacity: 0.3}});
  assert.deepStrictEqual(hitOf(bar.toScene()).hoverPaint, {
    fill: "#222",
    fillOpacity: 0.3,
  });
});

it("Bar: no hoverPaint without a style, or with hitAreaStyle false", () => {
  const plain = new Bar().data(data).config({hitArea: area}).toScene();
  assert.strictEqual(hitOf(plain).hoverPaint, undefined);
  const off = new Bar()
    .data(data)
    .config({hitArea: area, hitAreaStyle: false})
    .toScene();
  assert.strictEqual(hitOf(off).hoverPaint, undefined);
  const none = new Bar()
    .data(data)
    .config({hitArea: false, hitAreaStyle: {fill: "#222"}})
    .toScene();
  assert.strictEqual(hitOf(none), undefined, "no hit area, no band");
});

it("Bar: a hit area with interactive false lets the pointer through", () => {
  const scene = new Bar()
    .data(data)
    .config({hitArea: {...area, interactive: false}})
    .toScene();
  assert.strictEqual(hitOf(scene).interactive, false);
});

it("Bar: hitAreaStyle keeps only paint keys", () => {
  const bar = new Bar().hitAreaStyle({fill: "#222", on: {}, label: "x"});
  assert.deepStrictEqual(bar.hitAreaStyle(), {fill: "#222"});
});
