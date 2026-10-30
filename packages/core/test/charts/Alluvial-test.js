import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Alluvial} from "../../index.ts";
import {
  aggregateAlluvial,
  alluvialColumns,
  alluvialDef,
  alluvialGroupBy,
  alluvialHighlight,
  alluvialMeta,
  alluvialNodeId,
  alluvialPathRows,
  alluvialPathText,
  alluvialRibbon,
  alluvialTitleBoxes,
  alluvialTooltipRows,
  alluvialTooltipTitle,
  alluvialValue,
  alluvialValueTitle,
  applyAlluvialLayout,
  countRows,
  incomingBarycenters,
  installAlluvialHover,
  isMissingCategory,
  layoutAlluvial,
  resolveAlluvialDimensions,
  resolveColorBy,
  runStages,
  setAlluvialMeta,
  sortAlluvialColumns,
  sourceRows,
} from "../../internal.ts";

useJsdom();

const sales = [
  {region: "West", product: "Chairs", channel: "Online", units: 5},
  {region: "West", product: "Chairs", channel: "Store", units: 3},
  {region: "West", product: "Tables", channel: "Online", units: 2},
  {region: "East", product: "Chairs", channel: "Online", units: 4},
  {region: "East", product: "Tables", channel: "Store", units: 6},
  {region: "East", product: "Tables", channel: "Store", units: 1},
];

const dims = resolveAlluvialDimensions(["region", "product", "channel"]);
const graphOf = (rows = sales, value = countRows, colorBy = 0) =>
  aggregateAlluvial(rows, dims, value, colorBy);
const node = (graph, column, label) =>
  graph.columns[column].find(n => n.label === label);
const units = d => d.units;

it("resolveAlluvialDimensions reads keys, accessors, and titled objects", () => {
  const age = d => (d.age < 18 ? "Child" : "Adult");
  const resolved = resolveAlluvialDimensions([
    "class",
    age,
    {value: age, title: "Age"},
    {value: "sex", title: "Sex"},
    42,
    {title: "nothing"},
  ]);
  assert.deepStrictEqual(
    resolved.map(d => d.title),
    ["class", "", "Age", "Sex"],
  );
  assert.strictEqual(resolved[0].key, "class");
  assert.strictEqual(resolved[0].accessor({class: "1st"}, 0), "1st");
  assert.strictEqual(resolved[1].accessor({age: 9}, 0), "Child");
  assert.strictEqual(resolved[3].key, "sex");
  assert.deepStrictEqual(resolveAlluvialDimensions(undefined), []);
});

it("isMissingCategory flags undefined, null, empty strings, and NaN only", () => {
  for (const v of [undefined, null, "", NaN]) assert.ok(isMissingCategory(v));
  for (const v of [0, false, "0", "No", " "])
    assert.ok(!isMissingCategory(v), `${JSON.stringify(v)} is a category`);
});

it("resolveColorBy takes an index, a key, or a title, else the first column", () => {
  const titled = resolveAlluvialDimensions([
    "region",
    {value: "product", title: "Product"},
    "channel",
  ]);
  assert.strictEqual(resolveColorBy(2, titled), 2);
  assert.strictEqual(resolveColorBy("channel", titled), 2);
  assert.strictEqual(resolveColorBy("product", titled), 1);
  assert.strictEqual(resolveColorBy("Product", titled), 1);
  assert.strictEqual(resolveColorBy(7, titled), 0);
  assert.strictEqual(resolveColorBy(1.5, titled), 0);
  assert.strictEqual(resolveColorBy("missing", titled), 0);
  assert.strictEqual(resolveColorBy(1, []), 0);
});

it("aggregateAlluvial counts rows into one node per category per column", () => {
  const graph = graphOf();
  assert.deepStrictEqual(
    graph.columns.map(c => c.map(n => [n.label, n.value])),
    [
      [
        ["West", 3],
        ["East", 3],
      ],
      [
        ["Chairs", 3],
        ["Tables", 3],
      ],
      [
        ["Online", 3],
        ["Store", 3],
      ],
    ],
  );
  assert.strictEqual(graph.total, 6);
  assert.strictEqual(graph.rows.length, 6);
  assert.deepStrictEqual(
    graph.columns.map(c => c.map(n => n.column)),
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
  );
});

