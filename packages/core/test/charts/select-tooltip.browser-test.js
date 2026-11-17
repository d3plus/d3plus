import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A hover on a selected mark shows one tooltip for the whole selection
    when it holds more than one mark but not all of them: "N selected",
    over the selected rows merged with the chart's `aggs`.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

const grid = [];
for (let i = 0; i < 4; i++)
  for (let j = 0; j < 3; j++)
    grid.push({id: `p${i}-${j}`, x: i, y: j, value: i + j + 1});

/** Hovers the painted mark for `id` and returns the tooltip's title and rows. */
const hoverProbe = async ([kind, data, selectIds, hoverId]) => {
  const chart = new window.d3plus[kind]()
    .select("#viz")
    .duration(0)
    .data(data)
    .groupBy("id")
    .legend(false)
    .tooltipConfig({tbody: [["Value", d => d.value]]});
  if (kind === "Plot") chart.x("x").y("y");
  else chart.sum("value");
  await new Promise(r => chart.render(r));
  chart.selection(d => selectIds.includes(d.id));
  await new Promise(r => requestAnimationFrame(r));
  const el = document.querySelector(
    `#viz [data-key*='${hoverId}'] :is(rect, circle), #viz :is(rect, circle)[data-key*='${hoverId}']`,
  );
  const b = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent("mousemove", {
      clientX: b.left + b.width / 2,
      clientY: b.top + b.height / 2,
      bubbles: true,
    }),
  );
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));
  const tip = document.querySelector(".d3plus-tooltip");
  const text = sel => tip?.querySelector(sel)?.textContent.trim() ?? null;
  return {title: text(".d3plus-tooltip-title"), body: text("tbody")};
};

for (const kind of ["Treemap", "Plot"])
  it(`[${kind}] a hover on a selected mark shows the selection's merged tooltip`, async () => {
    const some = ["p0-0", "p1-0", "p2-1"];
    const every = grid.map(d => d.id);
    const selected = await render(box, hoverProbe, [kind, grid, some, "p1-0"]);
    assert.strictEqual(selected.title, "3 selected");
    assert.ok(
      selected.body.includes("7"),
      `the values sum (1 + 2 + 4): ${selected.body}`,
    );
    const outside = await render(box, hoverProbe, [kind, grid, some, "p3-2"]);
    assert.notStrictEqual(
      outside.title,
      "3 selected",
      "a mark outside it shows its own",
    );
    const one = await render(box, hoverProbe, [kind, grid, ["p1-0"], "p1-0"]);
    assert.notStrictEqual(one.title, "1 selected", "one mark shows its own");
    const all = await render(box, hoverProbe, [kind, grid, every, "p1-0"]);
    assert.notStrictEqual(
      all.title,
      `${every.length} selected`,
      "a selection of every mark shows the mark's own",
    );
  });
