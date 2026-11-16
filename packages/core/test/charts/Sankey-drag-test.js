import {afterEach, beforeEach, it, vi} from "vitest";
import assert from "assert";
import {
  clampTop,
  dragShare,
  layOutCircular,
  sankeyDragState,
  sankeyNodeDrag,
  sankeyNodeId,
  sankeyRelink,
  shiftSankeyNodes,
  stopSankeyDrag,
} from "../../internal.ts";
import {sankey} from "../../src/charts/Sankey/sankeyLayout.ts";

/**
    Dragging Sankey nodes up and down their columns: the offsets a drag
    leaves, how the layout applies them (links re-stacked, inside the
    extent), and when they are forgotten.
*/

let frames;
beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", fn => frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
});
afterEach(() => vi.unstubAllGlobals());

/** A laid-out three-node Sankey: a and b both flow into c. */
function laidOut() {
  const nodes = [{id: "a"}, {id: "b"}, {id: "c"}];
  const links = [
    {source: 0, target: 2, value: 5},
    {source: 1, target: 2, value: 5},
  ];
  sankey().nodes(nodes).links(links).nodeWidth(10).size([200, 100])();
  return {nodes, links};
}

const extent = [
  [0, 0],
  [200, 100],
];

/** A stand-in Sankey with the inputs its offsets were made on. */
const fakeSankey = () => ({
  ctx: {},
  schema: {nodes: [], links: []},
  _data: [],
  _sceneRenderer: {},
  drawn: 0,
  _drawSceneToTarget() {
    this.drawn++;
  },
});

it("sankeyNodeId: a node's shape or label key gives its id", () => {
  const ids = new Set(["a", "1"]);
  assert.strictEqual(sankeyNodeId({key: "sankey-Rect-a"}, ids), "a");
  assert.strictEqual(sankeyNodeId({key: "sankey-Circle-1"}, ids), "1");
  assert.strictEqual(sankeyNodeId({key: "sankey-label-a"}, ids), "a");
  assert.strictEqual(sankeyNodeId({key: "sankey-link-a-c"}, ids), null);
  assert.strictEqual(sankeyNodeId({key: "sankey-Rect-z"}, ids), null);
});

it("clampTop: keeps a node between the extent's top and bottom", () => {
  assert.strictEqual(clampTop(-5, 20, 0, 100), 0);
  assert.strictEqual(clampTop(90, 20, 0, 100), 80);
  assert.strictEqual(clampTop(30, 20, 0, 100), 30);
});

it("dragShare: the offset a drag leaves, as a share of the extent, held inside it", () => {
  const laid = {y0: 40, height: 20, top: 0, bottom: 100};
  assert.strictEqual(dragShare(laid, 0, 10), 0.1);
  assert.strictEqual(dragShare(laid, 0.1, 10), 0.2);
  assert.strictEqual(dragShare(laid, 0, 500), 0.4, "stops at the bottom");
  assert.strictEqual(dragShare(laid, 0, -500), -0.4, "stops at the top");
});

it("sankeyDragState: one state per chart", () => {
  const viz = fakeSankey();
  const state = sankeyDragState(viz);
  assert.strictEqual(sankeyDragState(viz), state);
  assert.ok(state.offsets instanceof Map);
});

it("sankeyRelink: re-stacks the links at a node after its sources move", () => {
  const {nodes} = laidOut();
  const [a, b, c] = nodes;
  assert.ok(c.targetLinks[0].source === a, "a's flow on top");
  // Move a below b.
  a.y0 += 80;
  a.y1 += 80;
  sankeyRelink(nodes);
  assert.ok(c.targetLinks[0].source === b, "b's flow on top now");
  assert.ok(c.targetLinks[0].y1 < c.targetLinks[1].y1);
  assert.strictEqual(a.sourceLinks[0].y0, a.y0 + a.sourceLinks[0].width / 2);
});

