import assert from "assert";
import it from "../jsdom.js";
import {nodeColor, tooltipSwatch, visibleColor, withSwatch} from "../../es/src/charts/features/tooltipSwatch.js";

/** Parses swatch HTML into its root element. */
const parse = html => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstElementChild;
};

it("tooltipSwatch — a Line is a stroke through a dot", () => {
  const sw = parse(tooltipSwatch("red", "Line"));
  assert.ok(sw.classList.contains("d3plus-tooltip-swatch"));
  assert.ok(sw.classList.contains("d3plus-tooltip-swatch-line"));
  const [stroke, dot] = sw.children;
  assert.strictEqual(stroke.style.background, "red", "the stroke");
  assert.strictEqual(stroke.style.height, "2px");
  assert.strictEqual(dot.style.background, "red", "the dot");
  assert.strictEqual(dot.style.borderRadius, "50%");
  assert.strictEqual(stroke.style.left, "0px", "the stroke spans the swatch");
  assert.strictEqual(stroke.style.right, "0px");
  assert.ok(parseFloat(sw.style.width) > parseFloat(dot.style.width), "and pokes out either side of the dot");
});

it("tooltipSwatch — every shape is the same size, so swatches line up", () => {
  const sizes = ["Line", "Circle", "Rect"].map(shape => {
    const sw = parse(tooltipSwatch("red", shape));
    return [sw.style.width, sw.style.height];
  });
  assert.deepStrictEqual(sizes, [["10px", "10px"], ["10px", "10px"], ["10px", "10px"]]);
});

it("withSwatch — centers the swatch on its text", () => {
  const el = parse(withSwatch(tooltipSwatch("red", "Rect"), "Alpha"));
  assert.strictEqual(el.style.display, "inline-flex");
  assert.strictEqual(el.style.alignItems, "center");
  assert.ok(el.firstElementChild.classList.contains("d3plus-tooltip-swatch"), "swatch first");
  assert.strictEqual(el.lastElementChild.textContent, "Alpha", "then the text");
  assert.strictEqual(withSwatch("", "Alpha"), "Alpha", "just the text without a swatch");
  assert.strictEqual(withSwatch("", 42), "42");
});

it("tooltipSwatch — a Circle is a dot, everything else a square", () => {
  const dot = parse(tooltipSwatch("blue", "Circle"));
  assert.strictEqual(dot.style.borderRadius, "50%");
  assert.strictEqual(dot.style.background, "blue");
  for (const shape of ["Rect", "Bar", "Area", "Path", "Box", undefined]) {
    const square = parse(tooltipSwatch("blue", shape));
    assert.strictEqual(square.style.borderRadius, "1px", `${shape} is a square`);
    assert.ok(!square.classList.contains("d3plus-tooltip-swatch-line"));
  }
});

it("tooltipSwatch — nothing without a color", () => {
  assert.strictEqual(tooltipSwatch(undefined, "Line"), "");
  assert.strictEqual(tooltipSwatch("", "Rect"), "");
});

it("visibleColor", () => {
  assert.strictEqual(visibleColor("red"), "red");
  assert.strictEqual(visibleColor("none"), undefined);
  assert.strictEqual(visibleColor("transparent"), undefined);
  assert.strictEqual(visibleColor(undefined), undefined);
  assert.strictEqual(visibleColor(3), undefined);
});

it("nodeColor — a Line's stroke, otherwise the fill", () => {
  const viz = {_chartScene: []};
  assert.strictEqual(nodeColor(viz, {shapeType: "Line", paint: {stroke: "red", fill: "none"}}), "red");
  assert.strictEqual(nodeColor(viz, {shapeType: "Rect", paint: {stroke: "black", fill: "blue"}}), "blue");
  assert.strictEqual(nodeColor(viz, {shapeType: "Rect", paint: {stroke: "black", fill: "none"}}), "black", "unfilled marks use the stroke");
  assert.strictEqual(nodeColor(viz, {shapeType: "Rect"}), undefined, "no paint");
  assert.strictEqual(nodeColor(viz, undefined), undefined, "no node");
});

it("nodeColor — a transparent hover target reads its visible sibling", () => {
  const line = {type: "path", key: "Alpha", shapeType: "Line", paint: {stroke: "green", fill: "none"}};
  const viz = {_chartScene: [{type: "group", key: "lines", children: [line]}]};
  const hit = {type: "path", key: "Alpha::hit", shapeType: "Line", paint: {stroke: "transparent", fill: "none"}};
  assert.strictEqual(nodeColor(viz, hit), "green");
  const orphan = {...hit, key: "Missing::hit"};
  assert.strictEqual(nodeColor(viz, orphan), undefined, "no sibling to read");
  assert.strictEqual(nodeColor({}, orphan), undefined, "no scene");
});
