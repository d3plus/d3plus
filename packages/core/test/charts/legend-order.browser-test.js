import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {sceneNodes} from "~test/browser/helpers.js";
import {render} from "~test/browser/render.js";

/**
    Legends read in the order the chart draws, on SVG and Canvas: Pack lists
    its largest circles first (as Treemap does), and a stacked Plot lists its
    series in the order of the drawn stacks: the top band or segment first
    when the stacks rise, the leftmost first when they run along x. The
    order follows `stackOrder`, and a user's `legendSort` always wins.
*/

// Totals: Bravo 160 > Charlie 100 > Alpha 40 > Delta 20.
const series = {Alpha: 10, Bravo: 40, Charlie: 25, Delta: 5};
const rows = Object.entries(series).flatMap(([id, y]) =>
  [1, 2, 3, 4].map(x => ({id, x, y})),
);

/**
    Draws a `chart` configured by `config` and `extra` (the source of a
    function run on the chart before it renders, which may return one to run
    once it has, such as a redraw) and resolves with the legend's labels, in
    data order and as painted.
*/
function legendOrder(chart, config, renderer, extra = "viz => undefined") {
  return render(
    '<div id="viz" style="width:700px;height:400px"></div>',
    async ([chart, config, renderer, extra]) => {
      const viz = new window.d3plus[chart]()
        .config(config)
        .select("#viz")
        .renderer(renderer)
        .width(700)
        .height(400)
        .duration(0);
      const after = new Function(`return ${extra}`)()(viz);
      await new Promise(r => viz.render(r));
      if (after) await new Promise(r => after(viz, r));
      const legend = viz._legendClass;
      const labels = legend.data().map((d, i) => legend.label()(d, i));
      // The labels as painted, in reading order: top to bottom, then left
      // to right.
      const painted = sceneNodes(viz._paintedScene.root)
        .filter(n => n.type === "text" && n.interactionGroup === "legend")
        .map(n => ({
          text: n.lines.map(l => l.text ?? l).join(" "),
          x: n.x + (n.transform?.x ?? 0),
          y: n.y + (n.transform?.y ?? 0),
        }))
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(p => p.text);
      return {labels, painted, hidden: viz._hidden};
    },
    [chart, config, renderer, extra],
  );
}

// Without `legend: true`, a stacked area's along labels stand in for its legend.
const along = {data: rows, groupBy: "id", x: "x", y: "y"};
const stacked = {...along, legend: true};
const horizontal = {
  data: rows,
  groupBy: "id",
  discrete: "y",
  x: "y",
  y: "x",
  stacked: true,
};

