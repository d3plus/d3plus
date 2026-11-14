import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  FACET_LAYOUTS,
  expandArea,
  facetGrid,
  facetTitleNodes,
  labelExpansions,
  layoutDimensions,
  layoutGridCells,
  layoutMatcher,
  layoutTitleTexts,
  layoutTitleTooltips,
  missingFacetMessage,
  NO_SIDES,
  panelBase,
  placeFacets,
  resolveFacetConfig,
  resolveFacetLayout,
  settleExpansion,
} from "../../internal.ts";

useJsdom();

const cellKey = c => `${c.row},${c.column}`;

it("FACET_LAYOUTS — every place in its own cell, with a code and a name", () => {
  const counts = {"us-states": 51, "eu-countries": 27, "world-regions": 7};
  for (const [name, count] of Object.entries(counts)) {
    const cells = FACET_LAYOUTS[name];
    assert.strictEqual(cells.length, count, name);
    assert.strictEqual(
      new Set(cells.map(cellKey)).size,
      count,
      `${name} cells`,
    );
    assert.strictEqual(new Set(cells.map(c => c.code)).size, count);
    assert.ok(cells.every(c => c.code && c.name));
    assert.ok(cells.every(c => c.row >= 0 && c.column >= 0));
  }
  const dc = FACET_LAYOUTS["us-states"].find(c => c.code === "DC");
  assert.strictEqual(dc.name, "District of Columbia");
});

it("resolveFacetLayout — a named grid or a {value: [row, column]} map", () => {
  assert.strictEqual(
    resolveFacetLayout("us-states"),
    FACET_LAYOUTS["us-states"],
  );
  assert.deepStrictEqual(resolveFacetLayout({A: [0, 1], B: [1, 0]}), [
    {code: "A", row: 0, column: 1},
    {code: "B", row: 1, column: 0},
  ]);
  assert.deepStrictEqual(
    resolveFacetLayout({A: [0, 1], B: [-1, 0], C: [0.5, 1], D: "x"}),
    [{code: "A", row: 0, column: 1}],
    "skips places that aren't cells",
  );
  assert.strictEqual(resolveFacetLayout("mars"), undefined);
  assert.strictEqual(resolveFacetLayout({}), undefined);
  assert.strictEqual(resolveFacetLayout([[0, 0]]), undefined);
  assert.strictEqual(resolveFacetLayout(undefined), undefined);
  assert.strictEqual(
    resolveFacetConfig({layout: "eu-countries"}).layout.length,
    27,
  );
  assert.strictEqual(resolveFacetConfig({}).layout, undefined);
});

it("layoutMatcher — by code, name, or alias, ignoring case and space", () => {
  const match = layoutMatcher(FACET_LAYOUTS["eu-countries"]);
  assert.strictEqual(match("DE").name, "Germany");
  assert.strictEqual(match(" germany ").code, "DE");
  assert.strictEqual(match("deu").code, "DE");
  assert.strictEqual(match("EL").code, "GR");
  assert.strictEqual(match("Narnia"), undefined);
  const states = layoutMatcher(FACET_LAYOUTS["us-states"]);
  assert.strictEqual(states("Washington, D.C.").code, "DC");
  assert.strictEqual(states("washington").code, "WA");
  const regions = layoutMatcher(FACET_LAYOUTS["world-regions"]);
  assert.strictEqual(regions("Middle East and North Africa").code, "MEA");
});

it("placeFacets — each group in its cell; the rest left out", () => {
  const groups = ["CA", "Texas", "Atlantis", "California", "ny"].map(value => ({
    value,
  }));
  const {placed, missing} = placeFacets(groups, FACET_LAYOUTS["us-states"]);
  assert.deepStrictEqual(
    placed.map(p => [p.group.value, p.cell.code]),
    [
      ["CA", "CA"],
      ["Texas", "TX"],
      ["ny", "NY"],
    ],
  );
  assert.deepStrictEqual(
    missing.map(g => g.value),
    ["Atlantis", "California"],
    "a second value for a taken cell is left out too",
  );
});

it("layoutDimensions — rows and columns enough for every cell", () => {
  assert.deepStrictEqual(layoutDimensions(FACET_LAYOUTS["us-states"]), {
    rows: 8,
    columns: 12,
  });
  assert.deepStrictEqual(layoutDimensions([]), {rows: 0, columns: 0});
});

