import {it} from "vitest";
import assert from "assert";
import {Area, Line} from "../../index.ts";

// #785: every accessor on a multi-point shape (Line/Area) must receive the same
// representative datum — the merged aggregate `d.data` — rather than some
// accessors getting the first point (`d.values[0]`) and others the aggregate.
// Here `y` sums to 60 across the three points, so an accessor that received the
// first point would see `y === 10`.
it("multi-point shapes hand every accessor the merged aggregate", () => {
  const data = [
    {id: "alpha", x: 0, y: 10, group: "g"},
    {id: "alpha", x: 1, y: 20, group: "g"},
    {id: "alpha", x: 2, y: 30, group: "g"},
  ];

  const seen = {};
  const capture = key => d => { seen[key] = d; return key === "opacity" ? 1 : "black"; };

  new Line()
    .data(data)
    .stroke(capture("stroke"))
    .strokeDasharray(capture("strokeDasharray"))
    .opacity(capture("opacity"))
    .toScene();

  // stroke/strokeDasharray go through `_styleVal`, opacity through `_nestWrapper`
  // — all three must now resolve to the one merged-aggregate object.
  assert.strictEqual(seen.stroke, seen.strokeDasharray, "stroke and strokeDasharray see the same datum");
  assert.strictEqual(seen.stroke, seen.opacity, "stroke and opacity see the same datum");
  assert.strictEqual(seen.stroke.y, 60, "accessor gets the aggregate (summed y), not the first point (10)");

  // Area shares the base mechanism; confirm it agrees.
  let areaStroke;
  new Area()
    .data(data)
    .stroke(d => { areaStroke = d; return "black"; })
    .toScene();
  assert.strictEqual(areaStroke.y, 60, "Area accessor also gets the aggregate, not the first point");
});

// An Area's texture accessor gets the same merged row as its other styles, so
// a per-row texture works on areas, confidence bands, and fills between lines.
it("Area texture accessors receive the merged aggregate", () => {
  const data = [
    {id: "alpha", x: 0, y: 10}, {id: "alpha", x: 1, y: 20},
    {id: "beta", x: 0, y: 5}, {id: "beta", x: 1, y: 8},
  ];
  let seen;
  const scene = new Area()
    .data(data)
    .texture(d => { seen = d; return d.id === "alpha" ? "lines" : false; })
    .toScene();
  assert.strictEqual(seen.y, 13, "the accessor gets the aggregate (summed y)");
  const fills = Object.fromEntries(scene.children.map(n => [n.key, n.paint.fill]));
  assert.ok(fills.alpha.startsWith("pattern:"), "alpha is textured");
  assert.ok(!fills.beta.startsWith("pattern:"), "beta is not");
});

// The texture's default background and line colors come from the same merged
// row as the shape's own fill and stroke, not from its first point.
it("Area texture colors resolve fill and stroke against the merged aggregate", () => {
  const data = [{id: "alpha", x: 0, y: 10}, {id: "alpha", x: 1, y: 20}];
  const byTotal = d => (d.y > 15 ? "red" : "blue");
  const scene = new Area()
    .data(data)
    .fill(byTotal)
    .stroke(byTotal)
    .texture("lines")
    .toScene();
  const texture = JSON.parse(scene.children[0].paint.fill.slice("pattern:".length));
  assert.strictEqual(texture.background, "red", "the background is the aggregate's fill (y 30), not the first point's (y 10)");
  assert.strictEqual(texture.stroke, "red", "the line color is the aggregate's stroke");
});

// The nearest-point tooltip (#786) needs each Line/Area scene node to carry its
// points paired with their source data, in content space.
it("Line.toScene stashes per-point interaction points paired with source data", () => {
  const data = [
    {id: "a", x: 0, y: 5},
    {id: "a", x: 10, y: 15},
    {id: "a", x: 20, y: 25},
  ];
  const scene = new Line().data(data).x("x").y("y").toScene();
  const node = scene.children.find(c => c.interactionPoints);
  assert.ok(node, "geometry node carries interactionPoints");
  assert.deepStrictEqual(
    node.interactionPoints.map(p => p.x), [0, 10, 20],
    "one content-space position per point",
  );
  assert.strictEqual(node.interactionPoints[2].datum.y, 25, "each entry keeps its source datum");
  assert.strictEqual(node.interactionPoints[2].index, 2, "…and its index");
});

// A point with no value must be dropped so nearest never lands on a gap (#786).
it("interaction points exclude points with no value", () => {
  const data = [
    {id: "a", x: 0, y: 5},
    {id: "a", x: 10, y: 15},
    {id: "a", x: 20},
  ];
  const node = new Line().data(data).x("x").y("y").toScene()
    .children.find(c => c.interactionPoints);
  assert.deepStrictEqual(
    node.interactionPoints.map(p => p.x), [0, 10],
    "the valueless point is dropped",
  );
});
