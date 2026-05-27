import assert from "assert";
import {Timeline} from "../../es/index.js";
import it from "../jsdom.js";

it("Timeline", function* () {
  yield cb => {
    new Timeline().render(cb);
  };

  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.querySelectorAll("[id^='d3plus-Axis-']").length,
    1,
    "created axis container element",
  );
});
