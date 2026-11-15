import {it} from "vitest";
import assert from "assert";
import {lab} from "d3-color";
import {
  SET_SEPARATOR,
  blendColors,
  blendedFill,
  coversSets,
  mergeSets,
  rowSets,
  rowSize,
  setList,
  setRow,
  sourceRow,
  vennRows,
} from "../../src/charts/Venn/vennData.ts";
import {
  VENN_PADDING,
  applyVennLayout,
  exclusiveCounts,
  setOrder,
  vennCircles,
  vennRegions,
} from "../../src/charts/Venn/applyLayout.ts";
import {
  enclosingSets,
  sameAreaGroups,
} from "../../src/charts/Venn/vennRegions.ts";
import {
  LABEL_FONT_MAX,
  MIN_LABEL_ROOM,
  regionLineBoxes,
  regionLines,
  vennEmit,
} from "../../src/charts/Venn/emit.ts";
import {vennTooltipRows} from "../../src/charts/Venn/tooltip.ts";
import {vennDef} from "../../src/charts/Venn/index.ts";
import {circleBounds} from "../../src/charts/Venn/vennFit.ts";

const rows = () => [
  {sets: ["A"], size: 10},
  {sets: ["B"], size: 8},
  {sets: ["A", "B"], size: 3},
];

function mockViz(schema = {}, data = rows()) {
  return {
    schema: {
      width: 420,
      height: 320,
      sets: d => d.sets,
      value: d => d.size,
      proportional: true,
      labelCounts: "exclusive",
      locale: "en-US",
      translate: s => s,
      valueFormat: v => `${v}`,
      shapeConfig: {fill: d => (d.sets.length === 1 ? d.sets[0] : "x")},
      ...schema,
    },
    _margin: {top: 10, bottom: 10, left: 10, right: 10},
    _filteredData: data,
    _hidden: [],
    _solo: [],
    _drawLabel: d => d.sets.join(SET_SEPARATOR),
    ctx: {},
  };
}

it("Venn data: setList reads arrays, lone names, and nothing else", () => {
  assert.deepStrictEqual(setList(["A", "B", "A"]), ["A", "B"]);
  assert.deepStrictEqual(setList("A"), ["A"]);
  assert.deepStrictEqual(setList(3), ["3"]);
  assert.deepStrictEqual(setList(undefined), []);
  assert.deepStrictEqual(setList([null, {}, "C"]), ["C"]);
});

it("Venn data: mergeSets keeps a list, even for one set", () => {
  assert.deepStrictEqual(
    mergeSets([{s: ["A"]}, {s: ["A"]}], d => d.s),
    ["A"],
  );
  assert.deepStrictEqual(
    mergeSets([{s: ["A", "B"]}, {s: "C"}], d => d.s),
    ["A", "B", "C"],
  );
});

it("Venn data: sourceRow unwraps label and merged-row wrappers", () => {
  const row = {sets: ["A"]};
  assert.strictEqual(
    sourceRow({__d3plus__: true, data: {__d3plus__: true, data: row}}),
    row,
  );
  assert.strictEqual(sourceRow(row), row);
});

it("Venn data: rowSets and rowSize read through the chart's accessors", () => {
  const viz = mockViz();
  assert.deepStrictEqual(rowSets(viz, {sets: ["B", "A"]}, 0), ["B", "A"]);
  assert.deepStrictEqual(
    rowSets(viz, {__d3plus__: true, data: {sets: "A"}}, 0),
    ["A"],
  );
  assert.deepStrictEqual(rowSets(viz, undefined, 0), []);
  assert.deepStrictEqual(rowSets({schema: {}}, {sets: ["A"]}, 0), []);
  assert.strictEqual(rowSize(viz, {size: "12"}, 0), 12);
  assert.ok(Number.isNaN(rowSize(viz, {}, 0)));
  assert.ok(Number.isNaN(rowSize({schema: {}}, {size: 1}, 0)));
});

it("Venn data: coversSets is true when every inner set is named", () => {
  assert.ok(coversSets(["A", "B", "C"], ["C", "A"]));
  assert.ok(!coversSets(["A"], ["A", "B"]));
  assert.ok(!coversSets(["A"], []));
});

it("Venn data: setRow finds the drawn row for one set alone", () => {
  const viz = mockViz();
  assert.deepStrictEqual(setRow(viz, "B"), {row: viz._filteredData[1], i: 1});
  assert.strictEqual(setRow(viz, "Z"), undefined);
});

