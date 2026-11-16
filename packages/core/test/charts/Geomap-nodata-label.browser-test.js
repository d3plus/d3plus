import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf} from "./colorScale-page.js";

/**
    A Geomap region with no data row is labelled by its own feature (its
    topojson `properties.name`, else its id), never by the chart's `label`
    accessor, which reads data rows: `${d.city}, ${d.region}` on a bare
    region read "undefined, undefined".
*/

const regions = [
  {id: "alpha", name: "Alpha Land"},
  {id: "beta", name: "Beta Land"},
  {id: "gamma"},
];

const topojson = {
  type: "Topology",
  objects: {
    geo: {
      type: "GeometryCollection",
      geometries: regions.map((r, k) => ({
        type: "Polygon",
        id: r.id,
        arcs: [[k]],
        ...(r.name ? {properties: {name: r.name}} : {}),
      })),
    },
  },
  arcs: regions.map((r, k) => [
    [k * 12, 0],
    [k * 12, 10],
    [k * 12 + 10, 10],
    [k * 12 + 10, 0],
    [k * 12, 0],
  ]),
};

const geomap = `lib => new lib.Geomap()
  .data([{id: "alpha", city: "Boston", region: "MA"}])
  .groupBy("id")
  .label(d => d.city + ", " + d.region)
  .tiles(false)
  .ocean("transparent")
  .topojson(${JSON.stringify(topojson)})`;

/** Hovers region `id` and reads the tooltip's title. */
async function titleOf(renderer, id) {
  const {page, close} = await chart(geomap, renderer);
  try {
    await hover(
      page,
      await pointOf(
        page,
        `n => n.type === "path" && n.datum && n.datum.id === ${JSON.stringify(id)}`,
      ),
    );
    return await page.evaluate(() => {
      const title = document.querySelector(".d3plus-tooltip-title");
      return title ? title.textContent.trim() : null;
    });
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a region with data takes the label accessor`, async () => {
    assert.strictEqual(await titleOf(renderer, "alpha"), "Boston, MA");
  });

  it(`${renderer}: a region without data reads its feature's name`, async () => {
    assert.strictEqual(await titleOf(renderer, "beta"), "Beta Land");
  });

  it(`${renderer}: a nameless region without data reads its id`, async () => {
    assert.strictEqual(await titleOf(renderer, "gamma"), "gamma");
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a region's aria label names it like its tooltip`, async () => {
    const {page, close} = await chart(geomap, renderer);
    try {
      const labels = await page.evaluate(() => {
        const out = {};
        const walk = node => {
          if (node.type === "path" && node.datum && node.aria)
            out[node.datum.id] = node.aria.label;
          (node.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        return out;
      });
      assert.deepStrictEqual(labels, {
        alpha: "Boston, MA.",
        beta: "Beta Land.",
        gamma: "gamma.",
      });
    } finally {
      await close();
    }
  });
}
