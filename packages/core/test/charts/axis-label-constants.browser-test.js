import {beforeAll, it} from "vitest";
import assert from "~test/browser/assert.js";
import {loadD3plus, render} from "~test/browser/render.js";

/**
    An axis's label config takes a constant as well as a function: a numeric
    `yConfig.shapeConfig.labelConfig.fontSize` or `shapeConfig.lineHeight`
    lays the axes out and draws the labels at that size, on both renderers,
    and so does a numeric `timelineConfig.shapeConfig.lineHeight` for the
    timeline. The measures once called them as functions, so a number threw
    inside the draw and the render never finished.
*/

const bars = [
  {id: "alpha", x: "A", y: 10},
  {id: "beta", x: "B", y: 20},
  {id: "gamma", x: "C", y: 15},
];
const pyramid = ["0-9", "10-19", "20-29"].flatMap((age, i) => [
  {age, sex: "Male", pop: 1000 - i * 200},
  {age, sex: "Female", pop: 1100 - i * 200},
]);
const series = [2000, 2001, 2002].flatMap(year => [
  {id: "a", year, value: year - 1990},
  {id: "b", year, value: year - 1995},
]);

/**
    Renders `chart` with `config` into a 600px-wide, `height`-tall #viz on `renderer`
    and reports each text node's font size, grouped by the scene group it
    sits in, and the text the timeline draws. Rejects when the render doesn't finish within a few seconds.
*/
const draw = ({chart, data, accessors, config, renderer, height = 400}) =>
  render(
    `<div id="viz" style="width:600px;height:${height}px"></div>`,
    ([chart, data, accessors, config, renderer]) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`${chart} never finished rendering`)),
          5000,
        );
        const viz = new window.d3plus[chart]()
          .data(data)
          .duration(0)
          .detectVisible(false)
          .renderer(renderer)
          .select("#viz");
        for (const [key, value] of Object.entries(accessors)) viz[key](value);
        viz.config(config).render(() => {
          clearTimeout(timer);
          const sizes = {},
            timeline = [];
          const walk = (node, group, inTimeline) => {
            if (node.type === "text") {
              (sizes[group] = sizes[group] || []).push(node.font.size);
              if (inTimeline)
                timeline.push(node.lines.map(l => l.text).join(" "));
            }
            (node.children || []).forEach(c =>
              walk(
                c,
                node.type === "group" ? node.key : group,
                inTimeline || node.key === "viz-timeline",
              ),
            );
          };
          walk(viz._lastSceneRendered.root, "", false);
          resolve({
            sizes,
            timeline,
            canvas: !!document.querySelector("#viz canvas"),
          });
        });
      }),
    [chart, data, accessors, config, renderer],
  );

// Loading d3plus from source takes a while on a cold start; each test's own
// short timeout (and the draw's) then only covers the render.
beforeAll(loadD3plus, 120000);

const fontSize = {yConfig: {shapeConfig: {labelConfig: {fontSize: 30}}}};
const renderers = ["svg", "canvas"];

for (const renderer of renderers) {
  it(
    `BarChart: a numeric y axis label fontSize renders at that size (${renderer})`,
    {timeout: 15000},
    async () => {
      const {sizes, canvas} = await draw({
        chart: "BarChart",
        data: bars,
        accessors: {groupBy: "id", x: "x", y: "y"},
        config: fontSize,
        renderer,
      });
      assert.strictEqual(canvas, renderer === "canvas");
      const y = sizes["plot-y-axis"] || [];
      assert.ok(y.length > 1, "draws the y axis's tick labels");
      assert.deepStrictEqual([...new Set(y)], [30]);
      assert.ok(
        (sizes["plot-x-axis"] || []).every(s => s !== 30),
        "leaves the x axis's labels at their own size",
      );
    },
  );

  it(
    `Pyramid: a numeric y axis label fontSize renders at that size (${renderer})`,
    {timeout: 15000},
    async () => {
      const {sizes, canvas} = await draw({
        chart: "Pyramid",
        data: pyramid,
        accessors: {groupBy: "sex", y: "age", x: "pop"},
        config: fontSize,
        renderer,
      });
      assert.strictEqual(canvas, renderer === "canvas");
      const categories = sizes["pyramid-categories"] || [];
      assert.strictEqual(categories.length, 3, "draws each category label");
      assert.deepStrictEqual([...new Set(categories)], [30]);
    },
  );

  it(
    `LinePlot: a numeric axis lineHeight renders, with the y axis or the x axis's end labels (${renderer})`,
    {timeout: 15000},
    async () => {
      const lineHeight = {
        xConfig: {shapeConfig: {lineHeight: 30}},
        yConfig: {shapeConfig: {lineHeight: 30}},
      };
      const accessors = {groupBy: "id", x: "year", y: "value"};
      const tall = await draw({
        chart: "LinePlot",
        data: series,
        accessors,
        config: lineHeight,
        renderer,
      });
      assert.ok((tall.sizes["plot-y-axis"] || []).length > 1);
      const short = await draw({
        chart: "LinePlot",
        data: series,
        accessors,
        config: lineHeight,
        renderer,
        height: 150,
      });
      assert.strictEqual(
        (short.sizes["plot-x-end-labels"] || []).length,
        2,
        "labels the x axis's two ends",
      );
    },
  );

  it(
    `Treemap: a numeric timeline lineHeight renders the timeline (${renderer})`,
    {timeout: 15000},
    async () => {
      const {timeline, canvas} = await draw({
        chart: "Treemap",
        data: series,
        accessors: {groupBy: "id", sum: "value", time: "year"},
        config: {timelineConfig: {shapeConfig: {lineHeight: 20}}},
        renderer,
      });
      assert.strictEqual(canvas, renderer === "canvas");
      for (const year of ["2000", "2001", "2002"])
        assert.ok(timeline.includes(year), `the timeline labels ${year}`);
    },
  );
}