it("Venn data: blendColors averages in CIELAB and skips what doesn't parse", () => {
  const mix = lab(blendColors(["#404040", "#c0c0c0"]));
  const dark = lab("#404040");
  const light = lab("#c0c0c0");
  assert.ok(Math.abs(mix.l - (dark.l + light.l) / 2) < 1);
  assert.ok(Math.abs(mix.a) < 1 && Math.abs(mix.b) < 1, "stays gray");
  const purple = lab(blendColors(["#ff0000", "#0000ff"]));
  assert.ok(purple.b < lab("#ff0000").b, "bluer than red");
  assert.strictEqual(blendColors(["#123456"]), "#123456");
  assert.strictEqual(blendColors(["nope", 4]), undefined);
  assert.strictEqual(blendColors(["#ffffff", "nope"]), "#ffffff");
});

it("Venn data: blendedFill blends an overlap's sets and leaves single sets and colorScales alone", () => {
  const viz = mockViz();
  const fill = d => ({A: "#ff0000", B: "#0000ff"})[d.sets[0]] ?? "#000000";
  const wrapped = blendedFill(viz, fill);
  assert.strictEqual(wrapped({sets: ["A"]}, 0), "#ff0000");
  assert.strictEqual(
    wrapped({sets: ["A", "B"]}, 2),
    blendColors(["#ff0000", "#0000ff"]),
  );
  // A set without a row of its own takes its assigned color.
  const unknown = wrapped({sets: ["A", "Q"]}, 2);
  assert.ok(/^#[0-9a-f]{6}$/.test(unknown));
  const scaled = blendedFill(mockViz({colorScale: () => 1}), () => "#abcdef");
  assert.strictEqual(scaled({sets: ["A", "B"]}, 2), "#abcdef");
});

it("Venn data: vennRows lists single sets for the legend and drops hidden sets' regions", () => {
  const viz = mockViz();
  const all = viz._filteredData;
  assert.deepStrictEqual(
    vennRows(viz, all, all).map(d => d.sets.join()),
    ["A", "B"],
  );
  viz._hidden = ["B"];
  assert.deepStrictEqual(
    vennRows(viz, all.slice(), all).map(d => d.sets.join()),
    ["A"],
  );
});

it("Venn data: vennRows keeps the overlaps among soloed sets, except across small multiples", () => {
  const viz = mockViz();
  const all = viz._filteredData;
  viz._solo = ["A", "B"];
  const drawn = all.filter(d => d.sets.length === 1);
  assert.deepStrictEqual(
    vennRows(viz, drawn, all).map(d => d.sets.join()),
    ["A", "B", "A,B"],
  );
  viz._solo = ["A"];
  assert.deepStrictEqual(
    vennRows(viz, [all[0]], all).map(d => d.sets.join()),
    ["A"],
  );
  viz._solo = ["A", "B"];
  viz.schema.facet = () => 1;
  assert.deepStrictEqual(
    vennRows(viz, drawn, all).map(d => d.sets.join()),
    ["A", "B"],
  );
});

it("Venn layout: setOrder lists single sets in data order, then sets only overlaps name", () => {
  assert.deepStrictEqual(
    setOrder([
      {sets: ["C", "D"], size: 1},
      {sets: ["B"], size: 1},
      {sets: ["A"], size: 1},
    ]),
    ["B", "A", "C", "D"],
  );
});

it("Venn layout: vennCircles fits the circles inside the padding, remembers a proportional layout, and falls back to the classic one", () => {
  const viz = mockViz();
  const areas = rows();
  const box = {width: 400, height: 300};
  const fitted = vennCircles(viz, areas, true, box);
  const b = circleBounds(Object.values(fitted));
  assert.ok(b.x0 >= VENN_PADDING - 1e-9 && b.x1 <= 400 - VENN_PADDING + 1e-9);
  assert.ok(b.y0 >= VENN_PADDING - 1e-9 && b.y1 <= 300 - VENN_PADDING + 1e-9);
  const cached = viz.ctx.vennCache;
  assert.ok(cached && cached.key);
  vennCircles(viz, areas, true, box);
  assert.strictEqual(viz.ctx.vennCache, cached, "the same areas reuse it");
  const unsized = vennCircles(
    viz,
    [
      {sets: ["A"], size: NaN},
      {sets: ["B"], size: NaN},
    ],
    true,
    box,
  );
  assert.strictEqual(unsized.A.radius, unsized.B.radius);
  const classic = vennCircles(viz, areas, false, box);
  assert.strictEqual(classic.A.radius, classic.B.radius);
});

it("Venn layout: vennRegions orders single sets first and computes exclusive counts", () => {
  const viz = mockViz({}, [
    {sets: ["A", "B"], size: 3},
    {sets: ["A"], size: 10},
    {sets: ["B"], size: 8},
    {sets: ["B", "A"], size: 99},
    {sets: [], size: 1},
    {sets: ["A", "Z"], size: 1},
  ]);
  const {regions, circles} = vennRegions(viz, viz._filteredData, {
    width: 400,
    height: 300,
  });
  assert.deepStrictEqual(Object.keys(circles).sort(), ["A", "B"]);
  assert.deepStrictEqual(
    regions.map(r => r.sets.join()),
    ["A", "B", "A,B"],
  );
  assert.deepStrictEqual(
    regions.map(r => r.exclusive),
    [7, 5, 3],
  );
  assert.ok(regions.every(r => r.d.startsWith("M") && !r.covered));
  assert.ok(regions.every(r => r.label.margin > 0));
});

it("Venn layout: a set inside another hands its label to the overlap that covers it", () => {
  const viz = mockViz({}, [
    {sets: ["A"], size: 10},
    {sets: ["B"], size: 3},
    {sets: ["A", "B"], size: 3},
  ]);
  const {regions} = vennRegions(viz, viz._filteredData, {
    width: 400,
    height: 300,
  });
  const [a, b, ab] = regions;
  assert.ok(!a.covered && b.covered && !ab.covered);
  assert.strictEqual(ab.named.data, b.data);
  assert.deepStrictEqual(regionLines(viz, ab), ["B", "3"]);
});

it("Venn layout: enclosingSets and sameAreaGroups group regions covering one area", () => {
  const circles = {
    A: {x: 0, y: 0, radius: 5},
    B: {x: 1, y: 0, radius: 1},
    C: {x: 4, y: 0, radius: 3},
  };
  assert.deepStrictEqual(enclosingSets(["B"], circles), ["A", "B"]);
  assert.deepStrictEqual(enclosingSets(["C"], circles), ["C"]);
  const groups = sameAreaGroups(
    [{sets: ["A"]}, {sets: ["B"]}, {sets: ["C"]}, {sets: ["A", "B"]}],
    circles,
  );
  assert.deepStrictEqual(
    groups.map(g => g.map(r => r.sets.join())),
    [["A"], ["B", "A,B"], ["C"]],
  );
});

it("Venn layout: applyVennLayout stores circles, regions, and exclusive counts", () => {
  const viz = mockViz();
  const {shapeData} = applyVennLayout({viz});
  assert.strictEqual(shapeData.length, 3);
  assert.strictEqual(viz.ctx.vennRegions, shapeData);
  assert.deepStrictEqual(Object.keys(viz.ctx.vennCircles), ["A", "B"]);
  assert.strictEqual(exclusiveCounts(viz).get(viz._filteredData[0]), 7);
  assert.strictEqual(exclusiveCounts(viz), exclusiveCounts(viz));
});

it("Venn emit: regionLines names single sets and counts exclusively or inclusively", () => {
  const viz = mockViz();
  const region = {
    sets: ["A"],
    data: {sets: ["A"]},
    i: 0,
    value: 10,
    exclusive: 7,
  };
  assert.deepStrictEqual(regionLines(viz, region), ["A", "7"]);
  const pair = {
    sets: ["A", "B"],
    data: {sets: ["A", "B"]},
    i: 2,
    value: 3,
    exclusive: 3,
  };
  assert.deepStrictEqual(regionLines(viz, pair), ["3"]);
  viz.schema.labelCounts = "inclusive";
  assert.deepStrictEqual(regionLines(viz, region), ["A", "10"]);
  assert.deepStrictEqual(regionLines(viz, {...pair, value: NaN}), []);
});

it("Venn emit: regionLineBoxes stacks one box per line inside the room", () => {
  const boxes = regionLineBoxes(100, 50, 40, 2);
  assert.strictEqual(boxes.length, 2);
  const height = boxes[0].height * 2;
  assert.strictEqual(height, Math.min(40 * 1.2, 2 * LABEL_FONT_MAX * 1.2));
  assert.strictEqual(boxes[0].y + height / 2, 50);
  assert.strictEqual(boxes[1].y, boxes[0].y + boxes[0].height);
  const corner = Math.hypot(boxes[0].width / 2, height / 2);
  assert.ok(corner <= 40 + 1e-9, "inside the circle of room");
  assert.deepStrictEqual(regionLineBoxes(0, 0, 0, 2), []);
  assert.deepStrictEqual(regionLineBoxes(0, 0, 10, 0), []);
  assert.ok(MIN_LABEL_ROOM > 0);
});

it("Venn emit: vennEmit draws one path per region with its paint and description", () => {
  const viz = mockViz({
    shapeConfig: {
      label: false,
      fill: d => (d.sets.length === 1 ? "#ff0000" : "#00ff00"),
      fillOpacity: 0.5,
      stroke: "#fff",
      strokeWidth: 2,
    },
  });
  const {shapeData} = applyVennLayout({viz});
  const nodes = vennEmit({viz, shapeData});
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ['venn-["A"]', 'venn-["B"]', 'venn-["A","B"]'],
  );
  assert.ok(nodes.every(n => n.type === "path" && n.d));
  assert.strictEqual(nodes[2].paint.fill, "#00ff00");
  assert.strictEqual(nodes[2].paint.fillOpacity, 0.5);
  assert.strictEqual(nodes[0].aria.label, "A, 10.");
  assert.strictEqual(nodes[2].datum, viz._filteredData[2]);
  assert.deepStrictEqual(vennEmit({viz, shapeData: []}), []);
});

