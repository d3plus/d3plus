import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart} from "./colorScale-page.js";

/**
    A Geomap point whose coordinates are equal (`[0, 0]`, `[5, 5]`) draws
    like any other: merging a point's rows keeps a coordinate they share
    whole, rather than flattening it to its one unique number.
*/

const rows = [
  {id: "a", p: [0, 0], v: 1},
  {id: "b", p: [20, 10], v: 50},
  {id: "c", p: [-30, -30], v: 100},
];

/** The ids of the point circles drawn, sorted. */
async function drawnPoints(renderer, extra = "") {
  const {page, close} = await chart(
    `lib => new lib.Geomap().tiles(false).ocean("transparent").legend(false)
      .data(${JSON.stringify(rows)})
      .point(d => d.p)${extra}`,
    renderer,
  );
  try {
    return await page.evaluate(() => {
      const ids = [];
      const walk = node => {
        if (
          node.type === "circle" &&
          node.datum &&
          !String(node.key).endsWith("::hit")
        )
          ids.push(node.datum.id);
        (node.children || []).forEach(walk);
      };
      walk(window.__viz._paintedScene.root);
      return ids.sort();
    });
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Geomap draws points at [0, 0] and [-30, -30]`, async () => {
    assert.deepStrictEqual(await drawnPoints(renderer), ["a", "b", "c"]);
  });

  it(`${renderer}: Geomap sized points at equal coordinates`, async () => {
    assert.deepStrictEqual(
      await drawnPoints(renderer, ".pointSize(d => d.v).pointSizeMin(2)"),
      ["a", "b", "c"],
    );
  });
}
