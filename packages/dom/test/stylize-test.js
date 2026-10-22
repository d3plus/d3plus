import {it} from "vitest";
import assert from "assert";
import {default as stylize} from "../src/stylize.ts";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";

useJsdom({augment: false});

it("stylize", () => {
  const styles = {
    color: "red",
    "font-size": "12px",
  };

  const div = select("body").append("div");

  stylize(div, styles);

  assert.strictEqual(div.style("color"), "red", "Basic Style");
  assert.strictEqual(div.style("font-size"), "12px", "Hyphenated Style");
});
