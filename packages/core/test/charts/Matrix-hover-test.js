import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(closeBrowser);

/** Hovers the R1/C1 cell and reports which cells the row/column crosshair highlights. */
const crosshair = colorScale =>
  render("", colorScale =>
    new Promise(resolve => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const viz = new window.d3plus.Matrix()
        .select(el)
        .duration(0)
        .groupBy(["row", "column"])
        .data([
          {row: "R1", column: "C1", value: 10}, {row: "R1", column: "C2", value: 25},
          {row: "R2", column: "C1", value: 30}, {row: "R2", column: "C2", value: null},
        ]);
      if (colorScale) viz.colorScale(colorScale);
      viz.render(() => {
        const cell = viz._filteredData.find(d => d.row === "R1" && d.column === "C1");
        try {
          viz.schema.on["mousemove.shape"](cell, 0, cell, new MouseEvent("mousemove"));
          resolve(viz._filteredData.filter((d, i) => viz._hover(d, i)).map(d => `${d.row}/${d.column}`).sort());
        }
        catch (e) {
          resolve(e.message);
        }
      });
    }), colorScale);

it("Matrix hover highlights the hovered row and column without a colorScale", async function () {
  this.timeout(60000);
  assert.deepStrictEqual(await crosshair(), ["R1/C1", "R1/C2", "R2/C1"]);
});

it("Matrix hover skips cells the colorScale has no value for", async function () {
  this.timeout(60000);
  assert.deepStrictEqual(await crosshair("value"), ["R1/C1", "R1/C2", "R2/C1"]);
});
