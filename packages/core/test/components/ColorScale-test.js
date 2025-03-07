import assert from "assert";
import {default as ColorScale} from "../../src/components/ColorScale.js";
import it from "../jsdom.js";

it("ColorScale", function *() {

  yield cb => {

    new ColorScale().render(cb);

  };

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByClassName("d3plus-ColorScale").length, 1, "created <g> container element");

});