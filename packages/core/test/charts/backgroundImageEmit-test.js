import assert from "assert";
import {backgroundImageNode, backgroundImageNodes} from "../../es/src/charts/features/backgroundImageEmit.js";
import {shapeConfigFor} from "../../es/src/charts/features/emitHelpers.js";
import it from "../jsdom.js";

const URL = "data:image/svg+xml,%3Csvg/%3E";
const rect = {type: "rect", key: "r", x: 10, y: 20, width: 100, height: 50, datum: {id: "a"}, index: 3, paint: {fill: "red"}};
const imageOf = group => group.children[0];

it("backgroundImageNode: resolves the URL per datum", () => {
  const sc = {backgroundImage: d => (d.id === "a" ? URL : false)};
  const group = backgroundImageNode(sc, rect, {id: "a"}, 0);
  assert.strictEqual(imageOf(group).href, URL);
  assert.strictEqual(backgroundImageNode(sc, rect, {id: "b"}, 0), null, "a falsy URL draws nothing");
});

it("backgroundImageNode: passes the datum and index to the accessor", () => {
  const seen = [];
  const sc = {backgroundImage: (d, i) => (seen.push([d.id, i]), URL)};
  backgroundImageNode(sc, rect, {id: "z"}, 7);
  assert.deepStrictEqual(seen, [["z", 7]]);
});

it("backgroundImageNode: returns null when backgroundImage is absent", () => {
  assert.strictEqual(backgroundImageNode({}, rect, {id: "a"}, 0), null);
  assert.strictEqual(backgroundImageNode({backgroundImage: ""}, rect, {id: "a"}, 0), null);
});

it("backgroundImageNode: covers a rect, clipped to it, keyed apart and non-interactive", () => {
  const group = backgroundImageNode({backgroundImage: URL}, rect, rect.datum, 0);
  const image = imageOf(group);
  assert.deepStrictEqual(
    {x: image.x, y: image.y, width: image.width, height: image.height},
    {x: 10, y: 20, width: 100, height: 50},
  );
  assert.strictEqual(image.preserveAspectRatio, "xMidYMid slice");
  assert.deepStrictEqual(group.clip, {type: "rect", x: 10, y: 20, width: 100, height: 50});
  assert.strictEqual(group.key, "r-bgimage");
  assert.strictEqual(image.key, "r-bgimage-img");
  assert.strictEqual(group.interactive, false);
  assert.strictEqual(image.interactive, false);
  assert.strictEqual(group.datum, rect.datum, "carries the shape's datum for hover dimming");
  assert.strictEqual(group.index, 3, "uses the node's own index");
  assert.strictEqual(group.paint.opacity, 1);
});

it("backgroundImageNode: clips a circle to its outline and contains it in the inscribed square", () => {
  const circle = {type: "circle", key: "c", cx: 50, cy: 60, r: 20, datum: {id: "a"}, paint: {opacity: 0.4}};
  const cover = backgroundImageNode({backgroundImage: URL}, circle, circle.datum, 0);
  assert.strictEqual(cover.clip.type, "path");
  assert.ok(/^M30,60a20,20 /.test(cover.clip.d), "clip is the circle");
  assert.strictEqual(cover.paint.opacity, 0.4, "fades with the shape");
  assert.strictEqual(cover.index, 0, "falls back to the resolved index");

  const contain = backgroundImageNode(
    {backgroundImage: URL, backgroundImageFit: () => "contain"}, circle, circle.datum, 0,
  );
  const side = 20 * Math.SQRT2;
  assert.strictEqual(imageOf(contain).preserveAspectRatio, "xMidYMid meet");
  assert.strictEqual(contain.clip, undefined);
  assert.ok(Math.abs(imageOf(contain).width - side) < 1e-9);
});

it("backgroundImageNode: clips a path to its own d and carries its transform", () => {
  const d = "M0,0L100,0L50,80Z";
  const path = {type: "path", key: "p", d, transform: {x: 5, y: 6, rotate: 30}, datum: {id: "a"}};
  const group = backgroundImageNode({backgroundImage: URL}, path, path.datum, 0);
  assert.deepStrictEqual(group.clip, {type: "path", d});
  assert.deepStrictEqual(group.transform, {x: 5, y: 6, rotate: 30});
  const image = imageOf(group);
  assert.deepStrictEqual([image.x, image.y, image.width, image.height], [0, 0, 100, 80]);
});

it("backgroundImageNode: skips a shape with no area", () => {
  const flat = {...rect, width: 0};
  assert.strictEqual(backgroundImageNode({backgroundImage: URL}, flat, rect.datum, 0), null);
});

it("backgroundImageNodes: one image per node that resolves a URL, in node order", () => {
  const data = [{id: "a"}, {id: "b"}, {id: "c"}];
  const nodes = data.map((datum, i) => ({...rect, key: datum.id, datum, index: undefined, x: i * 10}));
  const sc = {backgroundImage: d => (d.id === "b" ? false : `${URL}#${d.id}`)};
  const out = backgroundImageNodes(sc, nodes, k => [data[k], k]);
  assert.deepStrictEqual(out.map(g => g.key), ["a-bgimage", "c-bgimage"]);
  assert.deepStrictEqual(out.map(g => imageOf(g).href), [`${URL}#a`, `${URL}#c`]);
  assert.deepStrictEqual(out.map(g => g.index), [0, 2]);
});

it("backgroundImageNodes: resolves nothing when backgroundImage is unset", () => {
  let calls = 0;
  const out = backgroundImageNodes({}, [rect], () => (calls++, [rect.datum, 0]));
  assert.deepStrictEqual(out, []);
  assert.strictEqual(calls, 0);
});

it("backgroundImageNode: a nested shapeConfig.Rect.backgroundImage resolves through shapeConfigFor", () => {
  const viz = {schema: {shapeConfig: {Rect: {backgroundImage: d => `${URL}#${d.id}`}}, duration: 0}};
  const rectCfg = shapeConfigFor(viz, "Rect");
  assert.strictEqual(imageOf(backgroundImageNode(rectCfg, rect, {id: "q"}, 0)).href, `${URL}#q`);
  const circleCfg = shapeConfigFor(viz, "Circle");
  assert.strictEqual(backgroundImageNode(circleCfg, rect, {id: "q"}, 0), null, "other shape kinds ignore it");
});

it("backgroundImageNode: a shared accessor unwraps d3plus-wrapped data", () => {
  const viz = {schema: {shapeConfig: {backgroundImage: d => `${URL}#${d.id}`}, duration: 0}};
  const sc = shapeConfigFor(viz, "Rect");
  const wrapped = {__d3plus__: true, data: {id: "inner"}, i: 4};
  assert.strictEqual(imageOf(backgroundImageNode(sc, rect, wrapped, 0)).href, `${URL}#inner`);
});
