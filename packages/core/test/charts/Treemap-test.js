import assert from "assert";
import {default as Treemap} from "../../src/charts/Treemap.js";
import it from "../jsdom.js";

it("Treemap", function *() {

  yield cb => {

    new Treemap().render(cb);

  };

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByClassName("d3plus-Treemap").length, 1, "created <g> container element");

});