it("aggregateAlluvial sums a value and splits bands by origin", () => {
  const graph = graphOf(sales, units);
  assert.strictEqual(graph.total, 21);
  assert.strictEqual(node(graph, 1, "Chairs").value, 12);
  assert.strictEqual(node(graph, 2, "Store").value, 10);
  // Chairs → Online carries West's 5 and East's 4 as two bands.
  const chairsOnline = graph.bands.filter(
    b => b.source.label === "Chairs" && b.target.label === "Online",
  );
  assert.deepStrictEqual(
    chairsOnline.map(b => [b.origin.label, b.value]).sort(),
    [
      ["East", 4],
      ["West", 5],
    ],
  );
  // Every band runs between adjacent columns.
  for (const band of graph.bands) {
    assert.strictEqual(band.target.column, band.source.column + 1);
    assert.strictEqual(band.column, band.source.column);
  }
  // Duplicate paths merge: East → Tables → Store holds two rows.
  const path = graph.paths.find(
    p => p.nodes.map(n => n.label).join() === "East,Tables,Store",
  );
  assert.deepStrictEqual([path.value, path.rows.length], [7, 2]);
});

it("aggregateAlluvial traces each row's origin through every column", () => {
  const graph = graphOf();
  const origins = label =>
    [
      ...new Set(
        graph.bands
          .filter(b => b.target.label === label)
          .map(b => b.origin.label),
      ),
    ].sort();
  assert.deepStrictEqual(origins("Online"), ["East", "West"]);
  // Both regions reach Store; East only through Tables.
  const tablesStore = graph.bands.filter(
    b => b.source.label === "Tables" && b.target.label === "Store",
  );
  assert.deepStrictEqual(
    tablesStore.map(b => b.origin.label),
    ["East"],
  );
  assert.deepStrictEqual(origins("Store"), ["East", "West"]);
  // The origin's band totals equal the origin's node value in each pair.
  for (const k of [0, 1]) {
    const west = graph.bands
      .filter(b => b.column === k && b.origin.label === "West")
      .reduce((s, b) => s + b.value, 0);
    assert.strictEqual(west, node(graph, 0, "West").value);
  }
});

it("aggregateAlluvial colors by any column with colorBy", () => {
  const graph = graphOf(sales, countRows, 2);
  assert.strictEqual(graph.colorBy, 2);
  assert.deepStrictEqual(
    [...new Set(graph.bands.map(b => b.origin.label))].sort(),
    ["Online", "Store"],
  );
  const westChairs = graph.bands.filter(
    b => b.source.label === "West" && b.target.label === "Chairs",
  );
  assert.deepStrictEqual(westChairs.map(b => b.origin.label).sort(), [
    "Online",
    "Store",
  ]);
});

it("aggregateAlluvial skips rows missing a category or a positive value", () => {
  const rows = [
    ...sales,
    {region: "West", product: null, channel: "Online"},
    {region: "", product: "Chairs", channel: "Online"},
    {region: "North", product: "Chairs"},
    {region: "West", product: "Chairs", channel: "Online", units: 0},
    {region: "West", product: "Chairs", channel: "Online", units: "x"},
  ];
  const counted = graphOf(rows);
  assert.strictEqual(counted.total, 8);
  assert.ok(!node(counted, 0, "North"), "a row missing channel adds nothing");
  const summed = graphOf(rows, units);
  assert.strictEqual(summed.total, 21);
  assert.strictEqual(summed.rows.length, 6);
});

it("aggregateAlluvial matches categories by text and keeps first-seen order", () => {
  const rows = [
    {a: 1, b: "x"},
    {a: "1", b: "y"},
    {a: 2, b: "x"},
  ];
  const graph = aggregateAlluvial(
    rows,
    resolveAlluvialDimensions(["a", "b"]),
    countRows,
  );
  assert.deepStrictEqual(
    graph.columns[0].map(n => [n.category, n.value, n.first]),
    [
      [1, 2, 0],
      [2, 1, 1],
    ],
  );
  assert.deepStrictEqual(aggregateAlluvial(rows, [], countRows).bands, []);
});

