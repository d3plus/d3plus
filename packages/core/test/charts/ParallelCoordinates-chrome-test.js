import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {ParallelCoordinates} from "../../index.ts";
import {axisTooltipTarget} from "../../src/components/Axis/axisTooltipTargets.ts";
import {layoutAxes} from "../../src/charts/ParallelCoordinates/axes.ts";
import {chromeNode} from "../../src/charts/ParallelCoordinates/chrome.ts";
import {titleNodes} from "../../src/charts/ParallelCoordinates/titles.ts";

useJsdom();

/** A text node drawing `drawn`. */
const text = (key, drawn, extra = {}) => ({
  type: "text",
  key,
  lines: [{text: drawn, x: 0, y: 0, width: 10}],
  ...extra,
});

/** Every node of a scene subtree, the subtree's root first. */
const flat = node => [node, ...(node.children ?? []).flatMap(flat)];

/** The nodes of `nodes`' subtrees stamped with a tooltip target for `part`, one per target. */
function targets(nodes, part) {
  const found = new Map();
  for (const node of nodes.flatMap(flat)) {
    const target = axisTooltipTarget(node);
    if (target && target.part === part) found.set(target, node);
  }
  return [...found.entries()];
}

it("ParallelCoordinates chrome: chromeNode keeps only a stamped label in hit-testing, and no data", () => {
  const target = {
    part: "tick",
    value: "a",
    index: 0,
    text: "a",
    truncated: false,
    option: "note",
  };
  const stamped = text("a", "a", {datum: {id: "a"}, axisTooltip: target});
  const plain = text("b", "b", {datum: {id: "b"}, index: 1});
  const bar = {type: "line", key: "bar", points: [], datum: {id: "bar"}};
  const axis = {
    type: "group",
    key: "pc-axis-x",
    datum: {id: "axis"},
    children: [bar, {type: "group", key: "labels", children: [stamped, plain]}],
  };
  const chrome = chromeNode(axis);
  const nodes = flat(chrome);

  assert.deepStrictEqual(
    nodes.map(n => [n.key, n.interactive, n.interactionGroup]),
    [
      ["pc-axis-x", undefined, "axis"],
      ["bar", false, "axis"],
      ["labels", undefined, "axis"],
      ["a", undefined, "axis"],
      ["b", false, "axis"],
    ],
    "a group is never inert itself: its leaves are, all but the stamped one",
  );
  assert.ok(
    nodes.every(n => !("datum" in n) && !("index" in n)),
    "no node holds data",
  );
  assert.strictEqual(axisTooltipTarget(nodes[3]), target, "the target is kept");
  assert.notStrictEqual(chrome, axis);
  assert.deepStrictEqual(plain, text("b", "b", {datum: {id: "b"}, index: 1}));
  assert.deepStrictEqual(bar.datum, {id: "bar"}, "the scene given is kept");
});

const LONG_TITLE =
  "A very long dimension title that will not fit in the width it is given";
const style = {fontSize: 12, textAnchor: "middle", maxLines: 1};
const box = (key, title) => ({
  key,
  text: title,
  x: 0,
  y: 0,
  width: 80,
  height: 20,
});
const titles = [
  box("a", "Speed"),
  box("b", "Power"),
  box("c", LONG_TITLE),
  box("d", LONG_TITLE),
];

it("ParallelCoordinates titles: titleNodes stamps the titles with a tooltip to show", () => {
  const note = () => "note";
  const nodes = titleNodes(
    titles,
    style,
    "en-US",
    new Map([
      ["b", note],
      ["d", false],
    ]),
  );
  assert.strictEqual(nodes.length, 4);
  const stamped = targets(nodes, "title");
  assert.deepStrictEqual(
    stamped.map(([t]) => [t.value, t.text, t.truncated, t.option]),
    [
      ["Power", "Power", false, note],
      [LONG_TITLE, LONG_TITLE, true, undefined],
    ],
    "an option's, and a cut title's whole text; none for a whole title or `false`",
  );
  assert.ok(
    stamped.every(([, node]) => node.interactive !== false),
    "a stamped title takes the pointer",
  );
  const leaves = nodes.flatMap(flat).filter(n => n.type !== "group");
  assert.strictEqual(
    leaves.filter(n => n.interactive !== false).length,
    stamped.length,
    "every other node is inert",
  );
  assert.ok(
    nodes
      .flatMap(flat)
      .every(n => n.interactionGroup === "axis" && !("datum" in n)),
    "titles are chrome, with no data",
  );
});

it("ParallelCoordinates titles: titleNodes without tooltips keeps every title inert", () => {
  const nodes = titleNodes(titles, style, "en-US");
  assert.strictEqual(nodes.length, 4);
  assert.deepStrictEqual(targets(nodes, "title"), []);
  assert.ok(
    nodes
      .flatMap(flat)
      .filter(n => n.type !== "group")
      .every(n => n.interactive === false && n.interactionGroup === "axis"),
  );
  assert.deepStrictEqual(titleNodes([], style, "en-US", new Map()), []);
});

