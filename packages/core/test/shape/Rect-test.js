import assert from "assert";
import {Rect} from "../../es/index.js";
import it from "../jsdom.js";

it("Shape/Rect", function* () {
  yield cb => {
    new Rect()
      .data([{id: "test"}])
      .duration(100)
      .height(200)
      .label(d => d.id)
      .pointerEvents("fill")
      .width(100)
      .x(100)
      .y(50)
      .render(cb);
  };

  // pointer-events is applied via a delayed transition that finishes just after
  // the render callback fires; let it settle before asserting on it.
  yield cb => global.setTimeout(cb, 300);

  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.getElementsByClassName("d3plus-Rect").length,
    1,
    "created <g> container element",
  );
  assert.strictEqual(
    document
      .getElementsByClassName("d3plus-Rect")[0]
      .getAttribute("pointer-events"),
    "fill",
    "set pointerEvents attribute of shape",
  );
  assert.strictEqual(
    document.getElementsByTagName("rect").length,
    1,
    "created <rect> element",
  );
  assert.strictEqual(
    document.getElementsByTagName("text").length,
    1,
    "created <text> element",
  );
  const texts = document.getElementsByTagName("text");
  assert.strictEqual(texts[0].textContent, "test", "rendered label");
});
