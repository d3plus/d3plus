import assert from "assert";
import {default as titleCase} from "../src/titleCase.js";

it("titleCase", () => {

  assert.strictEqual(titleCase("this-that"), "This-That", "Non-space Break");
  assert.strictEqual(titleCase("this and that"), "This and That", "Lowercase Word");

});
