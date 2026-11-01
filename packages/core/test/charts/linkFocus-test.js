import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";

import {
  bindSvgBackgroundClick,
  clearLinkFocus,
  focusLink,
  installFocusBackgroundClick,
  linkEndsBox,
  linkFocusId,
} from "../../src/charts/features/linkFocus.ts";
import {
  makeLinkDatum,
  publishLinkGraph,
} from "../../src/charts/features/linkInteraction.ts";

useJsdom();

const nodeData = [{id: "a"}, {id: "b"}, {id: "c"}];
const ends = nodeData.map((data, i) => ({data, i, id: data.id}));

/** A stand-in chart that logs its hover, active, zoom, and tooltip calls. */
function fakeViz(extra = {}) {
  const log = [];
  const viz = {
    log,
    ctx: {},
    schema: {width: 400, height: 300},
    _margin: {top: 20, right: 10, bottom: 30, left: 40},
    _drawLabel: d => d.id,
    _tooltipClass: {
      data: rows => (log.push(["tooltip", rows.length]), viz._tooltipClass),
      render: () => undefined,
    },
    hover: p => log.push(["hover", p]),
    active: p => {
      viz._active = p;
      log.push(["active", typeof p]);
    },
    ...extra,
  };
  return viz;
}

/** Links a→b and b→c on `viz`, published. */
function links(viz) {
  const out = [
    makeLinkDatum({}, ends[0], ends[1], 0),
    makeLinkDatum({}, ends[1], ends[2], 1),
  ];
  publishLinkGraph(viz, out, ends);
  return out;
}

it("linkFocusId names a link by its index", () => {
  const [ab, bc] = links(fakeViz());
  assert.strictEqual(linkFocusId(ab), "link:0");
  assert.strictEqual(linkFocusId(bc), "link:1");
});

it("linkEndsBox spans the laid-out nodes at a link's ends", () => {
  const viz = fakeViz();
  const [ab] = links(viz);
  viz.ctx.nodeLookup = {
    a: {x: 10, y: 50, r: 5},
    b: {x: 100, y: 20, r: 10},
  };
  assert.deepStrictEqual(linkEndsBox(viz, ab), [
    [5, 10],
    [110, 55],
  ]);
  viz.ctx.nodeLookup = {a: 0, b: 1};
  assert.strictEqual(linkEndsBox(viz, ab), null, "ends without positions");
  viz.ctx.nodeLookup = undefined;
  assert.strictEqual(linkEndsBox(viz, ab), null);
  assert.strictEqual(linkEndsBox(viz, {id: "a"}), null, "not a link");
});

it("focusLink activates the link and its ends, and a second click clears", () => {
  const viz = fakeViz();
  const [ab, bc] = links(viz);
  focusLink(viz, ab);
  assert.strictEqual(viz._focus, "link:0");
  assert.strictEqual(viz._active(ab, 0), true);
  assert.strictEqual(viz._active(bc, 1), false);
  assert.strictEqual(viz._active(nodeData[1], 1), true, "its target");
  assert.strictEqual(viz._active(nodeData[2], 2), false);
  assert.deepStrictEqual(viz.log.slice(0, 2), [
    ["tooltip", 0],
    ["hover", false],
  ]);
  focusLink(viz, ab);
  assert.strictEqual(viz._focus, undefined, "toggled off");
  assert.strictEqual(viz._active, false);
});

it("focusLink zooms to the box on a chart that zooms", () => {
  const zooms = [];
  const node = {};
  const viz = fakeViz({
    _zoomToBounds: b => zooms.push(b),
    _container: {node: () => node},
    _chartTransform: {x: 40, y: 20},
  });
  const [ab] = links(viz);
  focusLink(viz, ab, {
    box: [
      [0, 0],
      [10, 20],
    ],
  });
  assert.deepStrictEqual(zooms, [
    [
      [40, 20],
      [50, 40],
    ],
  ]);
  focusLink(viz, ab);
  assert.deepStrictEqual(zooms[1], null, "clearing resets the zoom");
  // Without a box, or on a chart that doesn't zoom, nothing zooms.
  focusLink(viz, ab);
  assert.strictEqual(zooms.length, 2);
  focusLink(fakeViz(), links(fakeViz())[0], {
    box: [
      [0, 0],
      [1, 1],
    ],
  });
});

it("clearLinkFocus reports whether there was a focus", () => {
  const viz = fakeViz();
  assert.strictEqual(clearLinkFocus(viz), false);
  viz._focus = "link:3";
  assert.strictEqual(clearLinkFocus(viz), true);
  assert.strictEqual(viz._focus, undefined);
  assert.strictEqual(viz._active, false);
});

it("installFocusBackgroundClick clears the focus on a click in the chart area", () => {
  const viz = fakeViz();
  installFocusBackgroundClick(viz);
  viz._focus = "link:0";
  viz._backgroundClick([30, 100]);
  assert.strictEqual(viz._focus, "link:0", "left of the chart area");
  viz._backgroundClick([100, 10]);
  assert.strictEqual(viz._focus, "link:0", "above the chart area");
  viz._backgroundClick([100, 100]);
  assert.strictEqual(viz._focus, undefined);
});

it("bindSvgBackgroundClick routes clicks on the outer svg itself, once", () => {
  const ns = "http://www.w3.org/2000/svg";
  const outer = document.createElementNS(ns, "svg");
  const mark = document.createElementNS(ns, "rect");
  outer.appendChild(mark);
  document.body.appendChild(outer);
  const points = [];
  const viz = fakeViz({
    _select: {node: () => outer},
    _backgroundClick: p => points.push(p),
  });
  bindSvgBackgroundClick(viz);
  bindSvgBackgroundClick(viz);
  const click = (el, x, y) =>
    el.dispatchEvent(
      new window.MouseEvent("click", {bubbles: true, clientX: x, clientY: y}),
    );
  click(outer, 30, 40);
  click(mark, 50, 60);
  assert.deepStrictEqual(points, [[30, 40]], "once, and not over a mark");
  bindSvgBackgroundClick(fakeViz());
});
