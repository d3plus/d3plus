import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf} from "./colorScale-page.js";

/**
    A chart's tooltips live in a fixed portal on <body>, which stacks them as
    one layer: a `z-index` in `tooltipConfig.tooltipStyle` goes on that portal,
    so the tooltip draws above a page's fixed header; without one, the header
    covers it.
*/

const rows = [
  {id: "alpha", value: 30},
  {id: "beta", value: 20},
  {id: "gamma", value: 10},
];

const treemap = style => `lib => new lib.Treemap()
  .data(${JSON.stringify(rows)})
  .sum("value")
  ${style ? `.tooltipConfig({tooltipStyle: ${JSON.stringify(style)}})` : ""}`;

const alpha = `n => n.type === "rect" && n.datum && n.datum.id === "alpha"`;

/**
    Adds a fixed "header" at z-index 5 reaching to just above `point`, then
    reports the portal's z-index and whether the tooltip's top edge draws
    above the header.
*/
function stacking(page, point) {
  return page.evaluate(y => {
    const tooltip = document.querySelector(".d3plus-tooltip");
    const box = tooltip.getBoundingClientRect();
    let header = document.querySelector("#header");
    if (!header) {
      header = document.createElement("div");
      header.id = "header";
      header.style.cssText = `position:fixed;left:0;right:0;top:0;z-index:5;background:#ccc;height:${y - 20}px`;
      document.body.append(header);
    }
    // Tooltips ignore the pointer, so hit-test with it switched on.
    tooltip.style.pointerEvents = "auto";
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + 4,
    );
    tooltip.style.pointerEvents = "";
    const portal = tooltip.closest(".d3plus-tooltip-portal");
    return {
      overlaps: box.top + 4 < y - 20,
      onTop: tooltip.contains(hit),
      zIndex: getComputedStyle(portal).zIndex,
    };
  }, point[1]);
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a tooltipStyle z-index lifts the tooltip above a fixed header`, async () => {
    const {page, close} = await chart(treemap({"z-index": "20"}), renderer);
    try {
      const point = await pointOf(page, alpha);
      await hover(page, point);
      const result = await stacking(page, point);
      assert.ok(result.overlaps, "the tooltip reaches the header");
      assert.strictEqual(result.zIndex, "20");
      assert.ok(result.onTop, "the tooltip draws above the header");
    } finally {
      await close();
    }
  });

  it(`${renderer}: without a z-index the portal stays auto, under the header`, async () => {
    const {page, close} = await chart(treemap(), renderer);
    try {
      const point = await pointOf(page, alpha);
      await hover(page, point);
      const result = await stacking(page, point);
      assert.ok(result.overlaps, "the tooltip reaches the header");
      assert.strictEqual(result.zIndex, "auto");
      assert.ok(!result.onTop, "the header covers the tooltip");
    } finally {
      await close();
    }
  });

  it(`${renderer}: changing the z-index restacks the portal`, async () => {
    const {page, close} = await chart(treemap({"z-index": "20"}), renderer);
    try {
      const point = await pointOf(page, alpha);
      await hover(page, point);
      assert.ok((await stacking(page, point)).onTop, "above at 20");
      await page.mouse.move(1, 700);
      await page.evaluate(() =>
        window.__viz.tooltipConfig({tooltipStyle: {"z-index": "3"}}),
      );
      await hover(page, point);
      const result = await stacking(page, point);
      assert.strictEqual(result.zIndex, "3");
      assert.ok(!result.onTop, "under the header at 3");
    } finally {
      await close();
    }
  });
}