for (const renderer of ["svg", "canvas"]) {
  it(`Pack lists its largest groups first (${renderer})`, async () => {
    const {labels, painted} = await legendOrder(
      "Pack",
      {
        data: [
          {group: "Fruit", id: "Apples", value: 12},
          {group: "Fruit", id: "Bananas", value: 9},
          {group: "Grains", id: "Rice", value: 40},
          {group: "Grains", id: "Wheat", value: 30},
          {group: "Dairy", id: "Milk", value: 6},
          {group: "Dairy", id: "Cheese", value: 4},
        ],
        groupBy: ["group", "id"],
      },
      renderer,
    );
    assert.deepStrictEqual(labels, ["Grains", "Fruit", "Dairy"]);
    assert.deepStrictEqual(painted, labels);
  });

  it(`StackedArea lists the top band first (${renderer})`, async () => {
    const {labels, painted} = await legendOrder(
      "StackedArea",
      stacked,
      renderer,
    );
    // Descending by total: Bravo on the baseline, Delta on top.
    assert.deepStrictEqual(labels, ["Delta", "Alpha", "Charlie", "Bravo"]);
    assert.deepStrictEqual(painted, labels);
  });

  it(`a stacked BarChart lists the top segment first (${renderer})`, async () => {
    const {labels, painted} = await legendOrder(
      "BarChart",
      {...stacked, stacked: true},
      renderer,
    );
    assert.deepStrictEqual(labels, ["Delta", "Alpha", "Charlie", "Bravo"]);
    assert.deepStrictEqual(painted, labels);
  });

  it(`a horizontal stacked BarChart lists the leftmost segment first (${renderer})`, async () => {
    const {labels, painted} = await legendOrder(
      "BarChart",
      horizontal,
      renderer,
    );
    // The segments from the baseline out, as the legend row beneath reads.
    assert.deepStrictEqual(labels, ["Bravo", "Charlie", "Alpha", "Delta"]);
    assert.deepStrictEqual(painted, labels);
  });

  it(`the legend follows a user stackOrder (${renderer})`, async () => {
    const ascending = await legendOrder(
      "StackedArea",
      stacked,
      renderer,
      `viz => void viz.stackOrder("ascending")`,
    );
    assert.deepStrictEqual(ascending.labels, [
      "Bravo",
      "Charlie",
      "Alpha",
      "Delta",
    ]);
    const keys = await legendOrder(
      "StackedArea",
      stacked,
      renderer,
      `viz => void viz.stackOrder(["Charlie", "Delta", "Alpha", "Bravo"])`,
    );
    assert.deepStrictEqual(keys.labels, ["Bravo", "Alpha", "Delta", "Charlie"]);
    const bars = await legendOrder(
      "BarChart",
      horizontal,
      renderer,
      `viz => void viz.stackOrder("key")`,
    );
    assert.deepStrictEqual(bars.labels, ["Alpha", "Bravo", "Charlie", "Delta"]);
  });

  it(`a user legendSort overrides the stack order (${renderer})`, async () => {
    const {labels} = await legendOrder(
      "StackedArea",
      stacked,
      renderer,
      `viz => void viz.legendSort((a, b) => b.id.localeCompare(a.id))`,
    );
    assert.deepStrictEqual(labels, ["Delta", "Charlie", "Bravo", "Alpha"]);
    const pack = await legendOrder(
      "Pack",
      {
        data: rows.filter(d => d.x === 1).map(d => ({id: d.id, value: d.y})),
        legend: true,
      },
      renderer,
      `viz => void viz.legendSort((a, b) => a.id.localeCompare(b.id))`,
    );
    assert.deepStrictEqual(pack.labels, ["Alpha", "Bravo", "Charlie", "Delta"]);
  });

  it(`a hidden or soloed series keeps its place in the legend (${renderer})`, async () => {
    // The along labels stand in for the legend until a series is hidden
    // or soloed.
    const hide = await legendOrder(
      "StackedArea",
      along,
      renderer,
      `() => (viz, done) => {
        viz._hidden = ["Alpha"];
        viz.render(done);
      }`,
    );
    assert.deepStrictEqual(hide.hidden, ["Alpha"]);
    assert.deepStrictEqual(hide.labels, ["Delta", "Alpha", "Charlie", "Bravo"]);
    assert.deepStrictEqual(hide.painted, hide.labels);
    const solo = await legendOrder(
      "StackedArea",
      along,
      renderer,
      `() => (viz, done) => {
        viz._solo = ["Charlie"];
        viz.render(done);
      }`,
    );
    assert.deepStrictEqual(solo.labels, ["Delta", "Alpha", "Charlie", "Bravo"]);
  });

  it(`unstacked charts keep an alphabetical legend (${renderer})`, async () => {
    const {labels} = await legendOrder("BarChart", stacked, renderer);
    assert.deepStrictEqual(labels, ["Alpha", "Bravo", "Charlie", "Delta"]);
    const lines = await legendOrder("LinePlot", stacked, renderer);
    assert.deepStrictEqual(lines.labels, [
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
    ]);
  });

  it(`small multiples order the legend by every panel's stacks (${renderer})`, async () => {
    const panels = rows.flatMap(d => [
      {...d, panel: "A"},
      {...d, panel: "B", y: d.id === "Delta" ? 30 : d.y},
    ]);
    const {labels} = await legendOrder(
      "StackedArea",
      {...stacked, data: panels, facet: "panel"},
      renderer,
    );
    // Delta tops panel A and sits second from the bottom of panel B
    // (its total there passes Charlie's): its mean place is second.
    assert.deepStrictEqual(labels, ["Alpha", "Delta", "Charlie", "Bravo"]);
  });

  it(`a threshold bucket stays last (${renderer})`, async () => {
    const small = [1, 2, 3, 4].map(x => ({id: "Echo", x, y: 3}));
    const {labels} = await legendOrder(
      "StackedArea",
      {...stacked, data: [...rows, ...small], threshold: 0.1},
      renderer,
    );
    // Delta and Echo fold into the bucket, which tops the stack.
    assert.deepStrictEqual(labels, [
      "Alpha",
      "Charlie",
      "Bravo",
      "Values < 10%",
    ]);
  });

  it(`the legend follows the stacks of the shown period (${renderer})`, async () => {
    const years = rows.flatMap(d => [
      {...d, year: 2000},
      {...d, year: 2001, y: d.id === "Delta" ? 100 : d.y},
    ]);
    const config = {...stacked, data: years, time: "year"};
    // The latest year shows by default, with Delta on the baseline.
    const latest = await legendOrder("StackedArea", config, renderer);
    assert.deepStrictEqual(latest.labels, [
      "Alpha",
      "Charlie",
      "Bravo",
      "Delta",
    ]);
    const first = await legendOrder(
      "StackedArea",
      config,
      renderer,
      `viz => void viz.timeFilter(d => d.year === 2000)`,
    );
    assert.deepStrictEqual(first.labels, [
      "Delta",
      "Alpha",
      "Charlie",
      "Bravo",
    ]);
  });
}
