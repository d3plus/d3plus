import assert from "assert";
import {pathBounds, path2polygon} from "../es/index.js";

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const boxNear = (got, exp, eps = 1e-4) =>
  near(got.x, exp.x, eps) && near(got.y, exp.y, eps) &&
  near(got.width, exp.width, eps) && near(got.height, exp.height, eps);

it("math/pathBounds computes exact bounds with no DOM", () => {
  // Straight lines / relative / H+V.
  assert.ok(boxNear(pathBounds("M320,40 L440,160 L320,280 L200,160 Z"),
    {x: 200, y: 40, width: 240, height: 240}), "diamond");
  assert.ok(boxNear(pathBounds("m10,10 h100 v50 h-100 z"),
    {x: 10, y: 10, width: 100, height: 50}), "relative H/V rect");

  // Cubic Bézier: bounds come from the curve extrema, tighter than the hull.
  const cubic = pathBounds("M0,0 C0,100 100,100 100,0");
  assert.ok(near(cubic.x, 0) && near(cubic.width, 100), "cubic x extent = endpoints");
  // Peak of this symmetric cubic is 3/4 of the control height (75), not 100.
  assert.ok(near(cubic.y, 0) && near(cubic.height, 75, 1e-6), "cubic y extent from extrema");

  // Full-circle drawn as two arcs → tight square bounds.
  assert.ok(boxNear(pathBounds("M100,50 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 Z"),
    {x: 100, y: 0, width: 100, height: 100}, 1e-3), "circle via arcs");

  // Arc flags glued to the next number must still parse.
  const glued = pathBounds("M80,80 A40 40 0 0180 160 Z");
  assert.ok(glued.width > 0 && glued.height > 0, "glued arc flags parse");
});

it("math/path2polygon is DOM-free and returns real points", () => {
  // The old implementation returned [] without a document; this must not.
  const poly = path2polygon("M0,0 L100,0 L100,100 L0,100 Z");
  assert.ok(poly.length >= 4, "polygon has the rectangle's vertices");
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  assert.strictEqual(Math.min(...xs), 0);
  assert.strictEqual(Math.max(...xs), 100);
  assert.strictEqual(Math.min(...ys), 0);
  assert.strictEqual(Math.max(...ys), 100);

  // Curves are flattened densely enough to approximate the shape.
  const arc = path2polygon("M100,50 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 Z", 8);
  assert.ok(arc.length > 20, "arc flattened into many segments");
});
