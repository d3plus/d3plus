import assert from "assert";
import {BarChart, Pie} from "@d3plus/core";
import {renderToStaticPNG, renderToStaticSVG} from "../es/index.js";

/** Small multiples (`facet`) render on the server like any other chart. */

const rows = [];
["East", "North", "West"].forEach((region, r) =>
  ["A", "B"].forEach((id, i) =>
    [2020, 2021].forEach(year => rows.push({region, id, year, value: 5 + r * 3 + i * 2 + (year - 2020)}))));

it("renderToStaticSVG draws one titled panel per facet value", async () => {
  const svg = await renderToStaticSVG(
    new BarChart().data(rows).groupBy("id").x("year").y("value").facet("region"),
    {width: 600, height: 400},
  );
  for (const region of ["East", "North", "West"]) {
    assert.ok(svg.includes(`data-key="facet-${region}"`), `a ${region} panel`);
    assert.ok(svg.includes(`>${region}<`), `a ${region} title`);
  }
});

it("renderToStaticPNG rasterizes faceted charts", async () => {
  const png = await renderToStaticPNG(
    new Pie().data(rows.filter(d => d.year === 2021)).groupBy("id").value("value").facet("region"),
    {width: 600, height: 300},
  );
  assert.ok(png.length > 1000, "non-trivial PNG");
});
