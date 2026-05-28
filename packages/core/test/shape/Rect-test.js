import assert from "assert";
import {Rect} from "../../es/index.js";
import it from "../jsdom.js";

it("Shape/Rect", function* () {
  yield cb => {
    new Rect()
      .data([{id: "test"}])
      .duration(0)
      .height(200)
      .label(d => d.id)
      .width(100)
      .x(100)
      .y(50)
      .render(cb);
  };

  // v4: standalone Shape.render() auto-routes through @d3plus/render's
  // SvgRenderer — the user gets `svg.d3plus-render-svg` with scene-class
  // children, not the legacy d3plus-Rect DOM.
  yield cb => global.setTimeout(cb, 50);

  assert.strictEqual(
    document.querySelectorAll("svg.d3plus-render-svg").length,
    1,
    "scene SVG created",
  );
  const rects = document.querySelectorAll("rect.d3plus-render-rect");
  assert.strictEqual(rects.length, 1, "scene rect rendered");
  const texts = document.querySelectorAll("text.d3plus-render-text");
  assert.strictEqual(texts.length, 1, "label text rendered");
  const tspan = texts[0].querySelector("tspan");
  assert.strictEqual(
    tspan ? tspan.textContent : texts[0].textContent,
    "test",
    "label content",
  );
});
