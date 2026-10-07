/* global describe */
import assert from "assert";
import {
  coerceFacet,
  compareFacetValues,
  facetActive,
  FACET_PADDING,
  FACET_TITLE_DEFAULTS,
  facetAreaMargin,
  facetBodyNode,
  facetDimensions,
  facetGrid,
  facetGroups,
  facetKey,
  facetPanelAt,
  facetPanelNode,
  facetTitleStyle,
  facetTitleTexts,
  fittedArea,
  formatFacetValue,
  groupFacets,
  expandArea,
  LABEL_COMBOS,
  labelExpansions,
  labelGutter,
  labelKey,
  NO_SIDES,
  panelBase,
  panelLabels,
  panelTitle,
  prefixKeys,
  resolveFacetConfig,
  sortFacetValues,
  toFacetValue,
  withFacetPanel,
  clearPanelSlots,
} from "../../es/internal.js";

/**
    The pure helpers behind small multiples (`facet` / `facetConfig`): config
    resolution, grouping and ordering facet values, the panel grid, the panel
    scene nodes, and the per-panel state restored at interaction time. (Title
    measurement needs a canvas, so it's covered in facet-render-test.js.)
*/

const cell = (extra = {}) => ({
  index: 0, row: 0, column: 0, x: 10, y: 20, width: 200, height: 150,
  edges: {top: true, right: false, bottom: false, left: true},
  ...extra,
});

describe("facet config", () => {
  it("coerceFacet: strings become key accessors, functions are kept, anything else turns faceting off", () => {
    const fn = d => d.a;
    assert.strictEqual(coerceFacet(fn), fn);
    assert.strictEqual(coerceFacet("region")({region: "East"}), "East");
    assert.strictEqual(coerceFacet(false), undefined);
    assert.strictEqual(coerceFacet(""), undefined);
    assert.strictEqual(coerceFacet(undefined), undefined);
  });

  it("resolveFacetConfig: fills defaults and drops invalid values", () => {
    const def = resolveFacetConfig(undefined);
    assert.strictEqual(def.padding, FACET_PADDING);
    assert.strictEqual(def.sort, "ascending");
    assert.strictEqual(def.scales, "shared");
    assert.strictEqual(def.axes, undefined, "axes defers to the chart's default");
    assert.strictEqual(def.columns, undefined);
    assert.strictEqual(def.title, undefined);
    assert.deepStrictEqual(def.titleConfig, FACET_TITLE_DEFAULTS);

    const title = v => `Region ${v}`;
    const c = resolveFacetConfig({
      columns: 2.7, rows: 0, padding: -5, sort: "descending", scales: "independent",
      axes: "all", title, titleConfig: {fontSize: 20},
    });
    assert.strictEqual(c.columns, 2);
    assert.strictEqual(c.rows, undefined, "a count below 1 is ignored");
    assert.strictEqual(c.padding, FACET_PADDING, "a negative padding is ignored");
    assert.strictEqual(c.sort, "descending");
    assert.strictEqual(c.scales, "independent");
    assert.strictEqual(c.axes, "all");
    assert.strictEqual(c.title, title);
    assert.strictEqual(c.titleConfig.fontSize, 20);
    assert.strictEqual(c.titleConfig.textAnchor, "middle", "titleConfig merges over the defaults");
    assert.strictEqual(resolveFacetConfig({title: false}).title, false);
  });

  it("facetActive: true only when the facet accessor is set", () => {
    assert.strictEqual(facetActive({schema: {facet: () => 1}}), true);
    assert.strictEqual(facetActive({schema: {}}), false);
  });
});

