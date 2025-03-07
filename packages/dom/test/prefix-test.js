import assert from "assert";
import {default as prefix} from "../src/prefix.js";
import it from "./jsdom.js";

it("prefix", () => {

  assert.strictEqual(prefix(), "", "Webkit");

});
