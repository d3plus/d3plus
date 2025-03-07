import assert from "assert";
import {default as elem} from "../src/elem.js";
import it from "./jsdom.js";

it("elem", () => {

  let svg = elem("svg.className", {enter: {id: "enter"}});

  assert.strictEqual(svg.size(), 1, "Append");
  assert.strictEqual(svg.attr("id"), "enter", "Enter Attributes");

  svg = elem("svg.className", {update: {id: "update"}});
  assert.strictEqual(svg.attr("id"), "update", "Update Attributes");

});
