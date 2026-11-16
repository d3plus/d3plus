import {afterEach, beforeEach, it, vi} from "vitest";
import assert from "assert";
import {
  FORCE_LIVE_DEFAULT,
  containLive,
  dragHeat,
  fitDataPositions,
  graphKey,
  linkSpacing,
  liveForceOn,
  neighborIds,
  networkLive,
  networkSimulation,
  placeNetworkNodes,
  redrawPositions,
  reheat,
  rememberPositions,
  rescalePositions,
  scheduleFrame,
  scheduleRedraw,
  seedPositions,
  stopLive,
  stopLiveLoop,
} from "../../internal.ts";

/**
    Network's remembered layout and live force simulation: where nodes start
    on each draw (kept, entering beside a neighbor, placed by the data), the
    pixel-space simulation, and the frame loop that ticks it.
*/

const node = (id, x, y, r = 5) => ({id, x, y, r});
const link = (a, b) => ({source: {id: a}, target: {id: b}});

/** Stubs the browser globals the live loop reads, restoring them after. */
let frames, cancelled;
beforeEach(() => {
  frames = new Map();
  cancelled = [];
  let next = 1;
  vi.stubGlobal("requestAnimationFrame", fn => {
    frames.set(next, fn);
    return next++;
  });
  vi.stubGlobal("cancelAnimationFrame", id => {
    cancelled.push(id);
    frames.delete(id);
  });
  vi.stubGlobal("document", {});
});
afterEach(() => vi.unstubAllGlobals());

/** A stand-in chart with the parts the live layout reads. */
const fakeViz = (schema = {}) => ({
  ctx: {},
  schema: {forceLive: FORCE_LIVE_DEFAULT, ...schema},
  _sceneRenderer: {},
  drawn: 0,
  _drawSceneToTarget() {
    this.drawn++;
  },
});

it("rescalePositions: keeps positions in an unchanged area", () => {
  const p = new Map([["a", {x: 10, y: 20}]]);
  const out = rescalePositions(
    p,
    {width: 100, height: 100},
    {width: 100, height: 100},
  );
  assert.deepStrictEqual(out.get("a"), {x: 10, y: 20});
  assert.notStrictEqual(out, p, "a copy");
});

it("rescalePositions: scales evenly by the smaller ratio about the centers", () => {
  const p = new Map([
    ["a", {x: 0, y: 0}],
    ["b", {x: 100, y: 50}],
  ]);
  const out = rescalePositions(
    p,
    {width: 100, height: 100},
    {width: 400, height: 200},
  );
  // Ratio min(4, 2) = 2, about (50, 50) → (200, 100).
  assert.deepStrictEqual(out.get("a"), {x: 100, y: 0});
  assert.deepStrictEqual(out.get("b"), {x: 300, y: 100});
});

it("neighborIds: both ends of each link, skipping loops and loose ends", () => {
  const out = neighborIds([
    link("a", "b"),
    link("a", "c"),
    link("c", "c"),
    {source: {id: "a"}},
  ]);
  assert.deepStrictEqual(out.get("a"), ["b", "c"]);
  assert.deepStrictEqual(out.get("b"), ["a"]);
  assert.deepStrictEqual(out.get("c"), ["a"]);
});

it("seedPositions: without remembered nodes, every node keeps its own place", () => {
  const nodes = [node("a", 1, 2), node("b", 3, 4)];
  const {positions, entered} = seedPositions(nodes, [], new Map());
  assert.deepStrictEqual(positions.get("a"), {x: 1, y: 2});
  assert.deepStrictEqual(positions.get("b"), {x: 3, y: 4});
  assert.deepStrictEqual(entered, []);
});

