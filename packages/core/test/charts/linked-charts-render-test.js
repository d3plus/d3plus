import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

const boxes = `
  <div id='a' style='width:400px;height:300px'></div>
  <div id='b' style='width:400px;height:300px'></div>`;

/** Builds a Treemap (#a) and BarChart (#b) linked under one group, then runs `body` in the page. */
function linkedCharts(body) {
  return render(boxes, new Function(`return (async () => {
    const data = [
      {country: "Brazil", value: 10},
      {country: "Chile", value: 5},
      {country: "France", value: 8},
    ];
    const a = new window.d3plus.Treemap()
      .select("#a").data(data).groupBy("country").sum("value")
      .link("dash").width(400).height(300).duration(0);
    const b = new window.d3plus.BarChart()
      .select("#b").data(data).groupBy("country").x("country").y("value")
      .link("dash").width(400).height(300).duration(0);
    await new Promise(r => a.render(r));
    await new Promise(r => b.render(r));
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const bars = () => Array.from(document.querySelectorAll("#b svg rect.d3plus-render-rect"))
      .map(el => +(el.getAttribute("opacity") ?? 1)).sort();
    ${body}
  })()`));
}

it("hovering a Treemap tile dims the other bars in a linked BarChart", async function () {
  this.timeout(60000);
  const result = await linkedCharts(`
    a.hover(d => d.country === "Brazil");
    await frame();
    const hovered = b._hover ? ["Brazil", "Chile"].map(c => b._hover({country: c}, 0)) : null;
    const dimmed = bars();
    a.hover(false);
    await frame();
    return {hovered, dimmed, cleared: b._hover, restored: bars()};
  `);
  assert.deepStrictEqual(result.hovered, [true, false], "the BarChart hovers only Brazil");
  assert.deepStrictEqual(result.dimmed, [0.5, 0.5, 1], "the painted BarChart dims Chile and France");
  assert.deepStrictEqual(result.restored, [1, 1, 1], "…and restores them on clear");
  assert.strictEqual(result.cleared, false, "clearing the Treemap hover clears the BarChart");
});

it("hiding a legend item in one chart hides it in the linked chart", async function () {
  this.timeout(60000);
  const result = await linkedCharts(`
    const legendDatum = a._legendData.find(d => d.country === "Chile");
    a.schema.on["click.legend"](legendDatum, 0, undefined, {shiftKey: false});
    await new Promise(r => setTimeout(r, 200));
    return {
      hidden: b._hidden,
      drawn: b._filteredData.map(d => d.country).sort(),
    };
  `);
  assert.deepStrictEqual(result.hidden, ["Chile"]);
  assert.deepStrictEqual(result.drawn, ["Brazil", "France"], "the BarChart re-rendered without Chile");
});

it("linked charts give each value the same color", async function () {
  this.timeout(60000);
  const result = await render(boxes, async () => {
    // Europe leads the bar data but trails in the treemap (sorted by size), so
    // separately-scaled charts would swap the two regions' colors.
    const data = [
      {region: "Europe", country: "France", value: 4},
      {region: "Americas", country: "Brazil", value: 30},
      {region: "Americas", country: "Chile", value: 20},
    ];
    const a = new window.d3plus.Treemap()
      .select("#a").data([...data].reverse()).groupBy(["region", "country"]).sum("value")
      .link("dash").width(400).height(300).duration(0);
    const b = new window.d3plus.BarChart()
      .select("#b").data(data).groupBy("country").color("region").x("country").y("value")
      .link("dash").width(400).height(300).duration(0);
    await new Promise(r => a.render(r));
    await new Promise(r => b.render(r));
    const fill = (viz, row) => viz.schema.shapeConfig.fill(row, 0);
    return data.map(row => [fill(a, row), fill(b, row)]);
  });
  result.forEach(([a, b]) => assert.strictEqual(a, b));
  assert.notStrictEqual(result[0][0], result[1][0], "the two regions still differ");
});