it("shiftSankeyNodes: moves dragged nodes by their offsets and records where each was laid out", () => {
  const viz = fakeSankey();
  const {nodes} = laidOut();
  shiftSankeyNodes(viz, nodes, extent);
  const state = sankeyDragState(viz);
  const a0 = nodes[0].y0;
  assert.deepStrictEqual(state.laid.get("a"), {
    y0: a0,
    height: nodes[0].y1 - nodes[0].y0,
    top: 0,
    bottom: 100,
  });
  state.offsets.set("a", 0.1);
  const again = laidOut().nodes;
  shiftSankeyNodes(viz, again, extent);
  assert.ok(Math.abs(again[0].y0 - (a0 + 10)) < 1e-9);
  assert.strictEqual(
    again[0].sourceLinks[0].y0,
    again[0].y0 + again[0].sourceLinks[0].width / 2,
    "its link follows",
  );
});

it("shiftSankeyNodes: forgets the offsets once the data, nodes, or links change", () => {
  const viz = fakeSankey();
  shiftSankeyNodes(viz, laidOut().nodes, extent);
  sankeyDragState(viz).offsets.set("a", 0.1);
  shiftSankeyNodes(viz, laidOut().nodes, extent);
  assert.strictEqual(sankeyDragState(viz).offsets.size, 1);
  viz.schema.links = [];
  shiftSankeyNodes(viz, laidOut().nodes, extent);
  assert.strictEqual(sankeyDragState(viz).offsets.size, 0);
});

it("sankeyNodeDrag: a drag sets the node's offset and repaints on the next frame", () => {
  const viz = fakeSankey();
  viz.ctx.nodeLookup = {a: 0, b: 1, c: 2};
  let relayouts = 0;
  sankeyDragState(viz).relayout = () => relayouts++;
  shiftSankeyNodes(viz, laidOut().nodes, extent);
  const drag = sankeyNodeDrag(viz);
  assert.strictEqual(drag.nodeAt({key: "sankey-Rect-a"}), "a");
  drag.start("a", [5, 20]);
  drag.move("a", [9, 30]);
  drag.move("a", [9, 40]);
  drag.end("a", [9, 40]);
  assert.strictEqual(sankeyDragState(viz).offsets.get("a"), 0.2);
  assert.strictEqual(frames.length, 1, "one frame");
  frames[0]();
  assert.deepStrictEqual([relayouts, viz.drawn], [1, 1]);
  // A second drag starts from the offset the first left.
  drag.start("a", [5, 40]);
  drag.move("a", [5, 30]);
  assert.ok(Math.abs(sankeyDragState(viz).offsets.get("a") - 0.1) < 1e-9);
});

it("stopSankeyDrag: cancels a pending repaint", () => {
  const viz = fakeSankey();
  sankeyDragState(viz).frame = 3;
  stopSankeyDrag(viz);
  assert.strictEqual(sankeyDragState(viz).frame, undefined);
});

it("layOutCircular: `settled` runs once on the final extent", () => {
  const nodes = [{}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 4},
    {source: 1, target: 2, value: 4},
  ];
  const layout = sankey().nodes(nodes).links(links).nodeWidth(10);
  const runs = [];
  const settled = [];
  layOutCircular({
    run: e => (runs.push(e), layout.extent(e)()),
    settled: e => settled.push(e),
    nodes,
    links,
    circular: [{source: 2, target: 0, value: 1, datum: "c→a", i: 2}],
    width: 400,
    height: 300,
    padding: 8,
  });
  assert.deepStrictEqual(settled, [runs[runs.length - 1]]);
  const once = [];
  layOutCircular({
    run: e => layout.extent(e)(),
    settled: e => once.push(e),
    nodes,
    links,
    circular: [],
    width: 400,
    height: 300,
    padding: 8,
  });
  assert.deepStrictEqual(once, [
    [
      [0, 0],
      [400, 300],
    ],
  ]);
});
