import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A BoxWhisker whose discrete axis is numeric (e.g. years) with several
    groupBy members per category used to place every box at `NaN`. Box
    positioned each box by re-reading the discrete accessor on the merged
    group datum, and `merge` sums numeric fields — five points at x=2000
    merged to x=10000, off the discrete scale. Each box now sits at its group
    key, so numeric categories land exactly where string ones do.
*/

after(async () => {
  await closeBrowser();
});

it("BoxWhisker places boxes on numeric discrete categories", async function () {
  this.timeout(60000);

  const out = await render("", () => {
    const run = (key, horizontal) =>
      new Promise(resolve => {
        const data = [];
        for (const id of ["a", "b", "c", "d", "e"])
          for (let year = 2000; year < 2005; year++)
            data.push({id, year: key(year), value: (year * 7 + id.charCodeAt(0) * 13) % 100});
        const el = document.createElement("div");
        document.body.appendChild(el);
        const viz = new window.d3plus.BoxWhisker()
          .select(el)
          .data(data)
          .groupBy("id")
          .duration(0)
          .width(800)
          .height(600);
        if (horizontal) viz.discrete("y").x("value").y("year");
        else viz.x("year").y("value");
        viz.render(() => {
          const rects = [
            ...el.querySelectorAll("g[data-key='plot-zoom-content'] rect.d3plus-render-rect"),
          ];
          const nan = [...el.querySelectorAll("*")].filter(n =>
            [...n.attributes].some(a => a.value.includes("NaN")),
          ).length;
          // The categorical coordinate of each box: x when vertical, y when horizontal.
          const coords = [
            ...new Set(
              rects
                .map(r => r.getAttribute("transform"))
                .filter(Boolean)
                .map(t => t.match(/translate\(([^,]+),([^)]+)\)/)[horizontal ? 2 : 1]),
            ),
          ].sort();
          resolve({nan, boxes: rects.length, coords});
        });
      });

    return (async () => ({
      vertical: [await run(y => y, false), await run(y => `Y${y}`, false)],
      horizontal: [await run(y => y, true), await run(y => `Y${y}`, true)],
    }))();
  });

  for (const [orient, [numeric, string]] of Object.entries(out)) {
    assert.strictEqual(numeric.nan, 0, `${orient}: no NaN attributes`);
    assert.ok(numeric.boxes > 0, `${orient}: boxes rendered`);
    assert.strictEqual(numeric.coords.length, 5, `${orient}: one box per category`);
    assert.deepStrictEqual(
      numeric.coords,
      string.coords,
      `${orient}: numeric categories land where string categories do`,
    );
  }
});
