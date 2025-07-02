import assert from "assert";
import {default as titleCase} from "../src/titleCase.js";

it("titleCase", () => {

  assert.strictEqual(titleCase("mcDonald"), "McDonald", "Preserves mid-word capitals");

  assert.strictEqual(titleCase("Group A"), "Group A", "Preserves end-word lowercases");

  assert.strictEqual(titleCase("this-that"), "This-That", "Non-space Break");

  assert.strictEqual(titleCase("this and that"), "This and That", "Lowercase Word");

  assert.strictEqual(titleCase("CEOs on TV"), "CEOs on TV", "Uppercase Words (plural and singular)");
  
});
