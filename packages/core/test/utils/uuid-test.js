import assert from "assert";
import {default as uuid} from "../../src/utils/uuid.js";

it("uuid", () => {

  assert.notEqual(uuid(), uuid(), "Unique Values");

});
