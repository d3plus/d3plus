import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    RadialMatrix's column labels: curved just outside the circle when they
    all fit, which leaves the circle more room, straight with
    `labelPosition: "inside"`, and limited by `columnConfig.labels`.
*/

const columns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const rows = ["Morning", "Afternoon", "Evening"].flatMap((row, r) =>
  columns.map((column, c) => ({row, column, value: r * 7 + c})),
);

const probe = async ([data, config]) => {
  const viz = new window.d3plus.RadialMatrix()
    .select("#viz")
    .duration(0)
    .data(data)
    .groupBy(["row", "column"])
    .colorScale("value")
    .config(config);
  await new Promise(r => viz.render(r));
  const labels = viz._chartScene.find(n => n.key === "radialmatrix-columns");
  const cell = viz._chartScene.find(n => n.type === "path" && n.datum);
  const outer = Math.max(
    ...cell.d.match(/A([\d.]+)/g).map(a => Number(a.slice(1))),
  );
  return {
    curved: labels ? labels.children.filter(c => c.path).length : 0,
    texts: labels
      ? labels.children.map(c => c.lines.map(l => l.text).join(" "))
      : [],
    outer,
  };
};

const box = "<div id='viz' style='width:600px;height:500px'></div>";

it(
  "RadialMatrix curves its column labels just outside the circle",
  {timeout: 180000},
  async function () {
    const curved = await render(box, probe, [rows, {}]);
    assert.strictEqual(curved.curved, 7, "every column curves");
    assert.deepStrictEqual(curved.texts.slice().sort(), columns.slice().sort());
    const straight = await render(box, probe, [
      rows,
      {labelPosition: "inside"},
    ]);
    assert.strictEqual(straight.curved, 0, "inside keeps them straight");
    assert.deepStrictEqual(
      straight.texts.slice().sort(),
      columns.slice().sort(),
    );
    assert.ok(
      curved.outer > straight.outer,
      `curved ${curved.outer} > straight ${straight.outer}`,
    );
  },
);

it(
  "RadialMatrix draws only the columnConfig.labels it is given",
  {timeout: 180000},
  async function () {
    const out = await render(box, probe, [
      rows,
      {columnConfig: {labels: ["Mon", "Thu"]}},
    ]);
    assert.strictEqual(out.curved, 2);
    assert.deepStrictEqual(out.texts.slice().sort(), ["Mon", "Thu"]);
  },
);
