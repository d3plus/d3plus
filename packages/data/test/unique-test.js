import assert from "assert";
import {default as unique} from "../src/unique.js";

it("unique", () => {

  assert.strictEqual(unique(["a", "a", "b"]).join(","), "a,b", "Strings");
  assert.strictEqual(unique([1, 2, 1]).join(","), "1,2", "Numbers");

  const firstDate = new Date("1987/06/12");
  const secondDate = new Date("1987/06/12");
  assert.strictEqual(unique([firstDate, secondDate]).join(","), firstDate.toString(), "Dates");

});
