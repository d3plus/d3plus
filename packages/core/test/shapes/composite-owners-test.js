import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, Box, Whisker} from "../../index.ts";
import {
  handlerDatum,
  shapeClassTargets,
} from "../../src/charts/viz/shapeClassTargets.ts";
import {stampOwners} from "../../src/shapes/shapeOwners.ts";

useJsdom();

/**
    Composite shapes (Box, Whisker) draw through inner shapes, so each part's
    node carries its inner shape's type. These lock the `owners` stamp each
    composite adds to its parts, and the pointer bridge's dispatch of
    `"<event>.<composite>"` handlers from it.
*/

/** Every leaf node under a scene group. */
function leaves(group) {
  const out = [];
  const walk = n =>
    n.type === "group" ? n.children.forEach(walk) : out.push(n);
  group.children.forEach(walk);
  return out;
}

function boxScene() {
  const data = [
    ...[10, 20, 30, 40, 50, 60, 70, 500].map(y => ({x: 100, y})),
    ...[15, 25, 35, 45, 55].map(y => ({x: 200, y})),
  ];
  const box = new Box().data(data).renderMode("compute");
  box.render();
  return {box, nodes: leaves(box.toScene())};
}

// ---- stampOwners -----------------------------------------------------------

it("stampOwners: climbs a node's datum wrappers to the composite record", () => {
  const record = {id: "r"};
  const wrapped = {data: {data: record}};
  const [direct, nested, group, stranger] = stampOwners(
    [
      {type: "rect", key: "a", datum: record},
      {
        type: "rect",
        key: "b",
        datum: wrapped,
        owners: [{shapeType: "Inner", datum: wrapped, index: 3}],
      },
      {
        type: "group",
        key: "g",
        children: [{type: "circle", key: "c", datum: wrapped}],
      },
      {type: "rect", key: "d", datum: {id: "other"}},
    ],
    "Outer",
    new Map([[record, {datum: record, index: 1}]]),
  );
  assert.deepStrictEqual(direct.owners, [
    {shapeType: "Outer", datum: record, index: 1},
  ]);
  assert.deepStrictEqual(
    nested.owners.map(o => o.shapeType),
    ["Inner", "Outer"],
    "appends after the inner owners",
  );
  assert.strictEqual(
    group.children[0].owners[0].datum,
    record,
    "descends into groups",
  );
  assert.strictEqual(
    stranger.owners,
    undefined,
    "a datum the composite didn't draw gets no owner",
  );
});

it("stampOwners: returns new nodes and survives a self-referencing datum", () => {
  const loop = {};
  loop.data = loop;
  const node = {type: "rect", key: "a", datum: loop};
  const [out] = stampOwners([node], "Box", new Map());
  assert.notStrictEqual(out, node);
  assert.strictEqual(node.owners, undefined, "input untouched");
});

// ---- Box / Whisker stamps --------------------------------------------------

it("Box.toScene: every part names its own box, with the box's record", () => {
  const {box, nodes} = boxScene();
  const records = box._box._data;
  assert.strictEqual(records.length, 2, "two boxes");
  const parts = nodes.filter(n => String(n.key).startsWith("100-"));
  const keys = parts.map(n => n.key);
  for (const key of [
    "100-box",
    "100-median",
    "100-whisker-top",
    "100-whisker-bottom",
    "100-whisker-top-end",
    "100-whisker-bottom-end",
  ])
    assert.ok(keys.includes(key), `${key} drawn`);
  const outlier = parts.find(n => n.shapeType === "Circle");
  assert.ok(outlier, "the 500 outlier is drawn");
  for (const node of parts) {
    const owner = node.owners[node.owners.length - 1];
    assert.strictEqual(
      owner.shapeType,
      "Box",
      `${node.key}: outermost owner is the Box`,
    );
    assert.strictEqual(
      owner.datum,
      records[0],
      `${node.key}: owned by the first box`,
    );
    assert.strictEqual(owner.index, 0);
  }
  const second = nodes.filter(n => String(n.key).startsWith("200-"));
  assert.ok(second.length);
  for (const node of second)
    assert.strictEqual(
      node.owners.at(-1).datum,
      records[1],
      `${node.key}: second box`,
    );
});

it("Box.toScene: whisker parts are owned by their Whisker, then the Box", () => {
  const {nodes} = boxScene();
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]));
  for (const key of ["100-whisker-top", "100-whisker-top-end"]) {
    assert.deepStrictEqual(
      byKey[key].owners.map(o => o.shapeType),
      ["Whisker", "Box"],
      key,
    );
    assert.strictEqual(
      byKey[key].owners[0].datum.id,
      "100-whisker-top",
      `${key}: the top whisker's record`,
    );
  }
  for (const key of ["100-box", "100-median"])
    assert.deepStrictEqual(
      byKey[key].owners.map(o => o.shapeType),
      ["Box"],
      key,
    );
  assert.strictEqual(
    byKey["100-box"].shapeType,
    "Rect",
    "the part keeps its own shapeType",
  );
});

it("Whisker.toScene: a standalone whisker's line and endpoint name it", () => {
  const data = [
    {id: "a", x: 10, y: 10, length: 20},
    {id: "b", x: 50, y: 10, length: 30, orient: "bottom"},
  ];
  const whisker = new Whisker().data(data).renderMode("compute");
  whisker.render();
  const nodes = leaves(whisker.toScene());
  for (const [id, index] of [
    ["a", 0],
    ["b", 1],
  ]) {
    const own = nodes.filter(n => n.key === id || n.key === `${id}-end`);
    assert.deepStrictEqual(
      own.map(n => n.shapeType).sort(),
      ["Line", "Rect"],
      `${id}: line + endpoint`,
    );
    for (const n of own)
      assert.deepStrictEqual(n.owners, [
        {shapeType: "Whisker", datum: data[index], index},
      ]);
  }
});

