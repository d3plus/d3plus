import assert from "assert";
import {
  applySwarmLanes,
  resolveSwarm,
  swarmHidesAxis,
  swarmPlacements,
} from "../../es/src/charts/Plot/swarm.js";

const circles = (rows, shape = "Circle") => rows.map(d => ({shape, ...d}));

it("resolveSwarm — off unless asked (or a Plot is missing an axis)", () => {
  const rows = circles([
    {x: 1, y: 2},
    {x: 3, y: 4},
  ]);
  assert.strictEqual(resolveSwarm(false, rows), null);
  assert.strictEqual(resolveSwarm(undefined, rows), null);
  assert.strictEqual(
    resolveSwarm("auto", rows),
    null,
    "auto leaves a full scatter alone",
  );
  assert.strictEqual(resolveSwarm(true, []), null);
});

it("resolveSwarm — auto swarms along the only axis that has values", () => {
  assert.deepStrictEqual(
    resolveSwarm("auto", circles([{x: 1}, {x: 5, y: null}])),
    {axis: "x", cross: "y", lanes: false},
  );
  assert.deepStrictEqual(resolveSwarm("auto", circles([{y: 1}, {y: 5}])), {
    axis: "y",
    cross: "x",
    lanes: false,
  });
  assert.strictEqual(
    resolveSwarm("auto", circles([{x: 1}], "Bar")),
    null,
    "only Circle marks",
  );
  assert.strictEqual(
    resolveSwarm("auto", circles([{x: "a"}, {x: "b"}])),
    null,
    "needs numeric values",
  );
});

it("resolveSwarm — true picks a numeric value axis; categories make lanes", () => {
  assert.deepStrictEqual(
    resolveSwarm(
      true,
      circles([
        {x: 1, y: 9},
        {x: 2, y: 8},
      ]),
    ),
    {axis: "x", cross: "y", lanes: false},
    "both numeric: swarm along x, ignore y",
  );
  assert.deepStrictEqual(
    resolveSwarm(
      true,
      circles([
        {x: 1, y: "a"},
        {x: 2, y: "b"},
      ]),
    ),
    {axis: "x", cross: "y", lanes: true},
  );
  assert.deepStrictEqual(
    resolveSwarm(
      true,
      circles([
        {x: "a", y: 1},
        {x: "b", y: 2},
      ]),
    ),
    {axis: "y", cross: "x", lanes: true},
  );
  assert.deepStrictEqual(
    resolveSwarm(
      true,
      circles([{x: new Date(2020, 0, 1)}, {x: new Date(2021, 0, 1)}]),
    ),
    {axis: "x", cross: "y", lanes: false},
    "dates are values",
  );
});

it("resolveSwarm — an explicit axis must hold numbers", () => {
  assert.deepStrictEqual(resolveSwarm("y", circles([{x: 1, y: 2}])), {
    axis: "y",
    cross: "x",
    lanes: false,
  });
  assert.strictEqual(resolveSwarm("y", circles([{x: 1, y: "a"}])), null);
});

it("applySwarmLanes — category strings, or one shared empty lane", () => {
  const lanes = [{y: "a"}, {y: 3}, {y: undefined}];
  applySwarmLanes(lanes, {axis: "x", cross: "y", lanes: true});
  assert.deepStrictEqual(
    lanes.map(d => d.y),
    ["a", "3", ""],
  );
  const single = [{x: 4}, {x: 9}];
  applySwarmLanes(single, {axis: "y", cross: "x", lanes: false});
  assert.deepStrictEqual(
    single.map(d => d.x),
    ["", ""],
  );
});

it("swarmHidesAxis — only a single-lane swarm's cross axis", () => {
  const viz = {_swarm: {axis: "x", cross: "y", lanes: false}};
  assert.strictEqual(swarmHidesAxis(viz, "y"), true);
  assert.strictEqual(swarmHidesAxis(viz, "x"), false);
  assert.strictEqual(
    swarmHidesAxis({_swarm: {axis: "x", cross: "y", lanes: true}}, "y"),
    false,
  );
  assert.strictEqual(swarmHidesAxis({_swarm: null}, "y"), false);
});

/** Linear "axes": x maps 0–100 onto 0–400; lanes sit 100px apart along y. */
const lanePos = {a: 50, b: 150, c: 250};
const axisFns = {
  x: d => (d in lanePos ? lanePos[d] : d * 4),
  y: d => (d in lanePos ? lanePos[d] : 300 - d * 3),
  xRange: [0, 400],
  yRange: [0, 300],
};

it("swarmPlacements — a single lane is centered in the plot and keeps x", () => {
  const viz = {
    _swarm: {axis: "x", cross: "y", lanes: false},
    schema: {swarmConfig: {padding: 1}},
  };
  const values = [10, 10, 10, 60].map((x, i) => ({x, y: "", i}));
  const placed = swarmPlacements(viz, {
    ...axisFns,
    values,
    lanes: [""],
    r: () => 5,
  });
  const p = values.map(d => placed.get(d));
  assert.deepStrictEqual(
    p.map(d => d.x),
    [40, 40, 40, 240],
  );
  assert.strictEqual(p[0].y, 150, "centerline is the middle of the y range");
  assert.deepStrictEqual(
    p
      .map(d => d.y)
      .slice(0, 3)
      .sort((a, b) => a - b),
    [139, 150, 161],
  );
  assert.strictEqual(p[3].y, 150);
  assert.ok(p.every(d => d.r === 5));
});

it("swarmPlacements — one swarm per lane, confined to its band", () => {
  const viz = {
    _swarm: {axis: "x", cross: "y", lanes: true},
    schema: {swarmConfig: {padding: 1, overflow: "shrink"}},
  };
  const values = [];
  ["a", "b", "c"].forEach(lane => {
    for (let k = 0; k < (lane === "b" ? 120 : 4); k++)
      values.push({x: 50 + (k % 7), y: lane});
  });
  const placed = swarmPlacements(viz, {
    ...axisFns,
    values,
    lanes: ["a", "b", "c"],
    r: () => 6,
  });
  const rs = new Set();
  values.forEach(d => {
    const p = placed.get(d);
    rs.add(p.r);
    assert.ok(
      Math.abs(p.y - lanePos[d.y]) + p.r <= 50,
      `${d.y} circle stays in its 100px band`,
    );
  });
  assert.strictEqual(rs.size, 1, "every lane shares one radius");
  assert.ok([...rs][0] < 6, "the crowded lane shrank every circle");
});

it("swarmPlacements — vertical swarms keep y and pack along x", () => {
  const viz = {_swarm: {axis: "y", cross: "x", lanes: true}, schema: {}};
  const values = [
    {x: "a", y: 20},
    {x: "a", y: 20},
    {x: "b", y: 50},
  ];
  const placed = swarmPlacements(viz, {
    ...axisFns,
    values,
    lanes: ["a", "b"],
    r: () => 4,
  });
  const [p0, p1, p2] = values.map(d => placed.get(d));
  assert.strictEqual(p0.y, 240);
  assert.strictEqual(p1.y, 240);
  assert.strictEqual(p0.x, 50);
  assert.strictEqual(Math.abs(p1.x - p0.x), 9, "default padding is 1px");
  assert.deepStrictEqual([p2.x, p2.y], [150, 150]);
});
