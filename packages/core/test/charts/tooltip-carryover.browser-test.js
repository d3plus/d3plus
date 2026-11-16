import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf, tooltipRows} from "./colorScale-page.js";

/**
    A Scatter's tooltip keeps its `tbody` from hover to hover, so the rows a
    hover adds (a point's confidence bounds, its colorScale value) belong to
    the mark hovered: hovering one point, then another, lists only the
    second's rows, as a fresh hover of it does.
*/

const rows = [
  {id: "alpha", x: 1, y: 4, lo: 2, hi: 6, value: 1200},
  {id: "beta", x: 2, y: 6, lo: 5, hi: 9, value: 3400},
  {id: "gamma", x: 3, y: 8, lo: 7, hi: 11, value: 5600},
];

const scatter = `lib => new lib.Scatter()
  .data(${JSON.stringify(rows)})
  .groupBy("id")
  .x("x")
  .y("y")
  .confidence(["lo", "hi"])
  .colorScale("value")`;

/** The matcher for the circle drawn for row `id`. */
const circle = id =>
  `n => n.type === "circle" && n.datum && n.datum.id === ${JSON.stringify(id)}`;

/** Hovers each of `ids` in turn, reading the tooltip after each. */
async function hoverEach(renderer, ids) {
  const {page, close} = await chart(scatter, renderer);
  try {
    const out = [];
    for (const id of ids) {
      await hover(page, await pointOf(page, circle(id)));
      out.push(await tooltipRows(page));
    }
    return out;
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Scatter — a hover lists only the hovered point's rows`, async () => {
    const [fresh] = await hoverEach(renderer, ["beta"]);
    assert.deepStrictEqual(fresh, [
      ["value", "3.4k"],
      ["Lower Bound", "5"],
      ["Upper Bound", "9"],
    ]);
    const [, afterAlpha, , again] = await hoverEach(renderer, [
      "alpha",
      "beta",
      "gamma",
      "beta",
    ]);
    assert.deepStrictEqual(afterAlpha, fresh, "after another point");
    assert.deepStrictEqual(again, fresh, "after two more hovers");
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Scatter — a legend entry lists none of a hovered point's rows`, async () => {
    const src = scatter.replace(`.colorScale("value")`, ".legend(true)");
    const {page, close} = await chart(src, renderer);
    try {
      await hover(page, await pointOf(page, circle("beta")));
      assert.deepStrictEqual(await tooltipRows(page), [
        ["Lower Bound", "5"],
        ["Upper Bound", "9"],
      ]);
      await hover(
        page,
        await pointOf(
          page,
          `n => n.type === "circle" && n.datum && "label" in n.datum && String(n.key).startsWith("alpha")`,
        ),
      );
      const body = await tooltipRows(page);
      assert.ok(!body.some(r => /Bound/.test(r[0])), JSON.stringify(body));
    } finally {
      await close();
    }
  });
}

/** Points around 10, with one outlier at 40; each has bounds 1 either side. */
const outlierRows = [11, 12, 10, 13, 11, 12, 40, 10, 12].map((y, k) => ({
  id: `p${k}`,
  x: k,
  y,
  lo: y - 1,
  hi: y + 1,
}));

const outlierScatter = `lib => new lib.Scatter()
  .data(${JSON.stringify(outlierRows)})
  .groupBy("id")
  .x("x")
  .y("y")
  .confidence(["lo", "hi"])
  .outlier(true)
  .legend(false)`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Scatter — an outlier lists its bounds, then Outlier, and the next point neither`, async () => {
    const {page, close} = await chart(outlierScatter, renderer);
    try {
      await hover(page, await pointOf(page, circle("p6")));
      assert.deepStrictEqual(await tooltipRows(page), [
        ["Lower Bound", "39"],
        ["Upper Bound", "41"],
        ["Outlier"],
      ]);
      await hover(page, await pointOf(page, circle("p5")));
      assert.deepStrictEqual(await tooltipRows(page), [
        ["Lower Bound", "11"],
        ["Upper Bound", "13"],
      ]);
      await hover(page, await pointOf(page, circle("p6")));
      assert.deepStrictEqual(
        (await tooltipRows(page)).filter(r => r[0] === "Outlier").length,
        1,
        "one Outlier row however often it's hovered",
      );
    } finally {
      await close();
    }
  });
}