// ---- dispatch targets ------------------------------------------------------

it("handlerDatum unwraps a wrapped record and falls back to the index", () => {
  const row = {id: "r"};
  assert.deepStrictEqual(handlerDatum({data: row, i: 4}, 9), {
    d: row,
    i: 4,
    x: {data: row, i: 4},
  });
  assert.deepStrictEqual(handlerDatum(row, 9), {d: row, i: 9, x: row});
  assert.deepStrictEqual(handlerDatum(undefined, 2), {
    d: undefined,
    i: 2,
    x: undefined,
  });
});

it("shapeClassTargets: the node's own class, then each owner once, innermost first", () => {
  const own = {d: "row", i: 1, x: "raw"};
  const whisker = {data: "boxRecord", i: 0};
  const box = {data: "merged", i: 7};
  const targets = shapeClassTargets(
    {
      type: "path",
      key: "k",
      shapeType: "Line",
      owners: [
        {shapeType: "Whisker", datum: whisker, index: 0},
        {shapeType: "Line", datum: {}, index: 0},
        {shapeType: "Box", datum: box, index: 2},
      ],
    },
    own,
  );
  assert.deepStrictEqual(targets, [
    {shapeType: "Line", d: "row", i: 1, x: "raw"},
    {shapeType: "Whisker", d: "boxRecord", i: 0, x: whisker},
    {shapeType: "Box", d: "merged", i: 7, x: box},
  ]);
  assert.deepStrictEqual(
    shapeClassTargets({type: "rect", key: "k"}, own),
    [],
    "no shapeType, no owners: nothing",
  );
});

// ---- bridge ----------------------------------------------------------------

function bridgeHandler(chart) {
  chart._chartScene = [];
  chart._featurePanels = [];
  chart._drawSceneToTarget(0);
  return [...chart._sceneRenderer._handlers][0];
}

function syntheticEvent(type, node) {
  return {
    type,
    point: [0, 0],
    pick: node ? {node, datum: node.datum, index: node.index} : null,
    nativeEvent: {},
  };
}

function newChart(fired) {
  const chart = new BarChart()
    .data([{group: "A", x: "Q1", y: 10}])
    .groupBy("group")
    .x("x")
    .y("y")
    .width(400)
    .height(300)
    .select(document.body.appendChild(document.createElement("div")));
  for (const key of [
    "click",
    "click.shape",
    "click.Rect",
    "click.Box",
    "click.Whisker",
    "click.legend",
    "mouseleave.shape",
    "mouseleave.Rect",
    "mouseleave.Box",
    "mouseenter.Box",
  ])
    chart.on(key, (d, i, x) => fired.push({key, d, i, x}));
  return chart;
}

const boxRecord = {id: "alpha", data: {merged: true}, i: 0};
const part = {
  type: "rect",
  key: "alpha-whisker-top-end",
  shapeType: "Rect",
  index: 0,
  datum: {data: {id: "alpha-whisker-top"}, i: 0},
  owners: [
    {
      shapeType: "Whisker",
      datum: {id: "alpha-whisker-top", data: boxRecord, i: 0},
      index: 0,
    },
    {shapeType: "Box", datum: boxRecord, index: 0},
  ],
};

it("bridge fires a part's own class, each owner's class, .shape, and global — once each", () => {
  const fired = [];
  const handler = bridgeHandler(newChart(fired));
  handler(syntheticEvent("click", part));
  assert.deepStrictEqual(
    fired.map(f => f.key),
    ["click.shape", "click.Rect", "click.Whisker", "click.Box", "click"],
  );
  const by = Object.fromEntries(fired.map(f => [f.key, f]));
  assert.strictEqual(
    by["click.Box"].d,
    boxRecord.data,
    "click.Box gets the box's datum",
  );
  assert.strictEqual(by["click.Box"].x, boxRecord);
  assert.strictEqual(
    by["click.Whisker"].d,
    boxRecord,
    "click.Whisker gets its whisker's datum",
  );
  for (const key of ["click.shape", "click.Rect", "click"]) {
    assert.strictEqual(
      by[key].d,
      part.datum.data,
      `${key}: the part's own datum, as before`,
    );
    assert.strictEqual(by[key].x, part.datum);
  }
});

it("bridge fires the owners' mouseleave with the last pick's owner datum", () => {
  const fired = [];
  // Stub the default hover handlers, whose leave schedules a repaint.
  const chart = newChart(fired)
    .on("mouseenter", () => {})
    .on("mouseleave", () => {});
  const handler = bridgeHandler(chart);
  handler(syntheticEvent("mouseenter", part));
  fired.length = 0;
  handler(syntheticEvent("mouseleave", null));
  assert.deepStrictEqual(
    fired.map(f => f.key),
    ["mouseleave.shape", "mouseleave.Rect", "mouseleave.Box"],
  );
  assert.strictEqual(fired[2].d, boxRecord.data);
});

it("bridge fires no owner classes for a legend node", () => {
  const fired = [];
  const handler = bridgeHandler(newChart(fired));
  handler(syntheticEvent("click", {...part, interactionGroup: "legend"}));
  assert.deepStrictEqual(
    fired.map(f => f.key),
    ["click.legend", "click"],
  );
});
