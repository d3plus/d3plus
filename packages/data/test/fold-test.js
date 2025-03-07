import assert from "assert";
import {default as fold} from "../src/fold.js";

it("data/fold", () => {

  const data = fold({
    data: [[0, "Dave"], [1, "Alex"]],
    headers: ["id", "name"]
  });

  assert.strictEqual(true, data instanceof Array, "returns Array");
  assert.strictEqual(2, data.length, "correct Array length");
  assert.strictEqual(0, data[0].id, "data 1 - key 1");
  assert.strictEqual("Dave", data[0].name, "data 1 - key 2");
  assert.strictEqual(1, data[1].id, "data 2 - key 1");
  assert.strictEqual("Alex", data[1].name, "data 2 - key 2");

});