it("seedPositions: remembered nodes stay, new ones enter beside a neighbor", () => {
  const nodes = [node("a", 0, 0), node("b", 500, 500), node("c", 900, 900)];
  const previous = new Map([["a", {x: 100, y: 100}]]);
  const {positions, entered} = seedPositions(
    nodes,
    [link("a", "b"), link("b", "c")],
    previous,
  );
  assert.deepStrictEqual(positions.get("a"), {x: 100, y: 100});
  // b enters beside a (the first around it, at angle 0), 3 radii out.
  assert.deepStrictEqual(positions.get("b"), {x: 115, y: 100});
  // c enters beside b, which entered first.
  const c = positions.get("c");
  assert.ok(Math.abs(Math.hypot(c.x - 115, c.y - 100) - 15) < 1e-9);
  assert.deepStrictEqual(entered, ["b", "c"]);
});

it("seedPositions: nodes around one neighbor turn by the golden angle", () => {
  const nodes = [node("a", 0, 0), node("b", 0, 0), node("c", 0, 0)];
  const {positions} = seedPositions(
    nodes,
    [link("a", "b"), link("a", "c")],
    new Map([["a", {x: 0, y: 0}]]),
  );
  const angle = p => Math.atan2(p.y, p.x);
  assert.ok(
    Math.abs(angle(positions.get("c")) - angle(positions.get("b"))) > 1,
    "spread apart",
  );
});

it("seedPositions: a new node with no placed neighbor keeps its own place", () => {
  const nodes = [node("a", 0, 0), node("z", 42, 7)];
  const {positions, entered} = seedPositions(
    nodes,
    [],
    new Map([["a", {x: 5, y: 5}]]),
  );
  assert.deepStrictEqual(positions.get("z"), {x: 42, y: 7});
  assert.deepStrictEqual(entered, []);
});

it("graphKey: changes with the nodes or the links, not the positions", () => {
  const a = graphKey([node("a", 0, 0), node("b", 1, 1)], [link("a", "b")]);
  const moved = graphKey([node("a", 9, 9), node("b", 1, 1)], [link("a", "b")]);
  const relinked = graphKey(
    [node("a", 0, 0), node("b", 1, 1)],
    [link("b", "a")],
  );
  const loose = graphKey(
    [node("a", 0, 0), node("b", 1, 1)],
    [link("a", "b"), {source: {id: "a"}}],
  );
  assert.strictEqual(a, moved);
  assert.notStrictEqual(a, relinked);
  assert.strictEqual(a, loose, "a link with a loose end is left out");
});

it("fitDataPositions: fits the coordinates into the area, the same scale on both axes", () => {
  const out = fitDataPositions(
    new Map([
      ["a", [0, 0]],
      ["b", [2, 1]],
    ]),
    {width: 220, height: 220},
    10,
  );
  // Room 200 × 200; the x span (2) sets the scale: 100 per unit.
  assert.deepStrictEqual(out.get("a"), {x: 10, y: 60});
  assert.deepStrictEqual(out.get("b"), {x: 210, y: 160});
});

it("fitDataPositions: a lone node sits in the middle", () => {
  const out = fitDataPositions(
    new Map([["a", [5, 5]]]),
    {width: 100, height: 60},
    10,
  );
  assert.deepStrictEqual(out.get("a"), {x: 50, y: 30});
  assert.strictEqual(
    fitDataPositions(new Map(), {width: 1, height: 1}, 0).size,
    0,
  );
});

it("linkSpacing: the median link length, or four times the median radius", () => {
  const nodes = [node("a", 0, 0), node("b", 3, 4), node("c", 0, 10)];
  assert.strictEqual(
    linkSpacing(nodes, [link("a", "b"), link("a", "c"), link("b", "b")]),
    10,
  );
  assert.strictEqual(linkSpacing(nodes, []), 20);
});

it("networkSimulation: a stopped simulation that pushes overlapping nodes apart", () => {
  const nodes = [
    {id: "a", x: 50, y: 50, rx: 10, ry: 10},
    {id: "b", x: 51, y: 50, rx: 10, ry: 10},
  ];
  const sim = networkSimulation(
    nodes,
    [{source: "a", target: "b"}],
    {width: 100, height: 100},
    30,
  );
  for (const name of ["link", "charge", "collide", "x", "y"])
    assert.ok(sim.force(name), name);
  for (let i = 0; i < 50; i++) sim.tick();
  assert.ok(Math.hypot(nodes[0].x - nodes[1].x, nodes[0].y - nodes[1].y) > 20);
});

