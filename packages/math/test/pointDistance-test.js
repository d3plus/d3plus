import {it} from "vitest";
import assert from "assert";
import {default as pointDistance} from "../src/pointDistance.ts";

it("geom/pointDistance", () => {
  assert.strictEqual(Math.sqrt(50), pointDistance([0, 0], [5, 5]), "distance");
});
