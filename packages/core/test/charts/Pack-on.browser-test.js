/* global MouseEvent */
import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Pack seeds its own hover handlers into `on` without replacing the
    `on(typename, handler)` method every chart inherits, so user listeners
    register, read back, merge, and fire.
*/

after(closeBrowser);

it("Pack — on(typename, handler) registers, reads back, merges, and fires", async () => {
  const out = await render(
    '<div id="viz" style="width:600px;height:400px"></div>',
    () =>
      new Promise(resolve => {
        const clicked = [];
        const onClick = d => clicked.push(d.id);
        const extra = () => undefined;
        const viz = new window.d3plus.Pack()
          .groupBy(["group", "id"])
          .sum("value")
          .data([
            {group: "A", id: "1", value: 10},
            {group: "A", id: "2", value: 20},
            {group: "B", id: "3", value: 15},
            {group: "B", id: "4", value: 25},
          ])
          .duration(0)
          .select("#viz");
        const chained = viz.on("click.shape", onClick) === viz;
        viz.on({"click.legend": extra});
        viz.render(() => {
          const handlers = viz.on();
          // The smallest packed leaf (legend swatches are circles too, so pick by key).
          const circle = Array.from(
            document.querySelectorAll('#viz circle[data-key^="pack-"]'),
          )
            .filter(c => !/root|undefined/.test(c.getAttribute("data-key")))
            .sort(
              (a, b) =>
                a.getBoundingClientRect().width -
                b.getBoundingClientRect().width,
            )[0];
          const b = circle.getBoundingClientRect();
          const [cx, cy] = [b.left + b.width / 2, b.top + b.height / 2];
          (document.elementFromPoint(cx, cy) || circle).dispatchEvent(
            new MouseEvent("click", {clientX: cx, clientY: cy, bubbles: true}),
          );
          setTimeout(
            () =>
              resolve({
                chained,
                readBack: viz.on("click.shape") === onClick,
                mergedObject: handlers["click.legend"] === extra,
                keepsPackHover:
                  typeof handlers["mousemove.shape"] === "function",
                typeofOn: typeof handlers,
                clicked,
              }),
            50,
          );
        });
      }),
  );
  assert.strictEqual(
    out.chained,
    true,
    "on(typename, handler) returns the chart",
  );
  assert.strictEqual(
    out.typeofOn,
    "object",
    "on() returns the handler map, not a string",
  );
  assert.strictEqual(out.readBack, true, "on(typename) reads the handler back");
  assert.strictEqual(out.mergedObject, true, "on({…}) merges handlers");
  assert.strictEqual(
    out.keepsPackHover,
    true,
    "Pack's own hover handler is still installed",
  );
  assert.deepStrictEqual(
    out.clicked,
    ["1"],
    "clicking a leaf circle fires the user handler with its datum",
  );
});
