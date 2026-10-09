import assert from "assert";
import it from "../jsdom.js";
import {BRUSH_GROUPS, startsOnBrush} from "../../es/src/charts/drawSteps/zoomGesture.js";

const SVG = "http://www.w3.org/2000/svg";

/** An svg holding a group of `className` with a rect inside, plus a bare rect. */
function surface(className) {
  const svg = document.createElementNS(SVG, "svg");
  const group = document.createElementNS(SVG, "g");
  group.setAttribute("class", className);
  const inner = document.createElementNS(SVG, "rect");
  group.appendChild(inner);
  const outside = document.createElementNS(SVG, "rect");
  svg.appendChild(group);
  svg.appendChild(outside);
  document.body.appendChild(svg);
  return {svg, group, inner, outside};
}

it("charts/zoomGesture startsOnBrush: a press inside the timeline belongs to its brush", () => {
  const {svg, group, inner, outside} = surface("d3plus-viz-timeline");
  assert.strictEqual(startsOnBrush({target: inner}), true, "the brush overlay");
  assert.strictEqual(startsOnBrush({target: group}), true, "the timeline group itself");
  assert.strictEqual(startsOnBrush({target: outside}), false, "a shape beside it");
  assert.strictEqual(startsOnBrush({target: svg}), false, "the chart surface");
});

it("charts/zoomGesture startsOnBrush: a press inside the zoom brush belongs to it", () => {
  const {inner} = surface("d3plus-zoom-brush");
  assert.strictEqual(startsOnBrush({target: inner}), true);
});

it("charts/zoomGesture startsOnBrush: ignores targets that aren't elements", () => {
  assert.strictEqual(startsOnBrush({target: null}), false, "no target");
  assert.strictEqual(startsOnBrush({target: window}), false, "the window");
  assert.strictEqual(startsOnBrush({target: document.createTextNode("x")}), false, "a text node");
});

it("charts/zoomGesture BRUSH_GROUPS names the timeline and zoom brush groups", () => {
  assert.deepStrictEqual(
    BRUSH_GROUPS.split(",").map(s => s.trim()),
    ["g.d3plus-viz-timeline", "g.d3plus-zoom-brush"],
  );
});