it("alluvialPathText names the band's categories and its origin", () => {
  const four = resolveAlluvialDimensions(["a", "b", "c", "d"]);
  const graph = aggregateAlluvial(
    [{a: "W", b: "X", c: "Y", d: "Z"}],
    four,
    countRows,
  );
  const [ab, bc, cd] = graph.bands;
  assert.strictEqual(alluvialPathText(ab, 4), "W → X");
  assert.strictEqual(alluvialPathText(bc, 4), "W → X → Y");
  assert.strictEqual(alluvialPathText(cd, 4), "W → … → Y → Z");
  const last = aggregateAlluvial(
    [{a: "W", b: "X", c: "Y", d: "Z"}],
    four,
    countRows,
    3,
  );
  assert.strictEqual(alluvialPathText(last.bands[0], 4), "W → X → … → Z");
});

it("sortAlluvialColumns orders by value, data order, or a comparator", () => {
  const rows = [
    {a: "small", b: "p"},
    {a: "big", b: "q"},
    {a: "big", b: "q"},
  ];
  const two = resolveAlluvialDimensions(["a", "b"]);
  const labels = sort => {
    const graph = aggregateAlluvial(rows, two, countRows);
    sortAlluvialColumns(graph, sort);
    return graph.columns.map(c => c.map(n => `${n.label}:${n.rank}`));
  };
  assert.deepStrictEqual(labels("value"), [
    ["big:0", "small:1"],
    ["q:0", "p:1"],
  ]);
  assert.deepStrictEqual(labels(undefined), labels("crossings"));
  assert.deepStrictEqual(labels("data"), [
    ["small:0", "big:1"],
    ["p:0", "q:1"],
  ]);
  assert.deepStrictEqual(
    labels((a, b) => a.label.localeCompare(b.label)),
    [
      ["big:0", "small:1"],
      ["p:0", "q:1"],
    ],
  );
});

it("sortAlluvialColumns 'crossings' follows the previous column's order", () => {
  // x is the bigger node, but most of it comes from the bottom node.
  const rows = [
    {a: "top", b: "y"},
    {a: "top", b: "y"},
    {a: "top", b: "y"},
    {a: "top", b: "x"},
    {a: "bottom", b: "x"},
    {a: "bottom", b: "x"},
    {a: "bottom", b: "x"},
    {a: "bottom", b: "x"},
  ];
  const order = sort => {
    const graph = aggregateAlluvial(
      rows,
      resolveAlluvialDimensions(["a", "b"]),
      countRows,
    );
    sortAlluvialColumns(graph, sort);
    return graph.columns.map(c => c.map(n => n.label));
  };
  assert.deepStrictEqual(order("value"), [
    ["top", "bottom"],
    ["x", "y"],
  ]);
  assert.deepStrictEqual(order("crossings"), [
    ["top", "bottom"],
    ["y", "x"],
  ]);
});

it("incomingBarycenters weights each source's middle by flow", () => {
  const graph = graphOf();
  sortAlluvialColumns(graph, "value");
  const centers = incomingBarycenters(graph.columns[1], graph.columns[0]);
  // West (middle at 1.5) and East (middle at 4.5) feed Chairs 2:1, Tables 1:2.
  assert.strictEqual(centers.get(node(graph, 1, "Chairs")), 2.5);
  assert.strictEqual(centers.get(node(graph, 1, "Tables")), 3.5);
  const orphan = incomingBarycenters(graph.columns[0], []);
  assert.strictEqual(orphan.get(node(graph, 0, "West")), Infinity);
});

it("alluvialColumns spaces columns evenly and narrows crowded nodes", () => {
  assert.deepStrictEqual(alluvialColumns(3, 300, 20), {
    x: [0, 140, 280],
    nodeWidth: 20,
  });
  assert.deepStrictEqual(alluvialColumns(1, 100, 20), {x: [40], nodeWidth: 20});
  assert.strictEqual(alluvialColumns(4, 70, 30).nodeWidth, 10);
  assert.deepStrictEqual(alluvialColumns(0, 100, 20).x, []);
});