it("containLive: keeps free nodes inside, leaves fixed ones, centers oversized ones", () => {
  const nodes = [
    {id: "a", x: -50, y: 500, rx: 5, ry: 5},
    {id: "b", x: -50, y: -50, rx: 5, ry: 5, fx: -50, fy: -50},
    {id: "c", x: 10, y: 10, rx: 80, ry: 5},
  ];
  containLive(nodes, {width: 100, height: 100}, 3);
  assert.deepStrictEqual([nodes[0].x, nodes[0].y], [8, 92]);
  assert.deepStrictEqual([nodes[1].x, nodes[1].y], [-50, -50]);
  assert.strictEqual(nodes[2].x, 50);
});

it("liveForceOn: up to forceLive nodes, unless off, server-side, or reduced motion", () => {
  assert.ok(liveForceOn(fakeViz(), 10));
  assert.ok(liveForceOn(fakeViz(), FORCE_LIVE_DEFAULT));
  assert.ok(!liveForceOn(fakeViz(), FORCE_LIVE_DEFAULT + 1));
  assert.ok(!liveForceOn(fakeViz(), 0));
  assert.ok(liveForceOn(fakeViz({forceLive: true}), 1e6));
  assert.ok(!liveForceOn(fakeViz({forceLive: false}), 10));
  assert.ok(!liveForceOn(fakeViz({forceLive: 5}), 10));
  assert.ok(!liveForceOn(fakeViz({reducedMotion: true}), 10));
  assert.ok(!liveForceOn({...fakeViz(), _ssr: true}, 10));
  vi.stubGlobal("requestAnimationFrame", undefined);
  assert.ok(!liveForceOn(fakeViz(), 10));
});

it("networkLive: one state per chart", () => {
  const viz = fakeViz();
  const state = networkLive(viz);
  assert.strictEqual(networkLive(viz), state);
  assert.ok(state.positions instanceof Map && state.pinned instanceof Map);
});

/** Graph nodes for `placeNetworkNodes`, at their precomputed places. */
const graph = ids => {
  const nodes = ids.map((id, i) => ({id, x: 100 + i * 50, y: 100, r: 5}));
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const links = ids
    .slice(1)
    .map((id, i) => ({source: byId[ids[i]], target: byId[id], size: 1}));
  return {nodes, links};
};
const bounds = {width: 400, height: 300};

it("placeNetworkNodes: a static first draw keeps the precomputed layout", () => {
  const viz = fakeViz({forceLive: false});
  const {nodes, links} = graph(["a", "b", "c"]);
  assert.strictEqual(
    placeNetworkNodes(viz, nodes, links, bounds, new Map()),
    false,
  );
  assert.deepStrictEqual([nodes[0].x, nodes[0].y], [100, 100]);
  assert.strictEqual(networkLive(viz).sim, undefined);
  assert.strictEqual(frames.size, 0);
});

it("placeNetworkNodes: a static change keeps the nodes it drew and settles the rest at once", () => {
  const viz = fakeViz({forceLive: false});
  const first = graph(["a", "b"]);
  placeNetworkNodes(viz, first.nodes, first.links, bounds, new Map());
  rememberPositions(viz, first.nodes);
  networkLive(viz).positions.set("a", {x: 60, y: 60});
  const next = graph(["a", "b", "c"]);
  assert.strictEqual(
    placeNetworkNodes(viz, next.nodes, next.links, bounds, new Map()),
    true,
  );
  const [a, , c] = next.nodes;
  // Seeded where it was drawn, then settled: it stays near.
  assert.ok(
    Math.hypot(a.x - 60, a.y - 60) < 60,
    `a near (60,60): ${a.x},${a.y}`,
  );
  assert.ok(Math.hypot(c.x - 200, c.y - 100) > 1, "c entered elsewhere");
  assert.strictEqual(a.fx, a.x);
  assert.strictEqual(frames.size, 0, "no live loop");
});

