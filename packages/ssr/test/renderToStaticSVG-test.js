import assert from "assert";
import {BarChart, Donut, LinePlot, Treemap} from "@d3plus/core";
import {renderToStaticSVG} from "../es/index.js";

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
  assert.ok((svg.match(/<text/g) || []).length >= 3, "has measured text labels");
});

it("renderToStaticSVG works across chart families", async () => {
  const line = [
    {id: "x", year: 2010, value: 5},
    {id: "x", year: 2011, value: 9},
    {id: "x", year: 2012, value: 7},
  ];
  const charts = [
    new BarChart().data(data).groupBy("id").x("id").y("value"),
    new Donut().data(data).groupBy("id").value(d => d.value),
    new LinePlot().data(line).groupBy("id").x("year").y("value"),
  ];
  for (const viz of charts) {
    const svg = await renderToStaticSVG(viz, {width: 400, height: 300});
    assert.ok(svg.includes("<svg"), "is an svg");
    assert.ok(svg.length > 300, "non-trivial output");
  }
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