it("layoutAlluvial stacks fixed columns and band ends", () => {
  const graph = graphOf(sales, units);
  sortAlluvialColumns(graph, "value");
  layoutAlluvial(graph, {
    width: 300,
    height: 230,
    top: 20,
    nodeWidth: 20,
    nodePadding: 10,
  });
  graph.columns.forEach((column, k) => {
    for (const n of column) {
      assert.strictEqual(n.x0, k * 140);
      assert.strictEqual(n.x1, n.x0 + 20);
    }
    // Two nodes, 10px apart, filling the 200px under the titles.
    assert.strictEqual(column[0].y0, 20);
    assert.strictEqual(column[1].y0, column[0].y1 + 10);
    assert.ok(Math.abs(column[1].y1 - 230) < 1e-9);
  });
  // One scale: 200px (210 less one gap) for 21 units.
  const ky = 200 / 21;
  for (const band of graph.bands) {
    assert.ok(Math.abs(band.sy1 - band.sy0 - band.value * ky) < 1e-9);
    assert.ok(Math.abs(band.ty1 - band.ty0 - band.value * ky) < 1e-9);
  }
  // Outgoing bands stack by target, then origin, and fill their node.
  for (const n of graph.columns.flat()) {
    const out = n.sourceBands;
    if (!out.length) continue;
    assert.strictEqual(out[0].sy0, n.y0);
    assert.ok(Math.abs(out[out.length - 1].sy1 - n.y1) < 1e-9);
    for (let i = 1; i < out.length; i++) {
      assert.ok(
        out[i].target.rank > out[i - 1].target.rank ||
          (out[i].target.rank === out[i - 1].target.rank &&
            out[i].origin.rank > out[i - 1].origin.rank),
      );
    }
  }
  layoutAlluvial(
    {...graph, columns: []},
    {
      width: 1,
      height: 1,
      top: 0,
      nodeWidth: 1,
      nodePadding: 1,
    },
  );
});

it("layoutAlluvial centers shorter columns and shrinks padding to fit", () => {
  const rows = [
    {a: "p", b: "x"},
    {a: "q", b: "x"},
    {a: "r", b: "x"},
  ];
  const graph = aggregateAlluvial(
    rows,
    resolveAlluvialDimensions(["a", "b"]),
    countRows,
  );
  sortAlluvialColumns(graph);
  layoutAlluvial(graph, {
    width: 100,
    height: 40,
    top: 0,
    nodeWidth: 10,
    nodePadding: 30,
  });
  // Padding shrinks to 10 so the nodes keep half the height.
  const [p, q] = graph.columns[0];
  assert.strictEqual(q.y0 - p.y1, 10);
  const x = graph.columns[1][0];
  assert.strictEqual(x.y0, 10);
  assert.strictEqual(x.y1, 30);
});

it("alluvialRibbon draws a closed ribbon between the band's ends", () => {
  const band = {
    source: {x1: 10},
    target: {x0: 50},
    sy0: 0,
    sy1: 4,
    ty0: 20,
    ty1: 24,
  };
  assert.strictEqual(
    alluvialRibbon(band),
    "M10,0C30,0,30,20,50,20L50,24C30,24,30,4,10,4Z",
  );
});

it("alluvialTitleBoxes aligns the outer titles with the outer columns", () => {
  const boxes = alluvialTitleBoxes(
    ["A", "", "C", "D"],
    [0, 100, 200, 300],
    20,
    320,
  );
  assert.deepStrictEqual(
    boxes.map(b => [b.key, b.anchor, b.x, b.width]),
    [
      ["0", "start", 0, 56],
      ["2", "middle", 164, 92],
      ["3", "end", 264, 56],
    ],
  );
  const single = alluvialTitleBoxes(["Only"], [140], 20, 300);
  assert.deepStrictEqual(
    single.map(b => [b.anchor, b.x, b.width]),
    [["middle", 0, 300]],
  );
});

