import assert from "assert";
import {default as polygonRayCast} from "../src/polygonRayCast.js";

it("geom/polygonRayCast", () => {

  const poly = [[0, 0], [4, 0], [4, 4], [0, 4]],
        round = p => p ? p.map(Math.round) : p;

  assert.strictEqual(JSON.stringify([[0, 2], [4, 2]]), JSON.stringify(polygonRayCast(poly, [2, 2]).map(round)), "inside - flat");
  assert.strictEqual(JSON.stringify([[0, 0], [4, 4]]), JSON.stringify(polygonRayCast(poly, [2, 2], Math.PI / 4).map(round)), "inside - angle");
  assert.strictEqual(JSON.stringify([[4, 2], null]), JSON.stringify(polygonRayCast(poly, [6, 2]).map(round)), "right - flat");
  assert.strictEqual(JSON.stringify([[4, 3], null]), JSON.stringify(polygonRayCast(poly, [5, 4], Math.PI / 4).map(round)), "right - angle");
  assert.strictEqual(JSON.stringify([null, [0, 2]]), JSON.stringify(polygonRayCast(poly, [-2, 2]).map(round)), "left - flat");
  assert.strictEqual(JSON.stringify([null, [0, 3]]), JSON.stringify(polygonRayCast(poly, [-1, 4], -Math.PI / 4).map(round)), "left - angle");
  assert.strictEqual(JSON.stringify([null, null]), JSON.stringify(polygonRayCast(poly, [2, -2]).map(round)), "false - flat");
  assert.strictEqual(JSON.stringify([null, null]), JSON.stringify(polygonRayCast(poly, [5, -1], Math.PI / 2).map(round)), "false - angle");

});