it("placeNetworkNodes: a live first draw starts the simulation and asks for a frame", () => {
  const viz = fakeViz();
  const {nodes, links} = graph(["a", "b", "c"]);
  assert.strictEqual(
    placeNetworkNodes(viz, nodes, links, bounds, new Map()),
    true,
  );
  const state = networkLive(viz);
  assert.ok(state.sim);
  assert.strictEqual(state.sim.alpha(), 0.5);
  assert.strictEqual(frames.size, 1);
  assert.deepStrictEqual(
    state.sim.nodes().map(n => n.id),
    ["a", "b", "c"],
  );
});

it("placeNetworkNodes: a frame draw reads the simulated positions", () => {
  const viz = fakeViz();
  const {nodes, links} = graph(["a", "b"]);
  placeNetworkNodes(viz, nodes, links, bounds, new Map());
  const state = networkLive(viz);
  const sim = state.sim;
  state.positions.set("a", {x: 7, y: 8});
  state.frameDraw = true;
  const again = graph(["a", "b"]);
  placeNetworkNodes(viz, again.nodes, again.links, bounds, new Map());
  assert.strictEqual(state.sim, sim, "the simulation keeps running");
  assert.deepStrictEqual([again.nodes[0].x, again.nodes[0].y], [7, 8]);
});

it("placeNetworkNodes: pinned and data-placed nodes are fixed in the simulation", () => {
  const viz = fakeViz();
  networkLive(viz).pinned.set("b", {x: 30, y: 40});
  const {nodes, links} = graph(["a", "b", "c"]);
  placeNetworkNodes(
    viz,
    nodes,
    links,
    bounds,
    new Map([
      ["a", [0, 0]],
      ["c", [1, 0]],
    ]),
  );
  const sim = networkLive(viz).sim;
  const [a, b, c] = sim.nodes();
  assert.deepStrictEqual([b.fx, b.fy], [30, 40]);
  assert.ok(a.fx < c.fx, "data x order kept");
  assert.strictEqual(a.fy, c.fy);
  assert.deepStrictEqual([nodes[1].x, nodes[1].y], [30, 40]);
});

it("placeNetworkNodes: every node placed by the data runs no simulation", () => {
  const viz = fakeViz();
  const {nodes, links} = graph(["a", "b"]);
  placeNetworkNodes(
    viz,
    nodes,
    links,
    bounds,
    new Map([
      ["a", [0, 0]],
      ["b", [1, 0]],
    ]),
  );
  assert.strictEqual(networkLive(viz).sim, undefined);
});

it("placeNetworkNodes: small multiples lay each panel out afresh", () => {
  const viz = {...fakeViz(), _facetStep: "panel"};
  const {nodes, links} = graph(["a", "b"]);
  assert.strictEqual(
    placeNetworkNodes(viz, nodes, links, bounds, new Map()),
    false,
  );
  assert.strictEqual(viz.ctx.networkLive, undefined);
});

it("rememberPositions: keeps where each node was drawn", () => {
  const viz = fakeViz();
  rememberPositions(viz, [node("a", 1, 2)]);
  assert.deepStrictEqual(networkLive(viz).positions.get("a"), {x: 1, y: 2});
  assert.deepStrictEqual(networkLive(viz).laid.get("a"), {x: 1, y: 2});
  networkLive(viz).custom = true;
  rememberPositions(viz, [node("a", 5, 6)]);
  assert.deepStrictEqual(
    networkLive(viz).laid.get("a"),
    {x: 1, y: 2},
    "a moved layout keeps the laid-out places",
  );
});