it("alluvialValue reads keys, keeps accessors, and wraps constants", () => {
  assert.strictEqual(alluvialValue("units")({units: 4}), 4);
  const fn = d => d.x;
  assert.strictEqual(alluvialValue(fn), fn);
  assert.strictEqual(alluvialValue(2)(), 2);
});

it("setAlluvialMeta and sourceRows expand groups and path rows", () => {
  const rows = [{a: 1}, {a: 2}];
  const group = setAlluvialMeta({}, {kind: "group", id: "x", rows});
  assert.strictEqual(alluvialMeta(group).id, "x");
  assert.strictEqual(sourceRows(group), rows);
  const path = setAlluvialMeta({}, {kind: "path", id: "x", rows});
  assert.strictEqual(sourceRows(path), rows);
  const plain = {a: 3};
  assert.deepStrictEqual(sourceRows(plain), [plain]);
  assert.strictEqual(alluvialMeta(null), undefined);
  assert.strictEqual(alluvialMeta("x"), undefined);
});

it("alluvialNodeId keeps colorBy categories and namespaces the rest", () => {
  const graph = graphOf();
  assert.strictEqual(alluvialNodeId(node(graph, 0, "West"), dims, 0), "West");
  assert.strictEqual(
    alluvialNodeId(node(graph, 1, "Chairs"), dims, 0),
    "product: Chairs",
  );
  const untitled = resolveAlluvialDimensions(["region", d => d.product]);
  assert.strictEqual(
    alluvialNodeId(node(graph, 1, "Chairs"), untitled, 0),
    "2: Chairs",
  );
});

it("alluvialPathRows lists one row per path, top to bottom", () => {
  const graph = graphOf(sales, units);
  sortAlluvialColumns(graph, "value");
  const rows = alluvialPathRows(graph, dims, "units");
  assert.deepStrictEqual(rows, [
    {region: "East", product: "Chairs", channel: "Online", units: 4},
    {region: "East", product: "Tables", channel: "Store", units: 7},
    {region: "West", product: "Chairs", channel: "Online", units: 5},
    {region: "West", product: "Chairs", channel: "Store", units: 3},
    {region: "West", product: "Tables", channel: "Online", units: 2},
  ]);
  assert.strictEqual(alluvialMeta(rows[0]).id, "East");
  assert.strictEqual(sourceRows(rows[1]).length, 2);
});

/** A 600×400 chart laid out with no margins, ready to read. */
function draw(configure = viz => viz) {
  const viz = configure(
    new Alluvial().data(sales).dimensions(["region", "product", "channel"]),
  )
    .width(600)
    .height(400);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applyAlluvialLayout]);
  return {viz, shapeData, ctx: viz.ctx.alluvial};
}

it("Alluvial groups and colors by the colorBy column by default", () => {
  const {viz} = draw();
  const groupBy = alluvialGroupBy(viz);
  assert.strictEqual(groupBy(sales[0], 0), "West");
  assert.strictEqual(viz.schema.groupBy[0](sales[3], 3), "East");
  assert.deepStrictEqual(
    viz._legendData.map(d => viz._drawLabel(d, 0)).sort(),
    ["East", "West"],
  );
  const {viz: byChannel} = draw(v => v.colorBy("channel"));
  assert.deepStrictEqual(
    byChannel._legendData.map(d => byChannel._drawLabel(d, 0)).sort(),
    ["Online", "Store"],
  );
});

it("Alluvial leaves rows without an origin out of the legend", () => {
  const {viz} = draw(v =>
    v.data([...sales, {region: null, product: "Chairs", channel: "Online"}]),
  );
  assert.strictEqual(viz._legendData.length, 2);
});

