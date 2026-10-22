import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Hovering a legend entry shows its tooltip; moving the pointer off the entry
    (onto empty chart space, or off the chart) hides it again. Covers legends
    whose entries merge several of the chart's groupBy members — a legend
    grouped by color, or by a shallower groupBy level than the chart draws —
    whose ids are arrays rather than single values.
*/

const body = `
  <div id="layout" style="width: 600px; height: 400px; position: absolute; left: 0; top: 0"></div>
  <div id="viz" style="width: 600px; height: 400px; position: absolute; left: 0; top: 0"></div>`;

const hoverLegend = ({chart, renderer}) =>
  new Promise((resolve, reject) => {
    const data = [
      {group: "A", id: "a1", value: 10}, {group: "A", id: "a2", value: 20},
      {group: "B", id: "b1", value: 15}, {group: "B", id: "b2", value: 25},
      {group: "C", id: "c1", value: 12}, {group: "C", id: "c2", value: 18},
    ];
    const tick = ms => new Promise(r => setTimeout(r, ms));
    const make = (sel, kind) =>
      new Promise(res => {
        const viz = new window.d3plus.Treemap().data(data).sum("value").legend(true)
          .duration(0).renderer(kind).select(sel);
        if (chart === "nested") viz.groupBy(["group", "id"]);
        else viz.groupBy("id").color("group");
        viz.render(() => res(viz));
      });
    // Moves the pointer as a browser reports it: a "mouseleave" on the
    // renderer's surface once the pointer is over none of its elements, then
    // a "mousemove" on the element under the pointer.
    let surface, over;
    const move = (x, y) => {
      const el = document.elementFromPoint(x, y) || document.body;
      if (over && surface.contains(over) && !surface.contains(el))
        surface.dispatchEvent(new MouseEvent("mouseleave", {clientX: x, clientY: y}));
      over = el;
      el.dispatchEvent(new MouseEvent("mousemove", {clientX: x, clientY: y, bubbles: true}));
    };
    const shown = viz =>
      [...(viz._tooltipClass._portalEl?.querySelectorAll(".d3plus-tooltip") ?? [])]
        .filter(t => getComputedStyle(t).visibility === "visible")
        .map(t => t.querySelector(".d3plus-tooltip-title").textContent);

    (async () => {
      // Lay the chart out in SVG to read the legend entries' positions, which
      // the canvas chart shares.
      await make("#layout", "svg");
      const labels = [...document.querySelectorAll('#layout [data-key="viz-legend"] text')];
      const center = text => {
        const b = labels.find(t => t.textContent.trim() === text).getBoundingClientRect();
        return [b.left + b.width / 2, b.top + b.height / 2];
      };
      const [a, b] = [center("A"), center("B")];
      // Entry A's swatch: the legend shape nearest the left of its label.
      const swatchA = [...document.querySelectorAll('#layout [data-key="viz-legend"] rect, #layout [data-key="viz-legend"] path')]
        .map(el => el.getBoundingClientRect())
        .filter(r => r.width > 2 && r.width < 40 && r.right <= a[0] && Math.abs(r.top + r.height / 2 - a[1]) < r.height)
        .sort((p, q) => q.right - p.right)[0];
      document.querySelector("#layout").remove();

      const viz = await make("#viz", renderer);
      surface = document.querySelector(renderer === "canvas" ? "#viz canvas" : "#viz svg.d3plus-render-svg");
      const out = {};

      move(...a);
      await tick(20);
      out.onEntry = shown(viz);
      // Label to swatch of the same entry is not a leave.
      move(swatchA.left + swatchA.width / 2, swatchA.top + swatchA.height / 2);
      await tick(20);
      out.onSwatch = shown(viz);
      // Empty space beside the legend row (its entries sit centered).
      move(5, a[1]);
      await tick(20);
      out.afterEmpty = shown(viz);

      move(...a);
      await tick(20);
      move(700, 500);
      await tick(20);
      out.afterOff = shown(viz);

      move(...a);
      move(...b);
      move(700, 500);
      await tick(20);
      out.afterSweep = shown(viz);

      resolve(out);
    })().catch(reject);
  });

for (const chart of ["nested", "color"])
  for (const renderer of ["svg", "canvas"])
    it(`legend tooltip (${chart} legend, ${renderer}): hides when the pointer leaves the entry`, {timeout: 120000}, async function () {
      const r = await render(body, hoverLegend, {chart, renderer});
      assert.deepStrictEqual(r.onEntry, ["A"], "hovering the entry shows its tooltip");
      assert.deepStrictEqual(r.onSwatch, ["A"], "moving to the entry's swatch keeps it");
      assert.deepStrictEqual(r.afterEmpty, [], "moving onto empty space hides it");
      assert.deepStrictEqual(r.afterOff, [], "leaving the chart hides it");
      assert.deepStrictEqual(r.afterSweep, [], "sweeping across entries and off hides it");
    });