describe("facet data", () => {
  it("facetKey: dates compare by time, everything else by text", () => {
    assert.strictEqual(facetKey(new Date(5)), "5");
    assert.strictEqual(facetKey(2020), "2020");
    assert.strictEqual(facetKey("East"), "East");
  });

  it("toFacetValue: keeps primitives and dates, stringifies the rest, drops empty values", () => {
    const d = new Date(0);
    assert.strictEqual(toFacetValue(d), d);
    assert.strictEqual(toFacetValue(3), 3);
    assert.strictEqual(toFacetValue(false), false);
    assert.strictEqual(toFacetValue(["a", "b"]), "a,b");
    assert.strictEqual(toFacetValue(undefined), undefined);
    assert.strictEqual(toFacetValue(null), undefined);
    assert.strictEqual(toFacetValue(""), undefined);
  });

  it("compareFacetValues: numbers and dates numerically, text naturally", () => {
    assert.ok(compareFacetValues(2, 10) < 0);
    assert.ok(compareFacetValues(new Date(10), new Date(2)) > 0);
    assert.ok(compareFacetValues("Item 2", "Item 10") < 0);
    assert.ok(compareFacetValues("b", "a") > 0);
  });

  it("sortFacetValues: named orders, comparators, and explicit lists", () => {
    const values = ["West", "East", "North"];
    assert.deepStrictEqual(sortFacetValues(values, "ascending"), ["East", "North", "West"]);
    assert.deepStrictEqual(sortFacetValues(values, "descending"), ["West", "North", "East"]);
    assert.deepStrictEqual(sortFacetValues(values, "data"), values);
    assert.deepStrictEqual(sortFacetValues(values, (a, b) => a.length - b.length), ["West", "East", "North"]);
    assert.deepStrictEqual(sortFacetValues(values, ["North", "West"]), ["North", "West", "East"], "unlisted values go last");
    assert.deepStrictEqual(values, ["West", "East", "North"], "the input is not mutated");
  });

  it("groupFacets: one group per value, in panel order, skipping rows without a value", () => {
    const rows = [{r: "b", v: 1}, {r: "a", v: 2}, {v: 3}, {r: "b", v: 4}];
    const groups = groupFacets(rows, d => d.r, "ascending");
    assert.deepStrictEqual(groups.map(g => g.key), ["a", "b"]);
    assert.deepStrictEqual(groups[1].rows.map(d => d.v), [1, 4]);
    assert.strictEqual(groups[0].value, "a");
  });

  it("facetGroups: groups the chart's data after its filter; empty without a facet", () => {
    const data = [{r: "a", ok: true}, {r: "b", ok: false}, {r: "c", ok: true}];
    const viz = {schema: {facet: d => d.r, filter: d => d.ok}, _data: data};
    assert.deepStrictEqual(facetGroups(viz, "descending").map(g => g.value), ["c", "a"]);
    assert.deepStrictEqual(facetGroups({schema: {}, _data: data}, "ascending"), []);
  });

  it("formatFacetValue: dates format against every panel's date, others as text", () => {
    const years = [new Date(2020, 0, 1), new Date(2021, 0, 1)];
    assert.strictEqual(formatFacetValue(years[1], years), "2021");
    assert.strictEqual(formatFacetValue(42, []), "42");
    assert.strictEqual(formatFacetValue("East", []), "East");
  });
});

describe("facet grid", () => {
  it("fittedArea: the largest rect of the aspect that fits", () => {
    assert.strictEqual(fittedArea(200, 100, 1), 100 * 100);
    assert.strictEqual(fittedArea(100, 200, 2), 100 * 50);
    assert.strictEqual(fittedArea(0, 100, 1), 0);
  });

  it("facetDimensions: picks the grid that draws the panels largest for the aspect", () => {
    const opts = {padding: 0, titleHeight: 0, aspect: 1};
    assert.deepStrictEqual(facetDimensions(4, {width: 400, height: 400}, opts), {columns: 2, rows: 2});
    assert.deepStrictEqual(facetDimensions(4, {width: 800, height: 200}, opts), {columns: 4, rows: 1});
    assert.deepStrictEqual(facetDimensions(3, {width: 200, height: 600}, opts), {columns: 1, rows: 3});
    assert.deepStrictEqual(facetDimensions(0, {width: 200, height: 600}, opts), {columns: 0, rows: 0});
  });

  it("facetDimensions: honors fixed columns and/or rows, growing rows to fit every panel", () => {
    const opts = {padding: 0, titleHeight: 0, aspect: 1};
    const area = {width: 400, height: 400};
    assert.deepStrictEqual(facetDimensions(5, area, {...opts, columns: 3}), {columns: 3, rows: 2});
    assert.deepStrictEqual(facetDimensions(5, area, {...opts, rows: 1}), {columns: 5, rows: 1});
    assert.deepStrictEqual(facetDimensions(5, area, {...opts, columns: 2, rows: 1}), {columns: 2, rows: 3});
    assert.deepStrictEqual(facetDimensions(2, area, {...opts, columns: 4}), {columns: 2, rows: 1});
  });

  it("facetGrid: equal cells with padding, edges, and the outer-label gutter", () => {
    const area = {x: 10, y: 20, width: 350, height: 220};
    const cells = facetGrid(5, area, {columns: 3, padding: 10, titleHeight: 0, aspect: 1, gutter: {left: 30, right: 20, bottom: 20}});
    // (350 - 30 - 20 - 2 * 10) / 3 = 93.33 wide; (220 - 20 - 10) / 2 = 95 tall.
    const w = (350 - 30 - 20 - 20) / 3;
    assert.strictEqual(cells.length, 5);
    assert.deepStrictEqual(cells[0], {
      index: 0, row: 0, column: 0, x: 10, y: 20, width: w + 30, height: 95,
      edges: {top: true, right: false, bottom: false, left: true},
    });
    assert.strictEqual(cells[1].x, 10 + w + 10 + 30);
    assert.strictEqual(cells[1].width, w);
    assert.strictEqual(cells[2].width, w + 20, "the right column takes the right gutter");
    assert.deepStrictEqual(cells[2].edges, {top: true, right: true, bottom: true, left: false}, "no panel below: bottom edge");
    assert.strictEqual(cells[2].height, 95 + 20, "a bottom-edge panel above an empty cell takes the gutter");
    assert.strictEqual(cells[3].y, 20 + 95 + 10);
    assert.deepStrictEqual(cells[4].edges, {top: false, right: true, bottom: true, left: false}, "the last panel ends its row");
    assert.deepStrictEqual(facetGrid(0, area, {padding: 0, titleHeight: 0, aspect: 1}), []);
  });
});

