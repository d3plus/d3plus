import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A BarChart whose bars are labeled with their own categories hides the
    category axis's tick labels. When the bars are too narrow for those
    labels (36 months in 650px, #1007), the axis keeps its tick labels
    instead and the bars drop theirs, so every category stays named, on
    both renderers: vertical and horizontal bars, a nested `groupBy`, and
    small multiples. Bars whose labels fit (12 months) are unchanged.
*/

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const data = [2022, 2023, 2024].flatMap((year, k) =>
  months.map((m, i) => ({
    year,
    month: `${m} ${year}`,
    value: 10 + ((i * 7 + k * 5) % 13),
  })),
);

/**
    Draws a BarChart from `config` and reports the category axis's tick
    labels and the bars' labels, as painted (per small-multiples panel when
    faceted, keyed by panel).
*/
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .config(config)
      .renderer(renderer)
      .width(650)
      .height(400)
      .duration(0)
      .legend(false)
      .select("#viz");
    viz.render(() => {
      const axisKey = `plot-${config.discrete === "y" ? "y" : "x"}-axis`;
      const panels = {};
      const panel = key => (panels[key] ||= {axis: [], bars: []});
      const walk = (n, owner, at) => {
        const key = String(n.key);
        const prefix = key.includes("/") ? key.split("/")[0] : at;
        const group = key.endsWith(axisKey)
          ? "axis"
          : key.endsWith("plot-zoom-content")
            ? "bars"
            : owner;
        if (n.type === "text" && group) {
          const text = (n.lines || [])
            .map(l => l.text)
            .join(" ")
            .trim();
          if (text) panel(prefix || "")[group].push(text);
        }
        (n.children || []).forEach(c => walk(c, group, prefix));
      };
      walk(viz._paintedScene.root, null, null);
      resolve(panels);
    });
  });

const run = (config, renderer) =>
  render('<div id="viz" style="width:650px;height:400px"></div>', draw, [
    config,
    renderer,
  ]);

/** Whether `labels` names every one of `categories` (a label may hold part of one). */
const covers = (labels, categories) =>
  categories.every(c => labels.some(l => c.includes(l) || l.includes(c)));

for (const renderer of ["svg", "canvas"]) {
  it(`BarChart ${renderer}: 36 narrow bars name their months on the axis`, async () => {
    const {"": r} = await run(
      {data, groupBy: "month", x: "month", y: "value"},
      renderer,
    );
    assert.ok(r.axis.length >= 12, `axis labels (${r.axis.length})`);
    assert.ok(
      r.axis.every(l => data.some(d => d.month === l)),
      `the axis labels are months (${r.axis.slice(0, 3)})`,
    );
    assert.deepStrictEqual(r.bars, [], "the bars drop their labels");
  });

  it(`BarChart ${renderer}: 12 bars keep their labels inside, with no axis labels`, async () => {
    const twelve = data.filter(d => d.year === 2024);
    const {"": r} = await run(
      {data: twelve, groupBy: "month", x: "month", y: "value"},
      renderer,
    );
    assert.deepStrictEqual(r.axis, [], "no axis labels");
    assert.strictEqual(r.bars.length, 12, "a label in every bar");
    assert.ok(
      covers(
        r.bars,
        twelve.map(d => d.month),
      ),
    );
  });

  it(`BarChart ${renderer}: 36 thin horizontal bars name their months on the axis`, async () => {
    const {"": r} = await run(
      {data, groupBy: "month", discrete: "y", x: "value", y: "month"},
      renderer,
    );
    assert.ok(r.axis.length >= 12, `axis labels (${r.axis.length})`);
    assert.deepStrictEqual(r.bars, [], "the bars drop their labels");
  });

  it(`BarChart ${renderer}: groupBy(["year", "month"]) names its months on the axis`, async () => {
    const {"": r} = await run(
      {data, groupBy: ["year", "month"], x: "month", y: "value"},
      renderer,
    );
    assert.ok(r.axis.length >= 12, `axis labels (${r.axis.length})`);
    assert.deepStrictEqual(r.bars, [], "the bars drop their labels");
  });

  it(`BarChart ${renderer}: each small-multiples panel names its months on its axis`, async () => {
    const panels = await run(
      {
        data,
        groupBy: "month",
        x: "month",
        y: "value",
        facet: "year",
        facetConfig: {scales: "independent"},
      },
      renderer,
    );
    const drawn = Object.values(panels).filter(p => p.axis.length);
    assert.strictEqual(drawn.length, 3, "three panels with axis labels");
    drawn.forEach(p => assert.deepStrictEqual(p.bars, []));
  });
}
