import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Circle layering on a Plot, verified in a real browser (SVG backend):
    - With a `size` accessor set, circles default to largest-behind so smaller
      marks stay visible on top — no `sort` needed.
    - An explicit `shapeConfig.Circle.sort` overrides that default.
    The path is: size/user shapeConfig → configPrep (comparator passed through
    un-wrapped) → Shape.toScene (stamps per-datum z) → SvgRenderer (ascending z).
*/

const DATA = [
  {id: "big", x: 1, y: 1, size: 100},
  {id: "small", x: 2, y: 2, size: 4},
  {id: "mid", x: 3, y: 3, size: 40},
];

const pageFn = payload =>
  new Promise(resolve => {
    const chart = new window.d3plus.Plot()
      .select("#s")
      .data(payload.data)
      .size(d => d.size)
      .duration(0);
    // payload.sort: "asc" installs an explicit comparator that reverses the
    // default (smallest behind); undefined leaves the size-driven default.
    if (payload.sort === "asc")
      chart.shapeConfig({Circle: {sort: (a, b) => a.size - b.size}});
    chart.render(() => {
      const dataKeys = ["big", "mid", "small"];
      const rs = Array.from(
        document.querySelectorAll("circle.d3plus-render-circle"),
      )
        .filter(c =>
          dataKeys.includes(c.closest("[data-key]")?.getAttribute("data-key")),
        )
        .map(c => parseFloat(c.getAttribute("r")));
      resolve(rs);
    });
  });

it("Plot: size accessor alone layers circles largest-behind by default", async function () {
  this.timeout(60000);
  const radii = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    pageFn,
    {data: DATA},
  );
  assert.strictEqual(radii.length, 3, "three data circles rendered");
  assert.ok(
    radii.every((r, i) => i === 0 || radii[i - 1] >= r),
    `default: larger radii paint first (behind); DOM r order = ${radii}`,
  );
  assert.ok(radii[0] > radii[radii.length - 1], "smallest circle painted last (on top)");
});

it("Plot: explicit shapeConfig.Circle.sort overrides the size default", async function () {
  this.timeout(60000);
  const radii = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    pageFn,
    {data: DATA, sort: "asc"},
  );
  assert.strictEqual(radii.length, 3, "three data circles rendered");
  assert.ok(
    radii.every((r, i) => i === 0 || radii[i - 1] <= r),
    `override: smaller radii paint first (behind); DOM r order = ${radii}`,
  );
});
