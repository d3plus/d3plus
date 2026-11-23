import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  applySizeRatio,
  containerRoom,
  ratioHeight,
  ratioSize,
  sizeRatioMoved,
} from "../../src/charts/viz/sizeRatio.ts";
import {
  chartWidth,
  letterboxOffset,
  placeCanvas,
  placeMessage,
  setLetterbox,
} from "../../src/charts/viz/letterbox.ts";

useJsdom();

/**
    `sizeRatio`: the height a ratio gives a width, and when it sets a chart's
    height (only a height the chart has not been given).
*/

it("ratioHeight: the width divided by the ratio", () => {
  assert.strictEqual(ratioHeight(16 / 9, 1600), 900);
  assert.strictEqual(ratioHeight(1, 500), 500);
  assert.strictEqual(ratioHeight(0.5, 300), 600);
});

it("ratioHeight: undefined for an unusable ratio or width", () => {
  for (const ratio of [undefined, 0, -1, NaN, Infinity, "16/9"])
    assert.strictEqual(ratioHeight(ratio, 500), undefined, String(ratio));
  for (const width of [undefined, 0, -10, NaN])
    assert.strictEqual(ratioHeight(2, width), undefined, String(width));
});

it("applySizeRatio sets a height the chart has not been given", () => {
  const viz = new Treemap().sizeRatio(2);
  viz.schema.width = 800;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 400);
  assert.strictEqual(viz._sizeRatioHeight, true);
  viz.schema.width = 600;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 300, "follows the width");
});

it("applySizeRatio leaves an explicit height alone", () => {
  const viz = new Treemap().sizeRatio(2).height(250);
  viz.schema.width = 800;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 250);
  assert.strictEqual(viz._sizeRatioHeight, false);
});

it("applySizeRatio yields to a height set after the ratio applied", () => {
  const viz = new Treemap().sizeRatio(2);
  viz.schema.width = 800;
  applySizeRatio(viz);
  viz.height(250);
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 250);
});

/**
    A chart in a container whose measured height JSDOM (which has no layout)
    fakes: `fixed` for a container with a height of its own, otherwise the
    sum of its in-flow children's heights, as a container without one.
*/
function inContainer(fixed) {
  const parent = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  parent.appendChild(svg);
  document.body.appendChild(parent);
  parent.style.padding = "5px";
  parent.getBoundingClientRect = () => ({
    height:
      10 +
      (fixed ??
        Array.from(parent.children)
          .filter(c => c !== svg)
          .reduce((sum, c) => sum + parseFloat(c.style.height || 0), 0)),
  });
  const viz = new Treemap().sizeRatio(2);
  viz._select = {node: () => svg};
  return {parent, viz};
}

it("containerRoom: a container with a height of its own keeps it", () => {
  const {parent, viz} = inContainer(180);
  assert.strictEqual(containerRoom(viz, 400), 180);
  assert.strictEqual(parent.children.length, 1, "the probe is removed");
});

it("containerRoom: a container without one grows to the height asked for", () => {
  const {viz} = inContainer();
  assert.strictEqual(containerRoom(viz, 400), 400);
});

it("containerRoom: undefined without a layout or a container", () => {
  const viz = new Treemap();
  assert.strictEqual(containerRoom(viz, 400), undefined);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(document.createElement("div")).appendChild(svg);
  viz._select = {node: () => svg};
  assert.strictEqual(containerRoom(viz, 400), undefined, "JSDOM measures 0");
});

it("ratioSize: the ratio's size, narrowed inside a container with a lower height", () => {
  assert.deepStrictEqual(ratioSize(inContainer(180).viz, 2, 800), {
    width: 360,
    height: 180,
  });
  const full = {width: 800, height: 400};
  assert.deepStrictEqual(ratioSize(inContainer(500).viz, 2, 800), full);
  assert.deepStrictEqual(ratioSize(inContainer().viz, 2, 800), full);
  assert.deepStrictEqual(ratioSize(new Treemap(), 2, 800), full);
  assert.strictEqual(ratioSize(inContainer(180).viz, 0, 800), undefined);
});

/** A chart in `inContainer(fixed)` that measured its width as `width`. */
function measured(fixed, width) {
  const box = inContainer(fixed);
  Object.assign(box.viz, {_autoWidth: true, _measuredWidth: width});
  box.viz.schema.width = width;
  return box;
}

it("applySizeRatio letterboxes a measured width in a container with a lower height", () => {
  const {viz} = measured(180, 800);
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 180);
  assert.strictEqual(chartWidth(viz), 360, "draws narrower");
  assert.strictEqual(viz.schema.width, 800, "its width keeps the container's");
  assert.strictEqual(viz._sizeRatioHeight, true);
  assert.strictEqual(letterboxOffset(viz), 220);
  applySizeRatio(viz);
  assert.strictEqual(chartWidth(viz), 360, "stable on the next render");
  assert.strictEqual(viz.schema.width, 800);
});

