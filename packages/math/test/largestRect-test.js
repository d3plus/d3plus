import assert from "assert";
import {default as largestRect} from "../src/largestRect.js";

it("geom/largestRect", () => {

  const poly = [[40, 0], [80, 40], [40, 80], [0, 40], [40, 0]];

  let rect = largestRect(poly);
  assert.strictEqual(JSON.stringify([[40, 1], [79, 40], [40, 79], [1, 40], [40, 1]]), JSON.stringify(rect.points.map(d => d.map(Math.round))), "default options");

  rect = largestRect(poly, {angle: 0});
  assert.strictEqual(JSON.stringify([[21, 21], [59, 21], [59, 59], [21, 59], [21, 21]]), JSON.stringify(rect.points.map(d => d.map(Math.round))), "angle option");

});
