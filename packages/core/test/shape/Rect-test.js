import assert from "assert";
import {default as Rect} from "../../src/shapes/Rect.js";
import it from "../jsdom.js";

it("Shape/Rect", function *() {

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

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByClassName("d3plus-Rect").length, 1, "created <g> container element");
  assert.strictEqual(document.getElementsByClassName("d3plus-Rect")[0].getAttribute("pointer-events"), "fill", "set pointerEvents attribute of shape");
  assert.strictEqual(document.getElementsByTagName("rect").length, 1, "created <rect> element");
  assert.strictEqual(document.getElementsByTagName("text").length, 1, "created <text> element");
  const tspans = document.getElementsByTagName("tspan");
  assert.strictEqual(tspans.length, 1, "created <tspan> element");
  assert.strictEqual(tspans[0].textContent, "test", "rendered label");

});
