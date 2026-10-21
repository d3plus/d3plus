import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Each waterfall bar is alone in its stack, so Waterfall opts out of Plot's
    stack shares: no share on its rows, its table view, its labels, or its
    tooltip.
*/

after(closeBrowser);

const bridge = [
  {step: "Opening", v: 1000, sub: true},
  {step: "Price", v: 15},
  {step: "Volume", v: -8},
  {step: "Mix", v: 13},
  {step: "Closing", sub: true},
];

const body = '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';

it("Waterfall rows carry no stack share; a stacked BarChart's still do", async function () {
  this.timeout(60000);
  const out = await render(body, ([data]) =>
    new Promise(resolve => {
      const viz = new window.d3plus.Waterfall()
        .data(data)
        .x("step")
        .y("v")
        .subtotal("sub")
        .duration(0)
        .tooltipShared(false)
        .select("#viz");
      viz.render(() => {
        const rows = [...viz._filteredData, ...viz._data];
        const shared = rows.filter(d => "share" in d || "__d3plusShare" in d).length;
        const texts = Array.from(document.querySelectorAll("#viz [data-key$='plot-zoom-content'] text")).map(t => t.textContent);
        const row = viz._filteredData.find(d => d.step === "Price");
        viz.schema.on["mousemove.shape"](row, 0, row, new MouseEvent("mousemove", {clientX: 100, clientY: 100}));
        const tip = Array.from(document.querySelectorAll(".d3plus-tooltip-tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent));
        document.querySelector(".d3plus-top-left-controls-item .table-view-toggle").click();
        const headers = Array.from(document.querySelectorAll(".d3plus-table-view-table thead th")).map(th => th.textContent.trim());
        document.querySelector("#viz").innerHTML = "";
        const bars = new window.d3plus.BarChart()
          .data([{id: "a", x: "A", y: 10}, {id: "b", x: "A", y: 30}])
          .groupBy("id")
          .x("x")
          .y("y")
          .stacked(true)
          .duration(0)
          .select("#viz");
        bars.render(() => resolve({
          shared, texts, tip, headers,
          barShares: bars._filteredData.map(d => d.__d3plusShare).sort(),
        }));
      });
    }), [bridge]);

  assert.strictEqual(out.shared, 0, "no row carries share or __d3plusShare");
  assert.deepStrictEqual(out.texts.slice().sort(), ["+13", "+15", "-8", "1.02k", "1k"].sort(), `one line per label: ${out.texts}`);
  assert.ok(out.tip.length && !out.tip.some(r => r[0] === "Share"), `no Share tooltip row: ${JSON.stringify(out.tip)}`);
  assert.ok(out.headers.length && !out.headers.includes("share"), `no share column: ${out.headers}`);
  assert.deepStrictEqual(out.barShares, [0.25, 0.75], "a stacked BarChart still stamps its shares");
});
