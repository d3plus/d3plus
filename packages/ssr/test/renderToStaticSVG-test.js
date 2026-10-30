import {it} from "vitest";
import assert from "assert";
import {
  Alluvial,
  BarChart,
  BubbleChart,
  Donut,
  Gantt,
  Hexbin,
  LinePlot,
  Scatter,
  SlopeChart,
  Streamgraph,
  Treemap,
} from "@d3plus/core";
import {renderToStaticSVG} from "../index.ts";

const data = [
  {parent: "A", id: "alpha", value: 29},
  {parent: "A", id: "beta", value: 10},
  {parent: "B", id: "gamma", value: 22},
];

it("renderToStaticSVG returns a standalone SVG string for a Treemap", async () => {
  const svg = await renderToStaticSVG(
    new Treemap().data(data).groupBy(["parent", "id"]),
    {width: 500, height: 350},
  );
  assert.ok(svg.startsWith("<svg"), "starts with <svg");
  assert.ok(
    svg.includes('xmlns="http://www.w3.org/2000/svg"'),
    "includes the SVG namespace",
  );
  assert.ok((svg.match(/<rect/g) || []).length >= 3, "has cell rects");
  assert.ok(
    (svg.match(/<text/g) || []).length >= 3,
    "has measured text labels",
  );
});

it("renderToStaticSVG works across chart families", async () => {
  const line = [
    {id: "x", year: 2010, value: 5},
    {id: "x", year: 2011, value: 9},
    {id: "x", year: 2012, value: 7},
  ];
  const charts = [
    new BarChart().data(data).groupBy("id").x("id").y("value"),
    new Donut()
      .data(data)
      .groupBy("id")
      .value(d => d.value),
    new LinePlot().data(line).groupBy("id").x("year").y("value"),
  ];
  for (const viz of charts) {
    const svg = await renderToStaticSVG(viz, {width: 400, height: 300});
    assert.ok(svg.includes("<svg"), "is an svg");
    assert.ok(svg.length > 300, "non-trivial output");
  }
});

it("renderToStaticSVG renders Scatter, BubbleChart, and Streamgraph", async () => {
  const points = [
    {id: "a", x: 1, y: 4, size: 10},
    {id: "b", x: 2, y: 9, size: 40},
    {id: "c", x: 3, y: 6, size: 90},
  ];
  const streams = ["a", "b", "c"].flatMap((id, g) =>
    [2010, 2011, 2012].map((year, t) => ({id, year, value: 5 + g + t})),
  );
  const charts = [
    [
      "Scatter",
      new Scatter().data(points).groupBy("id").x("x").y("y"),
      /<circle/g,
    ],
    [
      "BubbleChart",
      new BubbleChart().data(points).groupBy("id").x("x").y("y").size("size"),
      /<circle/g,
    ],
    [
      "Streamgraph",
      new Streamgraph().data(streams).groupBy("id").x("year").y("value"),
      /<path[^>]*d="M/g,
    ],
  ];
  for (const [name, viz, mark] of charts) {
    const svg = await renderToStaticSVG(viz, {width: 400, height: 300});
    assert.ok(svg.startsWith("<svg"), `${name} is an svg`);
    assert.ok((svg.match(mark) || []).length >= 3, `${name} draws its marks`);
  }
});

it("renderToStaticSVG renders Hexbin bins", async () => {
  const rows = [
    [1, 1, 5],
    [4, 6, 3],
    [8, 2, 1],
  ].flatMap(([x, y, n]) => Array.from({length: n}, () => ({x, y})));
  const svg = await renderToStaticSVG(new Hexbin().data(rows).x("x").y("y"), {
    width: 400,
    height: 300,
  });
  assert.ok(svg.startsWith("<svg"));
  const hexagons = svg.match(/<path[^>]*d="M[\d.]+,[\d.]+L[^"]*Z"/g) || [];
  assert.ok(hexagons.length >= 3, `draws the bins (${hexagons.length})`);
});

it("renderToStaticSVG renders a SlopeChart with labels at both ends", async () => {
  const rows = [
    ["Brazil", 41, 47],
    ["Chile", 30, 36],
    ["Peru", 31, 30],
  ].flatMap(([id, a, b]) => [
    {id, year: 2015, value: a},
    {id, year: 2024, value: b},
  ]);
  const svg = await renderToStaticSVG(
    new SlopeChart().data(rows).groupBy("id").x("year").y("value"),
    {width: 400, height: 300},
  );
  assert.ok(svg.startsWith("<svg"), "is an svg");
  assert.strictEqual((svg.match(/<circle/g) || []).length, 6, "end markers");
  for (const label of ["Brazil 41", "Brazil 47", "Peru 31", "Peru 30"])
    assert.ok(svg.includes(label), `labels "${label}"`);
});

