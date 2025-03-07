import assert from "assert";
import {default as Legend} from "../../src/components/Legend.js";
import it from "../jsdom.js";

it("Legend", function *() {

  yield cb => {

    new Legend().render(cb);

  };

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByClassName("d3plus-Legend").length, 1, "created <g> container element");

});