const rows = [
  {id: "r0", kind: "Ann", x: 0, y: 10},
  {id: "r1", kind: "Bee", x: 5, y: 20},
  {id: "r2", kind: "Sea", x: 10, y: 30},
];

/** A chart's axes laid out with `config`, and its dimensions. */
function layout(config, orient = "horizontal") {
  const dims = [
    {
      key: "kind",
      title: "Kind",
      type: "categorical",
      domain: ["Ann", "Bee", "Sea"],
      reverse: !!config.dimensionConfig?.kind?.reverse,
    },
    {key: "x", title: "X", type: "numeric", domain: [0, 10], reverse: false},
    {key: "y", title: "Y", type: "numeric", domain: [10, 30], reverse: false},
  ];
  const viz = new ParallelCoordinates().config({data: rows, ...config});
  return layoutAxes(viz, dims, 600, 300, orient).nodes;
}

/** The subtree of the axis drawn for dimension `key`. */
const axisOf = (nodes, key) => nodes.find(n => n.key === `pc-axis-${key}`);

it("ParallelCoordinates axes: layoutAxes draws plain axes and titles as inert chrome", () => {
  for (const orient of ["horizontal", "vertical"]) {
    const nodes = layout({}, orient);
    assert.strictEqual(nodes.length, 6, "an axis and a title per dimension");
    assert.ok(
      nodes.every(n => n.z === undefined),
      `${orient}: in paint order, under a hovered line`,
    );
    const all = nodes.flatMap(flat);
    assert.ok(
      all.every(n => n.interactionGroup === "axis" && !("datum" in n)),
      `${orient}: chrome, with no data`,
    );
    assert.ok(
      all.every(n =>
        n.type === "group"
          ? n.interactive !== false
          : n.interactive === false && !axisTooltipTarget(n),
      ),
      `${orient}: every leaf is inert, no group is`,
    );
  }
});

it("ParallelCoordinates axes: layoutAxes takes tickTooltip and titleTooltip from axisConfig, then dimensionConfig", () => {
  const shared = () => "shared";
  const own = () => "own";
  const nodes = layout({
    axisConfig: {tickTooltip: shared, titleTooltip: "every title"},
    dimensionConfig: {
      x: {tickTooltip: own, titleTooltip: "x's title"},
      y: {tickTooltip: false, titleTooltip: false},
    },
  });
  const option = key =>
    Array.from(
      new Set(targets([axisOf(nodes, key)], "tick").map(([t]) => t.option)),
    );
  assert.deepStrictEqual(option("kind"), [shared], "axisConfig's");
  assert.deepStrictEqual(option("x"), [own], "the dimension's own");
  assert.deepStrictEqual(option("y"), [], "`false` stamps no label");
  assert.deepStrictEqual(
    targets(nodes, "title").map(([t]) => [t.value, t.option]),
    [
      ["Kind", "every title"],
      ["X", "x's title"],
    ],
  );
  for (const [, node] of [
    ...targets(nodes, "tick"),
    ...targets(nodes, "title"),
  ])
    assert.notStrictEqual(node.interactive, false, "a stamped label is live");
  const y = flat(axisOf(nodes, "y")).filter(n => n.type !== "group");
  assert.ok(
    y.length && y.every(n => n.interactive === false),
    "an axis with no tooltip is inert throughout",
  );
});

it("ParallelCoordinates axes: a tick's index is its place in the dimension's domain", () => {
  const index = (config, key, orient) =>
    targets(
      [
        axisOf(
          layout({axisConfig: {tickTooltip: "t"}, ...config}, orient),
          key,
        ),
      ],
      "tick",
    )
      .map(([t]) => [+t.value || t.value, t.index])
      .sort((a, b) => a[1] - b[1]);
  const kinds = [
    ["Ann", 0],
    ["Bee", 1],
    ["Sea", 2],
  ];
  const labels = {dimensionConfig: {x: {labels: [0, 5, 10]}}};
  const values = [
    [0, 0],
    [5, 1],
    [10, 2],
  ];
  for (const orient of ["horizontal", "vertical"]) {
    assert.deepStrictEqual(index({}, "kind", orient), kinds, orient);
    assert.deepStrictEqual(
      index({dimensionConfig: {kind: {reverse: true}}}, "kind", orient),
      kinds,
      `${orient}: a reversed axis keeps each category's index`,
    );
    assert.deepStrictEqual(
      index(labels, "x", orient),
      values,
      `${orient}: a value axis counts from its lowest value`,
    );
  }
});