it("layoutGridCells — panels in their cells, edges by their neighbors", () => {
  const area = {x: 10, y: 20, width: 320, height: 220};
  const places = [
    {row: 0, column: 1},
    {row: 1, column: 0},
    {row: 1, column: 1},
    {row: 1, column: 2},
  ];
  const grid = {rows: 2, columns: 3};
  const cells = layoutGridCells(places, grid, area, {padding: 10});
  assert.deepStrictEqual(
    cells.map(c => [c.index, c.row, c.column, c.x, c.y, c.width, c.height]),
    [
      [0, 0, 1, 120, 20, 100, 105],
      [1, 1, 0, 10, 135, 100, 105],
      [2, 1, 1, 120, 135, 100, 105],
      [3, 1, 2, 230, 135, 100, 105],
    ],
  );
  assert.deepStrictEqual(cells[0].edges, {
    top: true,
    right: true,
    bottom: false,
    left: true,
  });
  assert.deepStrictEqual(cells[2].edges, {
    top: false,
    right: false,
    bottom: true,
    left: false,
  });

  // Edge panels reach into the gutter, or the empty cell beside them.
  const gutter = {left: 20, right: 6, bottom: 12};
  const wide = layoutGridCells(places, grid, area, {padding: 10, gutter});
  const cellW = (320 - 26 - 20) / 3,
    cellH = (220 - 12 - 10) / 2;
  assert.strictEqual(wide[0].x, 10 + 20 + cellW + 10 - 20, "top: left edge");
  assert.strictEqual(wide[0].width, cellW + 20);
  assert.strictEqual(wide[0].height, cellH, "a panel below it");
  assert.strictEqual(wide[1].x, 10);
  assert.strictEqual(wide[3].width, cellW + 6, "the last column");
  assert.strictEqual(wide[3].height, cellH + 12);
  assert.deepStrictEqual(
    panelBase(wide[0], 0, {...gutter, top: 0}, 3),
    {x: 10 + 20 + cellW + 10, y: 20, width: cellW, height: cellH},
    "the base area drops the gutter",
  );
  assert.deepStrictEqual(
    layoutGridCells([], {rows: 0, columns: 0}, area, {padding: 0}),
    [],
  );
  assert.deepStrictEqual(
    facetGrid(9, area, {padding: 10, titleHeight: 0, aspect: 1, places, grid}),
    cells,
    "facetGrid lays out places",
  );
});

it("layoutTitleTexts + layoutTitleTooltips — codes, with names on hover", () => {
  const places = [{code: "CA", name: "California"}, {code: "X"}];
  const panels = [
    {value: "California", data: [{a: 1}]},
    {value: "X", data: []},
  ];
  assert.deepStrictEqual(layoutTitleTexts({}, panels, places), ["CA", "X"]);
  assert.deepStrictEqual(layoutTitleTexts({title: false}, panels, places), [
    "",
    "",
  ]);
  assert.deepStrictEqual(
    layoutTitleTexts({title: (v, d) => `${v} ${d.length}`}, panels, places),
    ["California 1", "X 0"],
  );
  assert.deepStrictEqual(layoutTitleTooltips(["CA", "X"], places), [
    "California",
    undefined,
  ]);
  assert.deepStrictEqual(
    layoutTitleTooltips(["California", ""], places),
    [undefined, undefined],
    "nothing to add",
  );
});

it("missingFacetMessage — the values left out, abbreviated", () => {
  assert.strictEqual(missingFacetMessage(["A", "B"]), '"A", "B"');
  assert.strictEqual(
    missingFacetMessage(["A", "B", "C"], 2),
    '"A", "B" and 1 more',
  );
});

it("facetTitleNodes — a title with a tooltip takes the pointer", () => {
  const nodes = facetTitleNodes(
    [
      {text: "CA", x: 0, y: 0, width: 80, tooltip: "California"},
      {text: "TX", x: 100, y: 0, width: 80},
    ],
    {fontSize: 12, padding: 4},
  );
  assert.strictEqual(nodes.length, 2);
  assert.strictEqual(nodes[0].axisTooltip.option, "California");
  assert.strictEqual(nodes[0].axisTooltip.text, "CA");
  assert.notStrictEqual(nodes[0].interactive, false);
  assert.strictEqual(nodes[1].axisTooltip, undefined);
  assert.strictEqual(nodes[1].interactive, false);
  assert.ok(nodes.every(n => n.datum === undefined));
});

it("settleExpansion — the room labels take in the area they grow to", () => {
  const bare = {top: 2, right: 0, bottom: 4, left: 3};
  // A y axis that takes 10px more room once it has 30px of it.
  const measure = grown => ({
    ...bare,
    left: bare.left + (grown.left >= 30 ? 40 : 30),
  });
  const room = labelExpansions({k: measure(NO_SIDES)}, undefined, bare).k;
  assert.strictEqual(room.left, 30);
  assert.deepStrictEqual(settleExpansion(room, bare, measure), {
    top: 0,
    right: 0,
    bottom: 0,
    left: 40,
  });
  assert.strictEqual(settleExpansion(NO_SIDES, bare, measure), NO_SIDES);
  const unsettled = settleExpansion(
    room,
    bare,
    g => ({
      ...bare,
      left: bare.left + g.left + 5,
    }),
    2,
  );
  assert.strictEqual(unsettled.left, 40, "stops after `passes` measures");
  assert.deepStrictEqual(
    expandArea({x: 0, y: 0, width: 1, height: 1}, NO_SIDES),
    {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },
  );
});
