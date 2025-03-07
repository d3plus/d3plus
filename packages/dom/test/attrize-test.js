import assert from "assert";
import {default as attrize} from "../src/attrize.js";
import {select} from "d3-selection";
import it from "./jsdom.js";

it("attrize", () => {

  const styles = {
    "width": "500px",
    "font-size": "12px"
  };

  const svg = select("body").append("svg");

  attrize(svg, styles);

  assert.strictEqual(svg.attr("width"), "500px", "Basic Attribute");
  assert.strictEqual(svg.attr("font-size"), "12px", "Hyphenated Attribute");

});
