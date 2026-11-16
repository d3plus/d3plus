import {it} from "vitest";
import assert from "assert";
import {forceLayout, forceLayoutTicks, layoutRotation} from "../../internal.ts";

/**
    Network's precomputed force layout lays the nodes out by position:
    symmetric graphs spread out instead of stacking, linked nodes settle
    about one link length apart, and the layout is turned level (a hull
    with no room for a rectangle isn't turned, rather than failing).
*/

const graph = (count, ends) => {
  const nodes = Array.from({length: count}, (_, i) => ({id: `n${i}`}));
  const links = ends.map(([s, t, size = 1]) => ({
    source: nodes[s],
    target: nodes[t],
    size,
  }));
  return {nodes, links};
};

const dist = (a, b) => Math.hypot(a.fx - b.fx, a.fy - b.fy);
const closest = nodes => {
  let d = Infinity;
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      d = Math.min(d, dist(nodes[i], nodes[j]));
  return d;
};

it("forceLayout: a star's leaves ring the hub, evenly far", () => {
  const {nodes, links} = graph(
    9,
    Array.from({length: 8}, (_, i) => [0, i + 1]),
  );
  forceLayout(nodes, links);
  const [hub, ...leaves] = nodes;
  const reach = leaves.map(n => dist(n, hub));
  assert.ok(Math.max(...reach) / Math.min(...reach) < 1.2, `${reach}`);
  const mx = leaves.reduce((s, n) => s + n.fx, 0) / leaves.length;
  const my = leaves.reduce((s, n) => s + n.fy, 0) / leaves.length;
  assert.ok(Math.hypot(mx - hub.fx, my - hub.fy) < Math.min(...reach) / 4);
  assert.ok(closest(nodes) > Math.min(...reach) / 3, "leaves apart");
});

it("forceLayout: a binary tree keeps every node clear of the rest", () => {
  const {nodes, links} = graph(
    15,
    Array.from({length: 14}, (_, i) => [Math.floor(i / 2), i + 1]),
  );
  forceLayout(nodes, links);
  const lengths = links.map(l => dist(l.source, l.target));
  const median = [...lengths].sort((a, b) => a - b)[7];
  assert.ok(closest(nodes) > median / 2, `${closest(nodes)} vs ${median}`);
  assert.ok(
    nodes.every(n => Number.isFinite(n.fx) && Number.isFinite(n.fy)),
    "finite",
  );
});

it("forceLayout: heavier links pull their ends closer", () => {
  // Two hubs, each with a heavy and a light leaf.
  const {nodes, links} = graph(6, [
    [0, 1, 10],
    [0, 2, 1],
    [3, 4, 10],
    [3, 5, 1],
    [0, 3, 5],
  ]);
  forceLayout(nodes, links);
  assert.ok(dist(nodes[0], nodes[1]) < dist(nodes[0], nodes[2]));
  assert.ok(dist(nodes[3], nodes[4]) < dist(nodes[3], nodes[5]));
});

it("forceLayout: the same graph lays out the same, leaving the inputs clean", () => {
  const make = () =>
    graph(4, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ]);
  const a = make();
  const b = make();
  forceLayout(a.nodes, a.links);
  forceLayout(b.nodes, b.links);
  assert.deepStrictEqual(
    a.nodes.map(n => [n.fx, n.fy]),
    b.nodes.map(n => [n.fx, n.fy]),
  );
  assert.deepStrictEqual(Object.keys(a.nodes[0]).sort(), ["fx", "fy", "id"]);
  assert.ok(a.links[0].source === a.nodes[0], "links keep their nodes");
});

it("forceLayout: two linked nodes sit side by side", () => {
  const {nodes, links} = graph(2, [[0, 1]]);
  forceLayout(nodes, links);
  assert.ok(Math.abs(nodes[0].fy - nodes[1].fy) < 1e-9);
  assert.ok(Math.abs(nodes[0].fx - nodes[1].fx) > 1);
});

it("layoutRotation: turns two points level about their middle", () => {
  const {angle, cx, cy} = layoutRotation([
    [0, 0],
    [10, 10],
  ]);
  assert.strictEqual(angle, 45);
  assert.deepStrictEqual([cx, cy], [5, 5]);
  assert.deepStrictEqual(
    layoutRotation([
      [3, 3],
      [3, 3],
    ]),
    {angle: 0, cx: 0, cy: 0},
  );
});

it("layoutRotation: no turn for points on one line, or too few", () => {
  const none = {angle: 0, cx: 0, cy: 0};
  assert.deepStrictEqual(
    layoutRotation([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
    none,
  );
  assert.deepStrictEqual(
    layoutRotation([
      [1, 1],
      [1, 1],
      [1, 1],
    ]),
    none,
  );
  assert.deepStrictEqual(layoutRotation([[4, 2]]), none);
  assert.deepStrictEqual(layoutRotation([]), none);
});

it("layoutRotation: a long, thin tilted layout lies level", () => {
  // A 100 × 10 rectangle turned 30°.
  const t = Math.PI / 6;
  const turn = ([x, y]) => [
    x * Math.cos(t) - y * Math.sin(t),
    x * Math.sin(t) + y * Math.cos(t),
  ];
  const points = [
    [0, 0],
    [100, 0],
    [100, 10],
    [0, 10],
    [50, 5],
  ].map(turn);
  const {angle} = layoutRotation(points);
  const level = ((angle % 180) + 180) % 180;
  assert.ok(Math.abs(level - 30) <= 5, `angle ${angle}`);
});

it("forceLayoutTicks: 300 ticks, fewer (down to 100) for large networks", () => {
  assert.strictEqual(forceLayoutTicks(0), 300);
  assert.strictEqual(forceLayoutTicks(77), 300);
  assert.strictEqual(forceLayoutTicks(500), 300);
  assert.strictEqual(forceLayoutTicks(1000), 150);
  assert.strictEqual(forceLayoutTicks(1500), 100);
  assert.strictEqual(forceLayoutTicks(5000), 100);
});
