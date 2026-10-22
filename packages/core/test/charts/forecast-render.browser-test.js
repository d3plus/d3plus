/* global setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    The forecast annotation in a real browser, from each of its sources: rows
    flagged by a predicate, "auto" from confidence bands, an explicit start,
    and a trend line projection, on line and bar charts, both backends, small
    multiples, a zoomed time axis, and numeric and time x axes.
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
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
  // Forecast pieces and line dashes, summarized from the scene.
  window.__summary = (viz, scene = viz._chartScene) => {
    const nodes = window.__flat(scene);
    const region = nodes.find(n => /plot-forecast-region$/.test(`${n.key}`));
    return {
      forecast: nodes
        .filter(n => /plot-forecast/.test(`${n.key}`))
        .map(n => n.key),
      label: (
        nodes.find(n => /plot-forecast-label$/.test(`${n.key}`)) || {
          lines: [{}],
        }
      ).lines[0].text,
      dashes: Object.fromEntries(
        nodes
          .filter(
            n =>
              n.shapeType === "Line" &&
              !/::hit$/.test(`${n.key}`) &&
              !/^trend-/.test(`${n.key}`),
          )
          .map(n => [n.key, (n.paint.strokeDasharray || []).slice(0, 4)]),
      ),
      region: region
        ? {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            fill: region.paint.fill,
          }
        : null,
    };
  };
  // Observed history with each flow's prediction as its own series, joined at 2020.
  window.__trade = () => {
    const rows = [];
    ["Imports", "Exports"].forEach((Flow, f) => {
      for (let Year = 2014; Year <= 2023; Year++) {
        const row = {Year, Flow, value: 100 + f * 20 + (Year - 2014) * 3};
        if (Year <= 2020) rows.push({...row, Type: "Observed"});
        if (Year >= 2020) rows.push({...row, Type: "Predicted"});
      }
    });
    return rows;
  };
  window.__years = () => {
    const rows = [];
    ["Alpha", "Beta"].forEach((id, s) => {
      for (let year = 2018; year <= 2024; year++)
        rows.push({id, year, value: 30 + 10 * s + (year - 2018) * (3 - s)});
    });
    return rows;
  };
};

const run = (fn, arg) =>
  render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

it(
  "a forecast predicate marks predicted rows drawn as their own series, on both backends",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const {el, viz} = await window.__draw("LinePlot", v =>
          v
            .data(window.__trade())
            .groupBy(["Type", "Flow"])
            .x("Year")
            .y("value")
            .forecast(d => d.Type === "Predicted")
            .renderer(renderer),
        );
        result[renderer] = {
          ...window.__summary(viz),
          startPx: viz._xFunc(2020),
          nan: window.__nan(el),
        };
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.deepStrictEqual(
        r.forecast,
        [
          "plot-forecast",
          "plot-forecast-region",
          "plot-forecast-rule",
          "plot-forecast-label",
        ],
        renderer,
      );
      assert.strictEqual(r.label, "Forecast");
      assert.ok(
        Math.abs(r.region.x - r.startPx) < 0.5,
        `${renderer}: the backdrop starts at 2020`,
      );
      assert.deepStrictEqual(
        r.dashes["Predicted_Imports"].slice(0, 2),
        [0, 0],
        `${renderer}: predicted lines dash throughout`,
      );
      assert.deepStrictEqual(r.dashes["Predicted_Imports"].slice(2), [6, 4]);
      assert.ok(
        r.dashes["Observed_Exports"].length <= 1,
        `${renderer}: observed lines stay solid`,
      );
      assert.strictEqual(r.nan, 0);
    }
    assert.deepStrictEqual(
      out.svg.region,
      out.canvas.region,
      "both backends build the same backdrop",
    );
  },
);

it(
  "a forecast predicate on one series' rows dashes from its last unflagged point (time axis)",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = Array.from({length: 24}, (_, m) => ({
        id: "Sales",
        date: new Date(2023, m, 1),
        value: 100 + m,
        predicted: m >= 18,
      }));
      const {el, viz} = await window.__draw("LinePlot", v =>
        v
          .data(data)
          .groupBy("id")
          .x("date")
          .time("date")
          .y("value")
          .forecast(d => d.predicted)
          .timeline(false),
      );
      return {
        ...window.__summary(viz),
        startPx: viz._xFunc(new Date(2023, 17, 1)),
        nan: window.__nan(el),
      };
    });
    assert.ok(
      Math.abs(out.region.x - out.startPx) < 0.5,
      "starts at the last unflagged month",
    );
    assert.ok(
      out.dashes.Sales[0] > 0 && out.dashes.Sales[1] === 0,
      "solid up to there",
    );
    assert.deepStrictEqual(out.dashes.Sales.slice(2), [6, 4], "then dashed");
    assert.strictEqual(out.nan, 0);
  },
);

it(
  'forecast "auto" starts where a confidence band opens; explicit starts and false',
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = Array.from({length: 10}, (_, t) => {
        const w = Math.max(t - 5, 0);
        return {
          id: "s",
          t: 2000 + t,
          date: `${2000 + t}-01-01`,
          v: 10 + t,
          lo: 10 + t - w,
          hi: 10 + t + w,
        };
      });
      const auto = await window.__draw("LinePlot", v =>
        v
          .data(data)
          .groupBy("id")
          .x("t")
          .y("v")
          .confidence(["lo", "hi"])
          .forecast("auto"),
      );
      const base = v =>
        v
          .data(data)
          .groupBy("id")
          .x("date")
          .time("date")
          .y("v")
          .confidence(["lo", "hi"]);
      const dated = await window.__draw("LinePlot", v =>
        base(v).forecast("2007-01-01").forecastConfig({
          label: "Projection",
          fill: "#ff0000",
          lineDasharray: false,
        }),
      );
      const off = await window.__draw("LinePlot", v => base(v).forecast(false));
      const unset = await window.__draw("LinePlot", base);
      const s = window.__summary(dated.viz);
      return {
        auto: {...window.__summary(auto.viz), startPx: auto.viz._xFunc(2005)},
        label: s.label,
        fill: s.region.fill,
        startOk:
          Math.abs(s.region.x - dated.viz._xFunc(new Date(2007, 0, 1))) < 0.5,
        dashes: s.dashes,
        off: window.__summary(off.viz).forecast,
        unset: window.__summary(unset.viz).forecast,
        nan: window.__nan(dated.el),
      };
    });
    assert.ok(
      Math.abs(out.auto.region.x - out.auto.startPx) < 0.5,
      "auto: the last point before the band spreads (2005)",
    );
    assert.deepStrictEqual(
      out.auto.dashes.s.slice(2),
      [6, 4],
      "auto: dashed after it",
    );
    assert.strictEqual(out.label, "Projection");
    assert.strictEqual(out.fill, "#ff0000");
    assert.ok(out.startOk, "the backdrop starts at the given date");
    assert.ok(
      out.dashes.s.length <= 1,
      "lineDasharray: false keeps the line solid",
    );
    assert.deepStrictEqual(out.off, [], "forecast(false) draws nothing");
    assert.deepStrictEqual(out.unset, [], "unset, a plain chart draws nothing");
    assert.strictEqual(out.nan, 0);
  },
);

it(
  "a trend line projection gets the forecast annotation on line and bar charts",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const trend = v =>
        v
          .data(window.__years())
          .groupBy("id")
          .trendLine(true)
          .trendLineConfig({projection: 3});
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const line = await window.__draw("LinePlot", v =>
          trend(v).x("year").y("value").renderer(renderer),
        );
        const bar = await window.__draw("BarChart", v =>
          trend(v).x("year").y("value").renderer(renderer),
        );
        const hbar = await window.__draw("BarChart", v =>
          trend(v).discrete("y").x("value").y("year").renderer(renderer),
        );
        const off = await window.__draw("LinePlot", v =>
          trend(v).x("year").y("value").forecast(false).renderer(renderer),
        );
        result[renderer] = {
          line: {...window.__summary(line.viz), at: line.viz._xFunc(2024)},
          bar: {
            ...window.__summary(bar.viz),
            at: (bar.viz._xFunc(2024) + bar.viz._xFunc(2025)) / 2,
            end: bar.viz._xFunc(2027),
          },
          hbar: {
            ...window.__summary(hbar.viz),
            y2024: hbar.viz._yFunc(2024),
            y2025: hbar.viz._yFunc(2025),
          },
          off: window.__summary(off.viz).forecast,
          nan: [line, bar, hbar].map(c => window.__nan(c.el)),
        };
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.strictEqual(
        r.line.label,
        "Forecast",
        `${renderer}: the line chart is marked`,
      );
      assert.ok(
        Math.abs(r.line.region.x - r.line.at) < 0.5,
        `${renderer}: from the last fitted year`,
      );
      assert.ok(
        Object.values(r.line.dashes).every(d => d.length <= 1),
        `${renderer}: the data lines stay solid`,
      );
      assert.ok(
        Math.abs(r.bar.region.x - r.bar.at) < 0.5,
        `${renderer}: bars shade from the first projected slot's edge`,
      );
      assert.ok(
        r.bar.region.x + r.bar.region.width > r.bar.end,
        `${renderer}: to the end of the axis`,
      );
      assert.ok(r.hbar.region, `${renderer}: a horizontal bar chart is marked`);
      const edge = (r.hbar.y2024 + r.hbar.y2025) / 2;
      const shaded = [r.hbar.region.y, r.hbar.region.y + r.hbar.region.height];
      assert.ok(
        shaded.some(p => Math.abs(p - edge) < 0.5),
        `${renderer}: down the y axis from the first projected slot (${shaded} vs ${edge})`,
      );
      assert.deepStrictEqual(
        r.off,
        [],
        `${renderer}: forecast(false) leaves a projection unmarked`,
      );
      assert.deepStrictEqual(r.nan, [0, 0, 0]);
    }
    assert.deepStrictEqual(
      out.svg.bar.region,
      out.canvas.bar.region,
      "both backends build the same backdrop",
    );
  },
);

it(
  "forecast small multiples: each panel marks its own forecast",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const data = ["North", "South"].flatMap((region, r) =>
        Array.from({length: 12}, (_, t) => ({
          id: region,
          region,
          t: 2010 + t,
          v: 10 + t * (r + 1),
          predicted: t >= 7 + r * 2,
        })),
      );
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        const {el, viz} = await window.__draw("LinePlot", v =>
          v
            .data(data)
            .groupBy("id")
            .facet("region")
            .x("t")
            .y("v")
            .forecast(d => d.predicted)
            .renderer(renderer),
        );
        const nodes = window.__flat(viz._chartScene);
        result[renderer] = {
          backdrops: nodes
            .filter(n => /plot-forecast-region$/.test(`${n.key}`))
            .map(n => n.width),
          dashed: nodes.filter(
            n =>
              n.shapeType === "Line" &&
              (n.paint.strokeDasharray || []).length > 2,
          ).length,
          nan: window.__nan(el),
        };
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const r = out[renderer];
      assert.strictEqual(
        r.backdrops.length,
        2,
        `${renderer}: a forecast per panel`,
      );
      assert.ok(
        r.backdrops[0] !== r.backdrops[1],
        `${renderer}: each from its own start (${r.backdrops})`,
      );
      assert.strictEqual(
        r.dashed,
        2,
        `${renderer}: each line dashed after its forecast start`,
      );
      assert.strictEqual(r.nan, 0);
    }
  },
);

it(
  "forecast on a zoomable plot follows the zoom",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      const wheel = async (viz, fx) => {
        const surface = viz._zoomEventTarget.node();
        const box = surface.getBoundingClientRect();
        const at = {
          clientX: box.x + box.width * fx,
          clientY: box.y + box.height / 2,
        };
        surface.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            view: window,
            ctrlKey: true,
            deltaY: -300,
            ...at,
          }),
        );
        await wait(300);
      };
      const result = {};
      // A linear x axis zooms along the forecast; a time axis zooms its y axis.
      const numeric = Array.from({length: 24}, (_, k) => ({
        id: "Sales",
        x: k,
        value: 100 + k,
        predicted: k >= 18,
      }));
      const linear = await window.__draw("Plot", v =>
        v
          .data(numeric)
          .groupBy("id")
          .shape("Line")
          .x("x")
          .y("value")
          .forecast(d => d.predicted)
          .zoom(true),
      );
      const linearBefore = window.__summary(linear.viz);
      await wheel(linear.viz, 0.9);
      result.linear = {
        before: linearBefore,
        after: window.__summary(linear.viz),
        nan: window.__nan(linear.el),
      };
      await wheel(linear.viz, 0.9);
      await wheel(linear.viz, 0.9);
      result.deep = window.__summary(linear.viz);
      const dated = Array.from({length: 24}, (_, m) => ({
        id: "Sales",
        date: new Date(2023, m, 1),
        value: 100 + m,
        predicted: m >= 18,
      }));
      const time = await window.__draw("LinePlot", v =>
        v
          .data(dated)
          .groupBy("id")
          .x("date")
          .time("date")
          .y("value")
          .forecast(d => d.predicted)
          .zoom(true)
          .timeline(false),
      );
      const timeBefore = window.__summary(time.viz);
      await wheel(time.viz, 0.9);
      result.time = {
        before: timeBefore,
        after: window.__summary(time.viz),
        nan: window.__nan(time.el),
      };
      return result;
    });
    const {linear, time} = out;
    assert.ok(
      linear.before.region && linear.after.region,
      "a linear axis: marked before and after zooming",
    );
    assert.ok(
      linear.after.region.x < linear.before.region.x,
      `the backdrop moves with the zoom (${linear.before.region.x} → ${linear.after.region.x})`,
    );
    assert.ok(
      linear.after.region.width > linear.before.region.width,
      "and widens with it",
    );
    assert.strictEqual(linear.nan, 0);
    assert.ok(
      out.deep.region,
      `zoomed past the start: still shaded (${JSON.stringify(out.deep.forecast)})`,
    );
    assert.ok(
      time.before.region && time.after.region,
      "a time axis: marked before and after zooming",
    );
    assert.ok(
      time.after.region.x < time.before.region.x,
      `a time axis zooms x too: the backdrop moves with it (${time.before.region.x} → ${time.after.region.x})`,
    );
    assert.ok(
      time.after.region.width > time.before.region.width,
      "and widens with it",
    );
    assert.notDeepStrictEqual(
      time.after.dashes.Sales,
      time.before.dashes.Sales,
      "the dash is measured along the zoomed line",
    );
    assert.strictEqual(time.nan, 0);
  },
);

it(
  "the forecast backdrop takes forecastConfig's texture and backgroundImage, not shapeConfig's, on both backends",
  {timeout: 120000},
  async function () {
    const out = await run(async () => {
      const image =
        "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
      const probe = async (renderer, configure) => {
        const {el, viz} = await window.__draw("BarChart", v => {
          v.data(window.__years())
            .groupBy("id")
            .x("year")
            .y("value")
            .forecast(2022)
            .renderer(renderer);
          configure(v);
        });
        const leaves = [];
        const walk = (n, anc) => {
          if (n.type === "group")
            (n.children || []).forEach(c => walk(c, `${anc}>${n.key || ""}`));
          else leaves.push({...n, anc});
        };
        walk(viz._lastSceneRendered.root, "");
        const images = new Set(
          leaves.filter(n => n.type === "image").map(n => n.key),
        );
        const patterned = n =>
          `${n.paint && n.paint.fill}`.startsWith("pattern:");
        const marks = leaves.filter(
          n => n.type === "rect" && n.datum && !/::hit$/.test(`${n.key}`),
        );
        const bars = marks.filter(n => n.anc.includes("viz-chart-cells"));
        const legend = marks.filter(n => n.anc.includes("viz-legend"));
        const svg = el.querySelector("svg.d3plus-render-svg");
        return {
          backdrop: leaves
            .filter(n => /plot-forecast-(region|texture)$/.test(`${n.key}`))
            .map(n => ({
              key: n.key.replace(/.*plot-forecast-/, ""),
              patterned: patterned(n),
            })),
          backdropImage: images.has("plot-forecast-region-bgimage-img"),
          bars: [
            bars.length,
            bars.filter(patterned).length,
            bars.filter(n => images.has(`${n.key}-bgimage-img`)).length,
          ],
          legend: [
            legend.length,
            legend.filter(patterned).length,
            legend.filter(n => images.has(`${n.key}-bgimage-img`)).length,
          ],
          domPatterns: svg
            ? svg.querySelectorAll("[fill^='url(#']").length
            : null,
          domImages: svg ? svg.querySelectorAll("image").length : null,
          nan: window.__nan(el),
        };
      };
      const result = {};
      for (const renderer of ["svg", "canvas"]) {
        result[renderer] = {
          // The data marks take shapeConfig's styles; the backdrop is chrome and stays plain.
          shapes: await probe(renderer, v =>
            v.shapeConfig({texture: "lines", backgroundImage: image}),
          ),
          // forecastConfig styles the backdrop alone.
          own: await probe(renderer, v =>
            v.forecastConfig({texture: "lines", backgroundImage: image}),
          ),
        };
      }
      return result;
    });
    for (const renderer of ["svg", "canvas"]) {
      const {shapes, own} = out[renderer];
      assert.deepStrictEqual(
        shapes.backdrop,
        [{key: "region", patterned: false}],
        `${renderer}: shapeConfig leaves the backdrop plain`,
      );
      assert.strictEqual(
        shapes.backdropImage,
        false,
        `${renderer}: and without an image`,
      );
      const [bars, barsTextured, barsImaged] = shapes.bars;
      assert.ok(
        bars > 0 && barsTextured === bars && barsImaged === bars,
        `${renderer}: every bar takes shapeConfig's styles (${shapes.bars})`,
      );
      assert.deepStrictEqual(
        shapes.legend,
        [2, 2, 2],
        `${renderer}: and so does every legend swatch`,
      );
      assert.deepStrictEqual(
        own.backdrop,
        [
          {key: "region", patterned: false},
          {key: "texture", patterned: true},
        ],
        `${renderer}: forecastConfig.texture overlays the shade`,
      );
      assert.strictEqual(
        own.backdropImage,
        true,
        `${renderer}: forecastConfig.backgroundImage draws in the backdrop`,
      );
      assert.deepStrictEqual(
        [own.bars[1], own.bars[2]],
        [0, 0],
        `${renderer}: the bars stay plain`,
      );
      assert.deepStrictEqual(
        own.legend,
        [2, 0, 0],
        `${renderer}: and so do the legend swatches`,
      );
      assert.strictEqual(own.nan + shapes.nan, 0);
    }
    assert.strictEqual(
      out.svg.own.domPatterns,
      1,
      "SVG draws the backdrop's pattern",
    );
    assert.strictEqual(out.svg.own.domImages, 1, "and its image");
  },
);
