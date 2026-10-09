/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Hovering a Pack legend entry highlights the circles inside it. The entry's
    datum carries internal flags (numbers, booleans) beside its merged data
    fields, which the match must skip rather than call `.includes` on.
*/

after(closeBrowser);

it("Pack — hovering a legend entry highlights its circles without throwing", async () => {
  const opacity = await render('<div id="viz" style="width:700px;height:500px"></div>', () =>
    new Promise(resolve => {
      const viz = new window.d3plus.Pack().groupBy(["group", "id"]).sum("value").data([
        {group: "A", id: "1", value: 10}, {group: "A", id: "2", value: 20},
        {group: "B", id: "3", value: 15}, {group: "B", id: "4", value: 25},
      ]).duration(0).select("#viz");
      viz.render(() => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const label = Array.from(svg.querySelectorAll('[data-key="viz-legend"] text'))
          .find(t => t.textContent.trim() === "A");
        const b = label.getBoundingClientRect();
        const [cx, cy] = [b.left + b.width / 2, b.top + b.height / 2];
        (document.elementFromPoint(cx, cy) || label)
          .dispatchEvent(new MouseEvent("mousemove", {clientX: cx, clientY: cy, bubbles: true}));
        requestAnimationFrame(() => setTimeout(() => {
          const out = {};
          for (const id of ["1", "2", "3", "4"]) {
            const circle = Array.from(svg.querySelectorAll("circle"))
              .find(c => new RegExp(`^pack-${id}-`).test(c.getAttribute("data-key") || ""));
            out[id] = Number(circle.getAttribute("opacity") ?? 1);
          }
          resolve(out);
        }, 40));
      });
    }));
  assert.strictEqual(opacity["1"], 1, "A's circles stay lit");
  assert.strictEqual(opacity["2"], 1);
  assert.ok(opacity["3"] < 1, `B's circles dim: ${JSON.stringify(opacity)}`);
  assert.ok(opacity["4"] < 1);
});