it("renderToStaticSVG renders a Gantt's bars, milestone, and dependency arrow", async () => {
  const viz = new Gantt()
    .data([
      {id: "Plan", start: "2024-03-04", end: "2024-03-08", progress: 0.5},
      {
        id: "Build",
        start: "2024-03-11",
        end: "2024-03-22",
        dependencies: ["Plan"],
      },
      {
        id: "Launch",
        start: "2024-03-25",
        end: "2024-03-25",
        dependencies: ["Build"],
      },
    ])
    .groupBy("id");
  const svg = await renderToStaticSVG(viz, {width: 500, height: 240});
  assert.ok(svg.startsWith("<svg"));
  assert.ok(
    (svg.match(/<rect[^>]*data-key="gantt-task-/g) || []).length >= 3,
    "bars",
  );
  assert.ok(/data-key="gantt-milestone-Launch"/.test(svg), "milestone");
  assert.ok(/data-key="gantt-dependency-Plan-Build"/.test(svg), "arrow");
  for (const label of ["Plan", "Build", "Launch"])
    assert.ok(svg.includes(`>${label}<`), `labels ${label}`);
});

it("renderToStaticSVG renders an Alluvial", async () => {
  const rows = [
    {region: "West", product: "Chairs", channel: "Online"},
    {region: "West", product: "Tables", channel: "Store"},
    {region: "East", product: "Chairs", channel: "Store"},
  ];
  const svg = await renderToStaticSVG(
    new Alluvial().data(rows).dimensions(["region", "product", "channel"]),
    {width: 400, height: 300},
  );
  assert.ok(svg.startsWith("<svg"), "is an svg");
  assert.ok((svg.match(/<rect/g) || []).length >= 6, "draws its nodes");
  assert.ok(
    (svg.match(/<path[^>]*d="M[^"]*C/g) || []).length >= 4,
    "draws its bands",
  );
  for (const title of ["region", "product", "channel"])
    assert.ok(svg.includes(`>${title}<`), `titles the ${title} column`);
});

it("renderToStaticSVG reads dimensions from the chart when omitted", async () => {
  const svg = await renderToStaticSVG(
    new Treemap().data(data).groupBy("id").width(320).height(240),
  );
  assert.ok(svg.includes("0 0 320 240"), "viewBox matches chart size");
});

it("renderToStaticSVG throws without any dimensions", async () => {
  await assert.rejects(
    () => renderToStaticSVG(new Treemap().data(data).groupBy("id")),
    /width and height/,
  );
});

it("renderToStaticSVG restores globals after rendering", async () => {
  await renderToStaticSVG(new Treemap().data(data).groupBy("id"), {
    width: 300,
    height: 200,
  });
  assert.strictEqual(typeof globalThis.document, "undefined");
});

it("renderToStaticSVG loads a polled URL once and leaves no poll running", async () => {
  const native = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify(data), {status: 200});
  };
  try {
    const viz = new Treemap()
      .data("https://example.com/data.json")
      .groupBy(["parent", "id"])
      .dataPollingInterval(50);
    const svg = await renderToStaticSVG(viz, {width: 500, height: 350});
    assert.ok((svg.match(/<rect/g) || []).length >= 3, "drew the loaded rows");
    assert.strictEqual(viz._dataPollStop, undefined, "no poll was started");
    await new Promise(r => setTimeout(r, 200));
    assert.strictEqual(requests, 1, "fetched once");
  } finally {
    globalThis.fetch = native;
  }
});

it("renderToStaticSVG keeps the chart's className on the root svg", async () => {
  const svg = await renderToStaticSVG(
    new Treemap().data(data).groupBy("id").className("revenue-chart dark"),
    {width: 300, height: 200},
  );
  const root = svg.slice(0, svg.indexOf(">") + 1);
  assert.ok(/class="[^"]*revenue-chart dark"/.test(root), root);
});

it("renderToStaticSVG paints a forced theme's background", async () => {
  const dark = await renderToStaticSVG(
    new Treemap().data(data).groupBy("id").theme("dark"),
    {width: 300, height: 200},
  );
  const rect = /<rect[^>]*data-key="viz-background"[^>]*>/.exec(dark);
  assert.ok(rect, "the background rect is in the markup");
  assert.ok(/fill="(#212529|rgb\(33, 37, 41\))"/.test(rect[0]), rect[0]);
  const auto = await renderToStaticSVG(new Treemap().data(data).groupBy("id"), {
    width: 300,
    height: 200,
  });
  assert.ok(!auto.includes('data-key="viz-background"'), "auto paints none");
});

it("renderToStaticSVG labels fall back down the font list", async () => {
  // The render measures with the first family installed on this machine; a
  // browser opening the SVG may not have it, so each label names the
  // families after it too, ending in a generic family.
  const svg = await renderToStaticSVG(
    new Treemap().data(data).groupBy(["parent", "id"]).title("Title"),
    {width: 500, height: 350},
  );
  const families = [...svg.matchAll(/font-family="([^"]*)"/g)].map(m => m[1]);
  assert.ok(families.length >= 4, "labels and title name a font");
  for (const family of families)
    assert.match(family, /(^|, )sans-serif$/, `"${family}" falls back`);

  // `monospace` always counts as installed, so these labels measure with it
  // on any machine and keep the rest of their list.
  const mono = await renderToStaticSVG(
    new Treemap()
      .data(data)
      .groupBy(["parent", "id"])
      .shapeConfig({
        labelConfig: {fontFamily: ["monospace", "Courier New", "sans-serif"]},
      }),
    {width: 500, height: 350},
  );
  assert.ok(
    mono.includes(`font-family="monospace, 'Courier New', sans-serif"`),
    "a label names the families after the one it measured",
  );
});
