import assert from "assert";
import {Area, Line} from "../../es/index.js";

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
