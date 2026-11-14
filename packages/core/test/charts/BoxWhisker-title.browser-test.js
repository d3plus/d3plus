import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, nodePoint, tooltip} from "./axis-tooltip-page.js";

/**
    A computed box's tooltip title, with the real pointer on SVG and Canvas:
    the groupBy level above its observations, else (with a single groupBy
    level) the category it sits at.
*/

const rows = [];
for (const [cat, year] of [
  ["Apples", 2001],
  ["Pears", 2002],
])
  for (let k = 0; k < 8; k++)
    rows.push({
      id: `${cat} ${k}`,
      cat,
      year,
      v: ((k * 37 + cat.length * 11) % 50) + 5,
    });

/** A BoxWhisker of `rows` with `extra` config. */
const box = extra =>
  `lib => new lib.BoxWhisker().data(${JSON.stringify(rows)}).legend(false)${extra}`;

/** The matcher for the box rect a Box draws for `id`. */
const boxRect = id =>
  `node => node.type === "rect" && node.key === ${JSON.stringify(`${id}-box`)}`;

/** Hovers the box drawn for `id` and returns the tooltip. */
async function hoverBox(src, renderer, id) {
  const {page, close} = await chart(src, renderer);
  try {
    const at = await nodePoint(page, boxRect(id));
    assert.ok(at, `a box for ${id}`);
    await hover(page, at);
    return await tooltip(page);
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker ${renderer} — a single groupBy level titles a box by its category`, async () => {
    const tip = await hoverBox(
      box(`.groupBy("id").x("cat").y("v")`),
      renderer,
      "Pears",
    );
    assert.ok(tip, "a tooltip shows");
    assert.strictEqual(tip.title, "Pears");
    assert.ok(
      tip.rows.some(([label]) => label === "Median"),
      "lists its statistics",
    );
  });

  it(`BoxWhisker ${renderer} — a horizontal box titles by its category on y`, async () => {
    const tip = await hoverBox(
      box(
        `.groupBy("id").discrete("y").x("v").y("cat").shapeConfig({Box: {orient: "horizontal"}})`,
      ),
      renderer,
      "Apples",
    );
    assert.strictEqual(tip.title, "Apples");
  });
}

it("BoxWhisker — a numeric category titles the box as its axis labels it", async () => {
  const tip = await hoverBox(
    box(`.groupBy("id").x("year").y("v")`),
    "svg",
    "2002",
  );
  assert.strictEqual(tip.title, "2002");
});

it("BoxWhisker — with two groupBy levels a box keeps its group's name", async () => {
  const src = box(`.groupBy(["cat", "id"]).x("year").y("v")`);
  const tip = await hoverBox(src, "svg", "2001");
  assert.strictEqual(tip.title, "Apples");
});
