import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Value colors and growFrom in a real browser, on both backends: lines and
    areas take a gradient along the value axis, bars and points the color of
    their value, and bars grow up or down from `growFrom`.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__draw = (Chart, configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = `width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus[Chart]()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .width(size[0])
        .height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  window.__flat = nodes =>
    nodes.flatMap(n => [n, ...(n.children ? window.__flat(n.children) : [])]);
};

const run = (fn, arg) =>
  render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

it(
  "LinePlot and AreaPlot threshold valueColors paint gradients, on both backends",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = [];
      for (let t = 0; t < 10; t++) {
        data.push({name: "A", t, v: 50 + 30 * Math.sin(t / 2)});
        data.push({name: "B", t, v: 40 + 10 * Math.cos(t / 2)});
      }
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const {el, viz} = await window.__draw("LinePlot", v =>
          v
            .data(data)
            .groupBy("name")
            .x("t")
            .y("v")
            .lineLabels(false)
            .valueColors({values: [50], colors: ["#ff0000", "#00ff00"]})
            .renderer(renderer),
        );
        const nodes = window.__flat(viz._chartScene);
        const lines = nodes.filter(
          n => n.shapeType === "Line" && ["A", "B"].includes(n.key),
        );
        const legend = window.__flat(viz._legendClass.toScene().children || []);
        result[renderer] = {
          strokes: lines.map(n => n.paint.stroke.slice(0, 9)),
          svgUrls:
            renderer === "svg"
              ? Array.from(el.querySelectorAll("path"))
                  .map(p => p.getAttribute("stroke"))
                  .filter(s => s && s.startsWith("url(#d3plus-gradient")).length
              : 0,
          legend: legend.some(
            n =>
              typeof n.paint?.fill === "string" &&
              n.paint.fill.startsWith("gradient:"),
          ),
          datum: viz._datumColor(lines[0].interactionPoints[0].datum),
        };
        el.remove();
      }
      const {el, viz} = await window.__draw("AreaPlot", v =>
        v
          .data(data.filter(d => d.name === "A"))
          .groupBy("name")
          .x("t")
          .y("v")
          .growFrom(50)
          .valueColors({values: 50}),
      );
      const area = window
        .__flat(viz._chartScene)
        .find(n => n.shapeType === "Area" && n.key === "A");
      result.area = {
        fill: area.paint.fill.slice(0, 9),
        base: area.series.base.map(p => p[1] + area.transform.y),
        y50: viz._yAxis._getPosition(50),
      };
      el.remove();
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.deepStrictEqual(r.strokes, ["gradient:", "gradient:"], renderer);
      assert.ok(r.legend, `${renderer}: legend swatches show the bands`);
      assert.ok(
        ["#ff0000", "#00ff00"].includes(r.datum),
        `${renderer}: each point has its band's color`,
      );
    }
    assert.strictEqual(out.svg.svgUrls, 2, "SVG strokes with gradients");
    assert.strictEqual(out.area.fill, "gradient:");
    assert.ok(
      out.area.base.every(y => Math.abs(y - out.area.y50) < 1),
      "the area grows from 50",
    );
  },
);

it(
  "BarChart growFrom hangs bars below it down, colored by threshold valueColors",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = [
        {team: "A", score: 70},
        {team: "B", score: 30},
      ];
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const {el, viz} = await window.__draw("BarChart", v =>
          v
            .data(data)
            .x("team")
            .y("score")
            .groupBy("team")
            .growFrom(50)
            .valueColors({values: [50], colors: ["#ff0000", "#00ff00"]})
            .renderer(renderer),
        );
        const y50 = viz._yAxis._getPosition(50);
        const bars = window
          .__flat(viz._chartScene)
          .filter(n => n.shapeType === "Bar" && !`${n.key}`.endsWith("::hit"));
        result[renderer] = bars.map(n => {
          const top = n.transform.y + n.y;
          return {
            fill: n.paint.fill,
            top: Math.round(top - y50),
            bottom: Math.round(top + n.height - y50),
          };
        });
        el.remove();
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const [a, b] = out[renderer];
      assert.strictEqual(a.fill, "#00ff00", `${renderer}: above is green`);
      assert.strictEqual(b.fill, "#ff0000", `${renderer}: below is red`);
      assert.ok(
        Math.abs(a.bottom) <= 1 && a.top < 0,
        `${renderer}: A rises from 50`,
      );
      assert.ok(
        Math.abs(b.top) <= 1 && b.bottom > 0,
        `${renderer}: B hangs from 50`,
      );
    }
  },
);

it(
  "Stacked bars and areas start at growFrom",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = [
        {id: "a", x: "Q1", v: 10},
        {id: "b", x: "Q1", v: 5},
        {id: "a", x: "Q2", v: 20},
        {id: "b", x: "Q2", v: 15},
      ];
      const result = {};
      for (const Chart of ["BarChart", "StackedArea"]) {
        for (const renderer of ["svg", "canvas"]) {
          const {el, viz} = await window.__draw(Chart, v =>
            v
              .data(data)
              .groupBy("id")
              .x("x")
              .y("v")
              .stacked(true)
              .growFrom(100)
              .renderer(renderer),
          );
          const y = v => viz._yAxis._getPosition(v);
          const nodes = window
            .__flat(viz._chartScene)
            .filter(n => ["Bar", "Area"].includes(n.shapeType))
            .filter(n => !`${n.key}`.endsWith("::hit") && n.type !== "group");
          const edges =
            Chart === "BarChart"
              ? nodes.map(n => [
                  n.transform.y + n.y,
                  n.transform.y + n.y + n.height,
                ])
              : nodes.map(n => [
                  ...n.series.top.map(p => p[1] + n.transform.y),
                  ...n.series.base.map(p => p[1] + n.transform.y),
                ]);
          result[`${Chart}-${renderer}`] = {
            lowest: Math.max(...edges.flat()),
            highest: Math.min(...edges.flat()),
            y100: y(100),
            y135: y(135),
            domain: viz._yAxis._d3Scale.domain(),
          };
          el.remove();
        }
      }
      return result;
    });
    for (const [key, r] of Object.entries(out)) {
      assert.ok(Math.abs(r.lowest - r.y100) < 1.5, `${key}: starts at 100`);
      assert.ok(Math.abs(r.highest - r.y135) < 1.5, `${key}: tops out at 135`);
    }
  },
);