it("Alluvial's layout stage builds datums and swaps in path rows", () => {
  const {viz, shapeData, ctx} = draw(v => v.value("units"));
  assert.strictEqual(shapeData.length, 6);
  assert.deepStrictEqual(
    ctx.titles.map(t => t.text),
    ["region", "product", "channel"],
  );
  const top = ctx.titles[0].height;
  assert.ok(top > 0, "titles take room");
  for (const d of shapeData) assert.ok(d.y0 >= top, "nodes sit below titles");
  const chairs = shapeData.find(d => d.node.label === "Chairs");
  assert.strictEqual(alluvialMeta(chairs.data).kind, "node");
  assert.strictEqual(chairs.data.units, 12, "a node's datum merges its rows");
  const band = ctx.bands.find(b => b.text === "West → Chairs → Online");
  assert.ok(band, "a band reads its full path");
  assert.strictEqual(band.datum.units, 5);
  assert.strictEqual(alluvialMeta(band.datum).id, "West");
  assert.strictEqual(viz._filteredData.length, 5, "one row per path");
  assert.strictEqual(alluvialValueTitle(viz), "units");
});

it("Alluvial re-lays out from its path rows", () => {
  const {viz} = draw();
  const {shapeData} = runStages({viz}, [applyAlluvialLayout]);
  assert.strictEqual(
    shapeData.reduce((s, d) => s + d.node.value, 0),
    18,
    "every row counted once per column",
  );
});

it("alluvialValueTitle names counts and accessor values", () => {
  const {viz} = draw();
  assert.strictEqual(alluvialValueTitle(viz), "Count");
  viz.value(d => d.units * 2);
  assert.strictEqual(alluvialValueTitle(viz), "Value");
});

it("alluvialHighlight traces exactly the rows a band or node carries", () => {
  const {ctx} = draw();
  const {graph} = ctx;
  const band = ctx.bands.find(b => b.text === "West → Chairs");
  // Its rows: West → Chairs → Online and West → Chairs → Store.
  assert.deepStrictEqual([...alluvialHighlight(graph, band.datum)].sort(), [
    "0|West",
    "0|West→1|Chairs@0|West",
    "1|Chairs",
    "1|Chairs→2|Online@0|West",
    "1|Chairs→2|Store@0|West",
    "2|Online",
    "2|Store",
  ]);
  const later = ctx.bands.find(b => b.text === "West → Chairs → Online");
  const fromLater = alluvialHighlight(graph, later.datum);
  assert.deepStrictEqual([...fromLater].sort(), [
    "0|West",
    "0|West→1|Chairs@0|West",
    "1|Chairs",
    "1|Chairs→2|Online@0|West",
    "2|Online",
  ]);
  assert.ok(
    !fromLater.has("0|West→1|Tables@0|West"),
    "the rest of West is not highlighted",
  );

  const tables = ctx.nodes.find(d => d.node.label === "Tables");
  const fromNode = alluvialHighlight(graph, tables.data);
  // Rows through Tables: West → Tables → Online, East → Tables → Store.
  assert.ok(fromNode.has("0|West") && fromNode.has("0|East"));
  assert.ok(!fromNode.has("1|Chairs"));
  const lit = graph.bands.filter(b => fromNode.has(b.id)).map(b => b.id);
  assert.strictEqual(lit.length, 4);
  assert.strictEqual(alluvialHighlight(graph, {}), null);
});

it("Alluvial tooltips title bands by path and list value and share", () => {
  const {viz, ctx} = draw(v => v.value("units"));
  const band = ctx.bands.find(b => b.text === "West → Chairs → Online");
  assert.strictEqual(
    alluvialTooltipTitle(viz, band.datum, 0),
    "West → Chairs → Online",
  );
  assert.deepStrictEqual(alluvialTooltipRows(viz, band.datum), [
    ["units", "5"],
    ["Share", "23.8%"],
  ]);
  const store = ctx.nodes.find(d => d.node.label === "Store");
  assert.strictEqual(alluvialTooltipTitle(viz, store.data, 0), "Store");
  assert.deepStrictEqual(alluvialTooltipRows(viz, store.data), [
    ["channel", "Store"],
    ["units", "10"],
    ["Share", "47.6%"],
  ]);
  const legend = viz._legendData[0];
  assert.strictEqual(alluvialTooltipTitle(viz, legend, 0), "West");
  assert.deepStrictEqual(alluvialTooltipRows(viz, legend), []);
  const config = viz.tooltipConfig();
  assert.strictEqual(config.title(band.datum, 0), "West → Chairs → Online");
  assert.strictEqual(config.tbody(band.datum).length, 2);
});