it("scheduleFrame / stopLiveLoop / stopLive: one pending frame, cancelled on stop", () => {
  const viz = fakeViz();
  scheduleFrame(viz);
  scheduleFrame(viz);
  assert.strictEqual(frames.size, 1);
  const id = networkLive(viz).frame;
  stopLiveLoop(viz);
  assert.deepStrictEqual(cancelled, [id]);
  assert.strictEqual(networkLive(viz).frame, undefined);
  scheduleFrame(viz);
  networkLive(viz).sim = {};
  networkLive(viz).clickTimer = setTimeout(() => assert.fail("click"), 0);
  stopLive(viz);
  assert.strictEqual(networkLive(viz).sim, undefined);
  assert.strictEqual(frames.size, 0);
});

it("the live loop ticks, repaints, and stops once the simulation cools", () => {
  const viz = fakeViz();
  let relayouts = 0;
  networkLive(viz).relayout = () => {
    relayouts++;
    assert.ok(networkLive(viz).frameDraw, "a frame draw");
  };
  const {nodes, links} = graph(["a", "b", "c"]);
  placeNetworkNodes(viz, nodes, links, bounds, new Map());
  let ticks = 0;
  while (frames.size && ticks < 1000) {
    const [id, fn] = [...frames][0];
    frames.delete(id);
    fn();
    ticks++;
  }
  const sim = networkLive(viz).sim;
  assert.ok(ticks > 10 && ticks < 1000, `ran ${ticks} frames`);
  assert.ok(sim.alpha() < sim.alphaMin(), "cooled");
  assert.strictEqual(relayouts, ticks);
  assert.strictEqual(viz.drawn, ticks);
  assert.strictEqual(networkLive(viz).frameDraw, false);
});

it("the live loop waits out an animated transition", () => {
  const viz = {...fakeViz(), _transitionEndsAt: Date.now() + 60000};
  networkLive(viz).relayout = () => assert.fail("no relayout yet");
  const {nodes, links} = graph(["a", "b"]);
  placeNetworkNodes(viz, nodes, links, bounds, new Map());
  const [id, fn] = [...frames][0];
  frames.delete(id);
  fn();
  assert.strictEqual(frames.size, 1, "asks again");
  assert.strictEqual(viz.drawn, 0);
});

it("the live loop stops without a scene", () => {
  const viz = fakeViz();
  const {nodes, links} = graph(["a", "b"]);
  placeNetworkNodes(viz, nodes, links, bounds, new Map());
  viz._sceneRenderer = undefined;
  const [id, fn] = [...frames][0];
  frames.delete(id);
  fn();
  assert.strictEqual(frames.size, 0);
});

it("redrawPositions: re-lays out and repaints at once", () => {
  const viz = fakeViz();
  let relayouts = 0;
  networkLive(viz).relayout = () => relayouts++;
  redrawPositions(viz);
  assert.deepStrictEqual([relayouts, viz.drawn], [1, 1]);
  viz._sceneRenderer = undefined;
  redrawPositions(viz);
  assert.deepStrictEqual([relayouts, viz.drawn], [1, 1]);
});

it("dragHeat / reheat: heat the simulation and ask for frames", () => {
  const viz = fakeViz();
  const {nodes, links} = graph(["a", "b"]);
  placeNetworkNodes(viz, nodes, links, bounds, new Map());
  const sim = networkLive(viz).sim;
  sim.alpha(0);
  stopLiveLoop(viz);
  dragHeat(viz, true);
  assert.strictEqual(sim.alphaTarget(), 0.3);
  assert.ok(sim.alpha() >= 0.3);
  assert.strictEqual(frames.size, 1);
  dragHeat(viz, false);
  assert.strictEqual(sim.alphaTarget(), 0);
  sim.alpha(0);
  reheat(viz);
  assert.strictEqual(sim.alpha(), 0.3);
});

it("reheat / scheduleRedraw without a simulation repaint the remembered positions", () => {
  const viz = fakeViz({forceLive: false});
  let relayouts = 0;
  networkLive(viz).relayout = () => relayouts++;
  reheat(viz);
  assert.strictEqual(relayouts, 1);
  scheduleRedraw(viz);
  scheduleRedraw(viz);
  assert.strictEqual(frames.size, 1, "coalesced to one frame");
  [...frames.values()][0]();
  assert.strictEqual(relayouts, 2);
});