it("applySizeRatio letterboxes an explicit width inside its own frame, leaving the width set", () => {
  const {viz} = inContainer(180);
  viz.width(800);
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 180);
  assert.strictEqual(chartWidth(viz), 360);
  assert.strictEqual(viz.width(), 800, "the getter returns the width set");
  assert.strictEqual(viz.config().width, 800, "and so does config()");
  assert.strictEqual(letterboxOffset(viz), 220);
  applySizeRatio(viz);
  assert.strictEqual(chartWidth(viz), 360, "stable on the next render");
  viz.height(300);
  applySizeRatio(viz);
  assert.strictEqual(chartWidth(viz), 800, "an explicit height: no letterbox");
  assert.strictEqual(letterboxOffset(viz), 0);
});

it("applySizeRatio fills a tall enough container, an explicit width as before", () => {
  const explicit = inContainer(500).viz;
  explicit.width(800);
  applySizeRatio(explicit);
  assert.strictEqual(explicit.schema.height, 400);
  assert.strictEqual(chartWidth(explicit), 800);
  assert.strictEqual(explicit._letterbox, undefined);

  const {viz} = measured(500, 800);
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 400);
  assert.strictEqual(chartWidth(viz), 800);
  assert.strictEqual(viz._letterbox, undefined);
});

it("setting the width again ends a letterbox until the next render re-fits it", () => {
  const {viz} = inContainer(180);
  viz.width(800);
  applySizeRatio(viz);
  viz.width(500);
  assert.strictEqual(letterboxOffset(viz), 0);
  assert.strictEqual(chartWidth(viz), 500);
  applySizeRatio(viz);
  assert.strictEqual(chartWidth(viz), 360, "re-fit inside the new 500px");
  assert.strictEqual(letterboxOffset(viz), 70);
  assert.strictEqual(viz.width(), 500);
});

it("setLetterbox records the frame and centered offset, or clears it", () => {
  const viz = new Treemap();
  viz.schema.width = 500;
  setLetterbox(viz, 300, 500);
  assert.deepStrictEqual(viz._letterbox, {width: 500, offset: 100, drawn: 300});
  assert.strictEqual(chartWidth(viz), 300);
  setLetterbox(viz, 500, 500);
  assert.strictEqual(viz._letterbox, undefined);
  assert.strictEqual(chartWidth(viz), 500);
  setLetterbox(viz, undefined, 500);
  assert.strictEqual(viz._letterbox, undefined);
});

it("chartWidth is the width set, or measured, when there is no letterbox", () => {
  const viz = new Treemap().width(640);
  assert.strictEqual(chartWidth(viz), 640);
  viz._letterbox = {width: 900, offset: 50, drawn: 800};
  assert.strictEqual(chartWidth(viz), 640, "a stale letterbox is ignored");
});

it("placeCanvas centers a letterboxed chart's canvas", () => {
  const {viz} = measured(180, 800);
  const canvas = document.createElement("canvas");
  viz._sceneRenderer = {elements: () => [canvas]};
  applySizeRatio(viz);
  placeCanvas(viz);
  assert.strictEqual(canvas.style.marginLeft, "220px");
  assert.strictEqual(canvas.style.marginRight, "220px");
  viz._letterbox = undefined;
  placeCanvas(viz);
  assert.strictEqual(canvas.style.marginLeft, "");
  assert.strictEqual(canvas.style.marginRight, "");
});

it("placeMessage moves the message and its mask over a letterboxed chart", () => {
  const {parent, viz} = measured(180, 800);
  Object.defineProperty(parent, "clientWidth", {value: 810});
  applySizeRatio(viz);
  const message = {
    elem: select(document.body).append("div"),
    mask: select(document.body).append("div"),
  };
  viz._messageClass = message;
  placeMessage(viz);
  for (const sel of [message.elem, message.mask]) {
    assert.strictEqual(sel.style("left"), "225px", "padding + offset");
    assert.strictEqual(sel.style("right"), "225px");
  }
  viz.width(900);
  message.elem.style("left", "0px");
  placeMessage(viz);
  assert.strictEqual(message.elem.style("left"), "0px", "no letterbox: kept");
});

it("sizeRatioMoved: only when the size the ratio fits to changes", () => {
  const fixed = measured(180, 800);
  applySizeRatio(fixed.viz);
  assert.strictEqual(sizeRatioMoved(fixed.viz), false);
  fixed.parent.getBoundingClientRect = () => ({height: 130});
  assert.strictEqual(sizeRatioMoved(fixed.viz), true, "the container shrank");

  const auto = measured(undefined, 800);
  applySizeRatio(auto.viz);
  assert.strictEqual(
    sizeRatioMoved(auto.viz),
    false,
    "a container the chart props open measures the same again",
  );
});