describe("facet label gutter", () => {
  it("labelKey / LABEL_COMBOS / NO_SIDES: one key per label combination", () => {
    assert.deepStrictEqual(LABEL_COMBOS.map(labelKey), ["xy", "x", "y", ""]);
    assert.deepStrictEqual(NO_SIDES, {top: 0, right: 0, bottom: 0, left: 0});
  });

  it("labelExpansions: each combination's insets beyond the bare panel's, never negative", () => {
    const exp = labelExpansions({
      xy: {top: 6, right: 12, bottom: 30, left: 50},
      x: {top: 0, right: 12, bottom: 30, left: 10},
      y: {top: 6, right: 0, bottom: 2, left: 50},
      "": {top: 0, right: 0, bottom: 4, left: 0},
    });
    assert.deepStrictEqual(exp.xy, {top: 6, right: 12, bottom: 26, left: 50});
    assert.deepStrictEqual(exp.y, {top: 6, right: 0, bottom: 0, left: 50});
    assert.deepStrictEqual(exp[""], NO_SIDES);
  });

  it("labelGutter: y-labeled room on the left, x-labeled room on the bottom, the most of any above and right", () => {
    const gutter = labelGutter({
      xy: {top: 6, right: 12, bottom: 26, left: 50},
      x: {top: 0, right: 14, bottom: 28, left: 10},
      y: {top: 7, right: 0, bottom: 3, left: 48},
      "": NO_SIDES,
    });
    assert.deepStrictEqual(gutter, {top: 7, right: 14, bottom: 28, left: 50});
    assert.deepStrictEqual(labelGutter({}), NO_SIDES);
  });

  it("panelBase: the cell below its title, less the gutter on its outer edges", () => {
    const gutter = {top: 5, right: 10, bottom: 20, left: 30};
    assert.deepStrictEqual(panelBase(cell(), 25, gutter, 2), {x: 40, y: 50, width: 170, height: 120});
    const corner = cell({column: 1, edges: {top: false, right: true, bottom: true, left: false}});
    assert.deepStrictEqual(panelBase(corner, 25, gutter, 2), {x: 10, y: 50, width: 190, height: 100});
    assert.strictEqual(panelBase(cell({height: 10}), 25, NO_SIDES, 1).height, 0);
  });

  it("expandArea: grows an area by each side", () => {
    assert.deepStrictEqual(expandArea({x: 10, y: 20, width: 100, height: 50}, {top: 1, right: 2, bottom: 3, left: 4}),
      {x: 6, y: 19, width: 106, height: 54});
  });
});

describe("facet scene", () => {
  it("prefixKeys: prefixes (or maps) every key at every depth without mutating", () => {
    const nodes = [{type: "group", key: "g", children: [{type: "rect", key: "r"}]}];
    const out = prefixKeys(nodes, "p");
    assert.strictEqual(out[0].key, "p/g");
    assert.strictEqual(out[0].children[0].key, "p/r");
    assert.strictEqual(nodes[0].key, "g");
    assert.strictEqual(prefixKeys(nodes, k => `${k}!`)[0].children[0].key, "r!");
  });

  it("facetBodyNode: a clip group around a transformed body group", () => {
    const clip = {type: "rect", x: 0, y: 0, width: 5, height: 5};
    const node = facetBodyNode("facet-a", [{type: "rect", key: "r"}], {x: 3, y: 4}, clip);
    assert.strictEqual(node.key, "facet-a/cells");
    assert.deepStrictEqual(node.clip, clip);
    assert.strictEqual(node.children[0].key, "facet-a/body");
    assert.deepStrictEqual(node.children[0].transform, {x: 3, y: 4});
    const bare = facetBodyNode("facet-b", []);
    assert.strictEqual(bare.clip, undefined);
    assert.strictEqual(bare.children[0].transform, undefined);
  });

  it("facetPanelNode: body then title, named by its title", () => {
    const node = facetPanelNode("facet-a", {type: "text", key: "t"}, {type: "group", key: "b", children: []}, "East");
    assert.deepStrictEqual(node.children.map(n => n.key), ["b", "t"]);
    assert.deepStrictEqual(node.aria, {role: "group", label: "East"});
    assert.strictEqual(facetPanelNode("facet-b", undefined, undefined, "").aria, undefined);
  });
});

