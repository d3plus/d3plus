import assert from "assert";
import {Timeline} from "../../es/index.js";
import it from "../jsdom.js";

it("Timeline", function* () {
  yield cb => {
    new Timeline().render(cb);
  };

  assert.ok(
    document.getElementsByTagName("svg").length >= 1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.querySelectorAll("[id^='d3plus-Axis-']").length,
    1,
    "created axis container element",
  );
  // Standalone Timelines paint their own axis scene (ticks/track/labels)
  // beneath the brush DOM; inside a Viz the parent composes it instead.
  assert.strictEqual(
    document.querySelectorAll(".d3plus-render-svg").length,
    1,
    "painted the axis scene for standalone use",
  );
});