it("Alluvial's emit draws bands, nodes, labels, and titles", () => {
  const {viz} = draw();
  const scene = alluvialDef.emit({viz});
  const bands = scene.filter(n => n.type === "path");
  const rects = scene.filter(n => n.type === "rect");
  assert.strictEqual(bands.length, viz.ctx.alluvial.bands.length);
  assert.strictEqual(rects.length, 6);
  for (const b of bands) assert.strictEqual(b.paint.fillOpacity, 0.5);
  const fills = new Map();
  for (const b of bands) {
    const origin = alluvialMeta(b.datum).id;
    if (!fills.has(origin)) fills.set(origin, b.paint.fill);
    assert.strictEqual(b.paint.fill, fills.get(origin), "one color per origin");
  }
  assert.notStrictEqual(fills.get("West"), fills.get("East"));
  const west = rects.find(r => r.key === "alluvial-node-0|West");
  assert.strictEqual(west.paint.fill, fills.get("West"));
  const chairs = rects.find(r => r.key === "alluvial-node-1|Chairs");
  assert.notStrictEqual(chairs.paint.fill, fills.get("West"));
  assert.strictEqual(chairs.aria.label, "product: Chairs, 3.");
  const texts = scene
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
  for (const t of ["West", "Chairs", "Online", "region", "product", "channel"])
    assert.ok(texts.includes(t), `draws "${t}"`);
  const path = bands.find(b =>
    b.aria.label.startsWith("West → Chairs → Online"),
  );
  assert.ok(path, "bands are labeled by path");
  assert.deepStrictEqual(alluvialDef.emit({viz: {ctx: {}}}), []);
});

it("Alluvial's emit takes a custom node label and the band opacity", () => {
  const {viz} = draw(v =>
    v.bandOpacity(0.8).shapeConfig({Rect: {label: d => `#${d.region ?? "x"}`}}),
  );
  const scene = alluvialDef.emit({viz});
  assert.ok(
    scene
      .filter(n => n.type === "path")
      .every(n => n.paint.fillOpacity === 0.8),
  );
  const texts = scene
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
  assert.ok(texts.includes("#West"));
});

it("Alluvial hides the labels of nodes too thin to hold one", () => {
  const rows = [
    ...sales,
    {region: "Tiny", product: "Chairs", channel: "Online", units: 0.01},
  ];
  const {viz} = draw(v => v.data(rows).value("units"));
  const texts = alluvialDef
    .emit({viz})
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
  assert.ok(texts.includes("West"));
  assert.ok(!texts.includes("Tiny"), "the thin node has no label");
});

it("installAlluvialHover highlights paths and defers anything else", () => {
  const {viz, ctx} = draw();
  const calls = [];
  viz.hover = predicate => calls.push(predicate);
  const base = [];
  viz.schema.on.mouseenter = d => base.push(d);
  installAlluvialHover(viz);

  const band = ctx.bands.find(b => b.text === "West → Chairs");
  viz.schema.on.mouseenter(band.datum, 0);
  const lit = ctx.bands.filter(b => calls[0](b.datum)).map(b => b.band.id);
  assert.deepStrictEqual(lit.sort(), [
    "0|West→1|Chairs@0|West",
    "1|Chairs→2|Online@0|West",
    "1|Chairs→2|Store@0|West",
  ]);
  const nodes = ctx.nodes.filter(d => calls[0](d.data)).map(d => d.id);
  assert.deepStrictEqual(nodes.sort(), [
    "0|West",
    "1|Chairs",
    "2|Online",
    "2|Store",
  ]);
  assert.ok(!calls[0]({}), "anything else is not highlighted");

  const other = {id: "swatch"};
  viz.schema.on.mouseenter(other, 0);
  assert.deepStrictEqual(base, [other], "other datums use the base handler");

  viz.shapeConfig({hoverOpacity: 1});
  viz.schema.on.mouseenter(band.datum, 0);
  assert.strictEqual(calls.length, 1, "no hover when shape hover is off");
});
