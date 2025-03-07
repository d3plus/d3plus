import assert from "assert";
import {default as BaseClass} from "../../src/utils/BaseClass.js";

it("BaseClass", () => {

  const one = new BaseClass(), two = new BaseClass();
  assert.ok(one._uuid !== two._uuid, "_uuid");

});
