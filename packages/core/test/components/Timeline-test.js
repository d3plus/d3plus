import assert from "assert";
import {default as Timeline} from "../../src/components/Timeline.js";
import it from "../jsdom.js";

it("Timeline", function *() {

  yield cb => {

    new Timeline().render(cb);

  };

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByClassName("d3plus-Timeline").length, 1, "created <g> container element");

});