import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An open table view closes while the chart has no data, moving keyboard
    focus that was inside it to the chart (its keyboard-navigation host, or
    its root svg when keyboard navigation is off), and reopens when
    data returns. Run with both renderers.
*/

const data = [
  {id: "alpha", x: "A", y: 30},
  {id: "beta", x: "B", y: 50},
];

const stateSrc = `() => {
  const active = document.activeElement;
  return {
    open: document.querySelectorAll("#viz .d3plus-table-view").length,
    focus:
      active === document.body
        ? "body"
        : active?.getAttribute("class") || active?.tagName,
    inTable: Boolean(active?.closest(".d3plus-table-view")),
  };
}`;

for (const renderer of ["svg", "canvas"]) {
  for (const keyboardNav of [true, false]) {
    it(
      `${renderer}${keyboardNav ? "" : ", keyboardNav off"}: no data closes the table view, keeps focus on the chart, and data reopens it`,
      {timeout: 120000},
      async function () {
        const r = await render(
          `<div id="viz" style="width: 600px; height: 300px"></div>`,
          async ({data, renderer, keyboardNav, stateSrc}) => {
            const state = eval(stateSrc);
            const draw = (viz, rows) =>
              new Promise(res => viz.data(rows).render(() => res()));
            const viz = new window.d3plus.BarChart()
              .groupBy("id")
              .x("x")
              .y("y")
              .duration(0)
              .keyboardNav(keyboardNav)
              .renderer(renderer)
              .select("#viz");
            await draw(viz, data);
            document.querySelector("#viz .table-view-toggle").click();
            document.querySelector("#viz .d3plus-table-view button").focus();
            const opened = state();
            await draw(viz, []);
            const empty = state();
            await draw(viz, data);
            const back = state();
            return {opened, empty, back};
          },
          {data, renderer, keyboardNav, stateSrc},
        );
        assert.strictEqual(r.opened.open, 1, "the table view opened");
        assert.ok(r.opened.inTable, "focus starts inside it");
        assert.strictEqual(r.empty.open, 0, "closed without data");
        assert.ok(
          keyboardNav
            ? /d3plus-keyboard-nav/.test(r.empty.focus)
            : /d3plus-viz/.test(r.empty.focus),
          `focus moved to the chart (got ${r.empty.focus})`,
        );
        assert.strictEqual(r.back.open, 1, "reopened with the data");
        assert.strictEqual(r.back.focus, r.empty.focus, "focus stays put");
      },
    );
  }
}
