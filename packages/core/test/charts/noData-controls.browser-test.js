import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    While a chart shows its no-data message, its zoom controls and top-left
    controls (download, search, table view) are hidden, and they come back
    when data returns. Run with both renderers.
*/

const data = [
  {id: "alpha", x: "A", y: 30},
  {id: "beta", x: "B", y: 50},
];

/** The control buttons drawn, by their classes. */
const controlsSrc = `() => ({
  zoom: document.querySelectorAll("#viz .zoom-control").length,
  topLeft: document.querySelectorAll(
    "#viz .save-control, #viz .search-control, #viz .table-view-control"
  ).length,
  message: Array.from(document.querySelectorAll("#viz .d3plus-Message"))
    .map(el => el.textContent.trim()).join(" "),
})`;

for (const renderer of ["svg", "canvas"]) {
  it(
    `${renderer}: no data hides the zoom and top-left controls; data brings them back`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="viz" style="width: 600px; height: 300px"></div>`,
        async ({data, renderer, controlsSrc}) => {
          const controls = eval(controlsSrc);
          const draw = (viz, rows) =>
            new Promise(res => viz.data(rows).render(() => res()));
          const viz = new window.d3plus.BarChart()
            .groupBy("id")
            .x("x")
            .y("y")
            .duration(0)
            .zoom(true)
            .renderer(renderer)
            .select("#viz");
          await draw(viz, data);
          const before = controls();
          await draw(viz, []);
          const empty = controls();
          await draw(viz, data);
          const after = controls();
          return {before, empty, after};
        },
        {data, renderer, controlsSrc},
      );
      assert.ok(r.before.zoom > 0, "zoom controls with data");
      assert.ok(r.before.topLeft > 0, "top-left controls with data");
      assert.ok(/No Data/.test(r.empty.message), r.empty.message);
      assert.strictEqual(r.empty.zoom, 0, "no zoom controls without data");
      assert.strictEqual(r.empty.topLeft, 0, "no top-left controls");
      assert.strictEqual(r.after.zoom, r.before.zoom, "zoom controls return");
      assert.strictEqual(r.after.topLeft, r.before.topLeft, "and the rest");
    },
  );
}
