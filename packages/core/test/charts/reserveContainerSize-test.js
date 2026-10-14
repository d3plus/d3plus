import assert from "assert";
import it from "../jsdom.js";
import {reserveContainerSize} from "../../es/src/charts/viz/reserveContainerSize.js";

/**
    `reserveContainerSize(viz)` keeps one invisible, in-flow spacer next to the
    chart's absolutely positioned svg, sized to the chart's explicit width and
    height, and removes it when neither is explicit or the canvas renderer
    (whose `<canvas>` is in flow) is active.
*/

/** A container holding a chart svg, and a stand-in viz pointing at it. */
function setup(state = {}) {
  const container = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);
  document.body.appendChild(container);
  const viz = {
    _select: {node: () => svg},
    _renderer: "svg",
    schema: {},
    ...state,
  };
  return {container, svg, viz};
}

const spacers = container =>
  Array.from(container.children).filter(c =>
    c.classList.contains("d3plus-viz-spacer"),
  );

it("adds an invisible spacer before the svg sized to an explicit height", () => {
  const {container, svg, viz} = setup({
    schema: {width: 640, height: 200},
    _autoWidth: true,
  });
  reserveContainerSize(viz);
  const [spacer] = spacers(container);
  assert.ok(spacer, "a spacer is added");
  assert.strictEqual(spacer.nextSibling, svg);
  assert.strictEqual(spacer.style.height, "200px");
  assert.strictEqual(
    spacer.style.width,
    "0px",
    "a measured width is not reserved",
  );
  assert.strictEqual(spacer.style.visibility, "hidden");
  assert.strictEqual(spacer.style.pointerEvents, "none");
  assert.strictEqual(spacer.getAttribute("aria-hidden"), "true");
});

it("reserves an explicit width", () => {
  const {container, viz} = setup({
    schema: {width: 300, height: 500},
    _autoHeight: true,
  });
  reserveContainerSize(viz);
  const [spacer] = spacers(container);
  assert.strictEqual(spacer.style.width, "300px");
  assert.strictEqual(spacer.style.height, "0px");
});

it("updates the one spacer on a new size", () => {
  const {container, viz} = setup({schema: {height: 200}});
  reserveContainerSize(viz);
  viz.schema.height = 120;
  reserveContainerSize(viz);
  const found = spacers(container);
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].style.height, "120px");
});

it("removes the spacer when no size is explicit", () => {
  const {container, viz} = setup({schema: {height: 200}});
  reserveContainerSize(viz);
  viz.schema = {width: 640, height: 480};
  viz._autoWidth = viz._autoHeight = true;
  reserveContainerSize(viz);
  assert.strictEqual(spacers(container).length, 0);
});

it("removes the spacer for the canvas renderer", () => {
  const {container, viz} = setup({schema: {height: 200}});
  reserveContainerSize(viz);
  viz._renderer = "canvas";
  reserveContainerSize(viz);
  assert.strictEqual(spacers(container).length, 0);
});

it("leaves a chart svg nested in another svg alone", () => {
  const outer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  outer.appendChild(svg);
  document.body.appendChild(outer);
  reserveContainerSize({
    _select: {node: () => svg},
    _renderer: "svg",
    schema: {height: 200},
  });
  assert.strictEqual(outer.children.length, 1);
});