it("Venn tooltip: the size, then the count in the region alone when it differs", () => {
  const viz = mockViz();
  applyVennLayout({viz});
  const [a, , ab] = viz._filteredData;
  assert.deepStrictEqual(vennTooltipRows(viz, a, 0), [
    ["Value", "10"],
    ["Only in This Region", "7"],
  ]);
  assert.deepStrictEqual(vennTooltipRows(viz, ab, 2), [["Value", "3"]]);
  assert.deepStrictEqual(vennTooltipRows(viz, {sets: ["Q"]}, 9), []);
  assert.deepStrictEqual(vennTooltipRows(viz, undefined, 0), []);
});

it("Venn def: groupBy, label, and sets read the row's sets", () => {
  const field = k => vennDef.fields.find(f => f.key === k);
  const viz = mockViz();
  const [groupBy] = field("groupBy").factory(viz);
  assert.strictEqual(groupBy({sets: ["A"]}, 0), "A");
  assert.strictEqual(groupBy({sets: ["A", "B"]}, 0), `A${SET_SEPARATOR}B`);
  const label = field("label").factory(viz);
  assert.strictEqual(label({sets: ["B", "A"]}, 0), `B${SET_SEPARATOR}A`);
  const sets = field("sets");
  const byKey = sets.coerce("tags");
  assert.deepStrictEqual(byKey({tags: ["x"]}), ["x"]);
  assert.strictEqual(byKey.setsKey, "tags");
  const own = d => d.s;
  assert.strictEqual(sets.coerce(own), own);
  const target = {schema: {aggs: {}}};
  sets.onSet(target, byKey);
  assert.strictEqual(target.schema.aggs.tags, mergeSets);
  sets.onSet(target, own);
  assert.deepStrictEqual(Object.keys(target.schema.aggs), ["tags"]);
  assert.strictEqual(field("value").coerce("n")({n: 4}), 4);
  assert.strictEqual(
    field("valueFormat").factory({schema: {locale: "en-US"}})(1200),
    "1.2k",
  );
});

it("Venn def: hovering a region highlights it and the regions inside it", () => {
  let predicate;
  const base = () => {
    predicate = "base";
  };
  const viz = mockViz();
  viz.schema.on = {mouseenter: base};
  viz.hover = p => {
    predicate = p;
  };
  vennDef.setup(viz);
  viz.schema.on.mouseenter({sets: ["A"]}, 0);
  assert.ok(predicate({sets: ["A", "B"]}, 2));
  assert.ok(predicate({sets: ["A"]}, 0));
  assert.ok(!predicate({sets: ["B"]}, 1));
  viz.schema.on.mouseenter({_isColorScaleBucket: true}, 0);
  assert.strictEqual(predicate, "base");
  viz.schema.shapeConfig.hoverOpacity = 1;
  viz.schema.on.mouseenter({sets: ["A"]}, 0);
  assert.strictEqual(predicate, "base", "shape hover off");
  const fill = viz.schema.shapeConfig.fill;
  assert.strictEqual(typeof fill, "function", "fills blend");
});