describe("facet layout helpers", () => {
  it("facetAreaMargin: margins that make a box the chart area", () => {
    assert.deepStrictEqual(
      facetAreaMargin({schema: {width: 500, height: 400}}, {x: 10, y: 20, width: 100, height: 50}),
      {top: 20, left: 10, right: 390, bottom: 330},
    );
  });

  it("panelLabels: outer axes label only the left column and bottom edge", () => {
    assert.deepStrictEqual(panelLabels(cell(), true), {x: false, y: true});
    assert.deepStrictEqual(panelLabels(cell({edges: {top: false, right: true, bottom: true, left: false}}), true), {x: true, y: false});
    assert.deepStrictEqual(panelLabels(cell(), false), {x: true, y: true});
  });

  it("panelTitle: above its cell, across its base area", () => {
    assert.deepStrictEqual(panelTitle("East", cell(), {x: 50, y: 60, width: 160, height: 90}), {text: "East", x: 50, y: 20, width: 160});
  });

  it("facetTitleTexts: default, custom, and hidden titles", () => {
    const panels = [{value: "a", data: [{}]}, {value: 2, data: [{}, {}]}];
    assert.deepStrictEqual(facetTitleTexts({}, panels), ["a", "2"]);
    assert.deepStrictEqual(facetTitleTexts({title: (v, d) => `${v}:${d.length}`}, panels), ["a:1", "2:2"]);
    assert.deepStrictEqual(facetTitleTexts({title: false}, panels), ["", ""]);
  });

  it("facetTitleStyle: defaults the color to contrast with the background, keeps a set color", () => {
    const viz = {schema: {colorDefaults: {dark: "#111", light: "#eee"}}};
    assert.strictEqual(facetTitleStyle(viz, {titleConfig: {fontSize: 12}}).fontColor, "#111");
    assert.strictEqual(facetTitleStyle(viz, {titleConfig: {fontColor: "red"}}).fontColor, "red");
  });

});

describe("facet panels at interaction time", () => {
  const panels = [
    {key: "facet-a", cell: cell({x: 0, y: 0, width: 100, height: 100}), scene: [{key: "a"}], chartTransform: {x: 1, y: 1}, state: {_plotArea: "A"}},
    {key: "facet-b", cell: cell({x: 120, y: 0, width: 100, height: 100}), scene: [{key: "b"}], chartTransform: {x: 121, y: 1}, state: {_plotArea: "B"}},
  ];

  it("facetPanelAt: the panel under a point, undoing the zoom transform", () => {
    assert.strictEqual(facetPanelAt({_facetPanels: panels}, [50, 50]).key, "facet-a");
    assert.strictEqual(facetPanelAt({_facetPanels: panels}, [150, 50]).key, "facet-b");
    assert.strictEqual(facetPanelAt({_facetPanels: panels}, [110, 50]), undefined, "the gap between panels");
    assert.strictEqual(facetPanelAt({_facetPanels: panels, _zoomTransform: {x: 100, y: 0, scale: 2}}, [150, 50]).key, "facet-a");
    assert.strictEqual(facetPanelAt({}, [50, 50]), undefined);
    assert.strictEqual(facetPanelAt({_facetPanels: panels}, undefined), undefined);
  });

  it("withFacetPanel: swaps a panel's state in for the call, keeping slots the call reassigns", () => {
    const viz = {_chartScene: ["all"], _chartTransform: undefined, _plotArea: undefined};
    const seen = withFacetPanel(viz, panels[1], () => [viz._chartScene, viz._chartTransform, viz._plotArea]);
    assert.deepStrictEqual(seen, [[{key: "b"}], {x: 121, y: 1}, "B"]);
    assert.deepStrictEqual(viz._chartScene, ["all"]);
    assert.strictEqual(viz._plotArea, undefined);
    withFacetPanel(viz, panels[0], () => {
      viz._chartScene = ["redrawn"];
    });
    assert.deepStrictEqual(viz._chartScene, ["redrawn"], "a redraw inside the call survives");
    assert.strictEqual(withFacetPanel(viz, undefined, () => 7), 7);
  });

  it("clearPanelSlots: clears every captured slot on the composed chart", () => {
    const viz = {_plotArea: "last", _other: 1};
    clearPanelSlots(viz, panels);
    assert.strictEqual(viz._plotArea, undefined);
    assert.strictEqual(viz._other, 1);
  });
});
