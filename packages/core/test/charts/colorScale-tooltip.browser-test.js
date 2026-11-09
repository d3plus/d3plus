import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart, hover, pointOf, tooltipRows} from "./colorScale-page.js";

/**
    A chart's shape tooltips lead with the hovered row's colorScale value,
    named for its field (or the colorScale's title) and formatted as the
    colorScale formats it; a row without a value shows no row, a user's own
    `tbody` follows it, and a chart whose tooltip already shows the value
    (Calendar) adds none.
*/

const rows = [
  {id: "alpha", value: 1200, size: 4},
  {id: "beta", value: 3400, size: 6},
  {id: "gamma", value: 5600, size: 8},
  {id: "delta", size: 5},
];

const topojson = {
  type: "Topology",
  objects: {
    geo: {
      type: "GeometryCollection",
      geometries: rows.map((d, k) => ({
        type: "Polygon",
        id: d.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: rows.map((d, k) => [
    [k * 12, 0],
    [k * 12, 10],
    [k * 12 + 10, 10],
    [k * 12 + 10, 0],
    [k * 12, 0],
  ]),
};

const treemap = (config = "") => `lib => new lib.Treemap()
  .data(${JSON.stringify(rows)})
  .sum("size")
  .colorScale("value")
  ${config}`;

const geomap = `lib => new lib.Geomap()
  .data(${JSON.stringify(rows)})
  .groupBy("id")
  .colorScale("value")
  .tiles(false)
  .ocean("transparent")
  .topojson(${JSON.stringify(topojson)})`;

/** The matcher for the shape drawn for row `id`. */
const shape = id =>
  `n => n.type !== "text" && n.datum && (n.datum.id === ${JSON.stringify(id)} || (n.datum.data && n.datum.data.id === ${JSON.stringify(id)}))`;

/** Hovers row `id`'s shape and reads the tooltip's rows. */
async function rowsFor(src, renderer, id) {
  const {page, close} = await chart(src, renderer);
  try {
    await hover(page, await pointOf(page, shape(id)));
    return await tooltipRows(page);
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: Treemap — the value leads the Share row`, async () => {
    assert.deepStrictEqual(await rowsFor(treemap(), renderer, "beta"), [
      ["value", "3.4k"],
      ["Share", "26.1%"],
    ]);
  });

  it(`${renderer}: Geomap — the value, formatted by tickFormat`, async () => {
    const src = `${geomap}.colorScaleConfig({axisConfig: {tickFormat: d => d + " people"}})`;
    assert.deepStrictEqual(await rowsFor(src, renderer, "gamma"), [
      ["value", "5600 people"],
    ]);
  });
}

it("svg: a row without a value shows no row", async () => {
  assert.deepStrictEqual(await rowsFor(treemap(), "svg", "delta"), [
    ["Share", "21.7%"],
  ]);
});

it("svg: the colorScale's title names the value", async () => {
  const src = treemap(`.colorScaleConfig({axisConfig: {title: "Revenue"}})`);
  assert.deepStrictEqual((await rowsFor(src, "svg", "alpha"))[0], [
    "Revenue",
    "1.2k",
  ]);
});

it("svg: a user's tbody follows the value", async () => {
  const src = treemap(`.tooltipConfig({tbody: [["Size", d => d.size]]})`);
  assert.deepStrictEqual(await rowsFor(src, "svg", "beta"), [
    ["value", "3.4k"],
    ["Size", "6"],
  ]);
});

it("svg: an accessor's value is named Value", async () => {
  const src = `lib => new lib.Treemap()
    .data(${JSON.stringify(rows)})
    .sum("size")
    .colorScale(d => d.value)`;
  assert.deepStrictEqual((await rowsFor(src, "svg", "beta"))[0], [
    "Value",
    "3.4k",
  ]);
});

it("svg: Calendar keeps its one Value row", async () => {
  const src = `lib => new lib.Calendar()
    .data([{date: "2024-01-03", value: 7}, {date: "2024-01-04", value: 9}])
    .date("date")
    .colorScale("value")`;
  const {page, close} = await chart(src, "svg");
  try {
    await hover(
      page,
      await pointOf(
        page,
        `n => n.type === "rect" && n.datum && n.datum.value === 9`,
      ),
    );
    const body = await tooltipRows(page);
    assert.strictEqual(
      body.filter(r => /value/i.test(r[0])).length,
      1,
      JSON.stringify(body),
    );
  } finally {
    await close();
  }
});

it("svg: a Plot point's tooltip shows the value after its x and y", async () => {
  const src = `lib => new lib.Plot()
    .data(${JSON.stringify(rows.slice(0, 3).map((d, i) => ({...d, x: i, y: d.size})))})
    .x("x")
    .y("y")
    .colorScale("value")`;
  const body = await rowsFor(src, "svg", "beta");
  const at = body.findIndex(r => r[0] === "value");
  assert.ok(at >= 0, JSON.stringify(body));
  assert.deepStrictEqual(body[at], ["value", "3.4k"]);
});
