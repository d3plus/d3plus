/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Time-axis `rangeBreaks` in a Plot: hidden weekends, nights and holidays
    close up so the data on either side sits together, ticks and labels
    stay out of hidden time, hover and zoom read the broken axis, and a
    marked range draws the break marker. Both backends.
*/

const box = "<div id='viz' style='width:800px;height:400px'></div>";

// January 2024 starts on a Monday.
const day = (d, h = 0, m = 0) => new Date(2024, 0, d, h, m);
const weekday = date => date.getDay() !== 0 && date.getDay() !== 6;

/** Three weeks of weekday closes, Jan 1 to Jan 19, 2024. */
const weekdays = () => {
  const out = [];
  for (let d = 1; d <= 19; d++) {
    const date = day(d);
    if (weekday(date)) out.push({id: "Close", date, value: 100 + d});
  }
  return out;
};

/** Renders a chart and reads its x axis, line points and labels. */
const draw = (Chart, config, renderer, read) =>
  render(
    box,
    () =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus[Chart]()
          .config({
            groupBy: "id",
            x: "date",
            time: "date",
            y: "value",
            legend: false,
            timeline: false,
            duration: 0,
            ...config,
          })
          .renderer(renderer)
          .select("#viz");
        viz.render(async () => {
          try {
            resolve(await read(viz));
          } catch (e) {
            reject(e);
          }
        });
      }),
  );

/** The x axis's shown tick labels (text and date), from the painted scene. */
const xLabels = viz => {
  const axis = sceneNodes(viz._paintedScene.root).find(
    n => n.key === "plot-x-axis",
  );
  return sceneNodes(axis)
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
};

const xPosition = (viz, date) => viz._xAxis._getPosition(date);

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] weekends close up: Friday sits next to Monday and no label lands on a weekend`, async () => {
    const out = await draw(
      "LinePlot",
      {data: weekdays(), xConfig: {rangeBreaks: "weekends"}},
      renderer,
      viz => ({
        thu: xPosition(viz, day(4)),
        fri: xPosition(viz, day(5)),
        mon: xPosition(viz, day(8)),
        tue: xPosition(viz, day(9)),
        ticks: viz._xAxis._visibleTicks.map(Number),
        labels: xLabels(viz),
        broken: window.d3plus.isBrokenTimeScale(viz._xAxis._d3Scale),
      }),
    );
    assert.ok(out.broken, "the x axis is a broken time scale");
    const step = out.fri - out.thu;
    assert.ok(step > 0);
    assert.ok(
      Math.abs(out.mon - out.fri - step) < 0.01,
      `Fri→Mon (${out.mon - out.fri}) is one day (${step})`,
    );
    assert.ok(Math.abs(out.tue - out.mon - step) < 0.01);
    assert.ok(out.ticks.length > 3, "ticks drawn");
    out.ticks.forEach(t =>
      assert.ok(weekday(new Date(t)), `tick ${new Date(t)} is a weekday`),
    );
    assert.ok(out.labels.length > 3, `labels drawn (${out.labels})`);
    assert.ok(
      !out.labels.some(l => /Sat|Sun/.test(l)),
      `no weekend labels (${out.labels})`,
    );
  });
}

/** Hovers the plot area at `date`'s x (near the top) and reads the tooltip. */
const hoverAt = (viz, date) =>
  new Promise(resolve => {
    const host = document.querySelector(
      "#viz svg.d3plus-render-svg, #viz canvas.d3plus-render-canvas",
    );
    const r = host.getBoundingClientRect();
    const a = viz._plotArea,
      c = viz._chartTransform;
    const surface = host.querySelector('[data-key="plot-hover-surface"]');
    (surface || host).dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: r.left + c.x + viz._xFunc(date),
        clientY: r.top + c.y + a.y + 4,
        bubbles: true,
      }),
    );
    requestAnimationFrame(() =>
      setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        resolve(tip ? tip.textContent : "");
      }, 50),
    );
  });

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] an hours rule closes each night: 15:30 sits next to the next 9:30, and day ticks name the day`, async () => {
    const data = [];
    for (let d = 1; d <= 5; d++)
      for (let h = 9.5; h < 16; h += 0.5)
        data.push({
          id: "Price",
          date: day(d, Math.floor(h), (h % 1) * 60),
          value: d * 10 + h,
        });
    const out = await draw(
      "LinePlot",
      {data, xConfig: {rangeBreaks: {hours: [16, 9.5]}}},
      renderer,
      viz => ({
        close: xPosition(viz, day(1, 15, 30)),
        before: xPosition(viz, day(1, 15)),
        open: xPosition(viz, day(2, 9, 30)),
        ticks: viz._xAxis._visibleTicks.map(Number),
        labels: xLabels(viz),
      }),
    );
    const step = out.close - out.before;
    assert.ok(step > 0);
    assert.ok(
      Math.abs(out.open - out.close - step) < 0.01,
      "the night closes up to one half-hour",
    );
    out.ticks.forEach(t => {
      const date = new Date(t);
      const h = date.getHours() + date.getMinutes() / 60;
      assert.ok(h >= 9.5 && h < 16, `tick ${date} falls in trading hours`);
    });
    assert.ok(
      out.labels.some(l => /^Jan 2(, 2024)?$/.test(l)),
      `a day opens with its date (${out.labels})`,
    );
  });

  it(`[${renderer}] holidays in values close up with the weekend around them`, async () => {
    const data = weekdays().filter(d => d.date.getDate() !== 15);
    const out = await draw(
      "LinePlot",
      {data, xConfig: {rangeBreaks: ["weekends", {values: ["2024-01-15"]}]}},
      renderer,
      viz => ({
        thu: xPosition(viz, day(11)),
        fri: xPosition(viz, day(12)),
        tue: xPosition(viz, day(16)),
        labels: xLabels(viz),
      }),
    );
    const step = out.fri - out.thu;
    assert.ok(
      Math.abs(out.tue - out.fri - step) < 0.01,
      "Friday to Tuesday is one day",
    );
    assert.ok(
      !out.labels.some(l => /Jan 1[34]|Jan 15/.test(l)),
      `no hidden day labeled (${out.labels})`,
    );
  });

  it(`[${renderer}] hovering a broken axis reads the hovered day's values`, async () => {
    const out = await draw(
      "LinePlot",
      {data: weekdays(), xConfig: {rangeBreaks: "weekends"}},
      renderer,
      async viz => ({
        mon: await hoverAt(viz, day(8)),
        fri: await hoverAt(viz, day(12)),
      }),
    );
    assert.ok(
      /Jan 8/.test(out.mon) && /108/.test(out.mon),
      `Monday's tooltip (${out.mon})`,
    );
    assert.ok(
      /Jan 12/.test(out.fri) && /112/.test(out.fri),
      `Friday's tooltip (${out.fri})`,
    );
  });

  it(`[${renderer}] zooming a broken axis keeps its breaks`, async () => {
    const data = [];
    for (let d = 1; d <= 120; d++) {
      const date = new Date(2024, 0, d);
      if (weekday(date))
        data.push({id: "Close", date, value: 100 + Math.sin(d / 5) * 10});
    }
    const out = await draw(
      "LinePlot",
      {data, zoomMax: 32, xConfig: {rangeBreaks: "weekends"}},
      renderer,
      viz => {
        const before = viz._xAxis._d3Scale.domain().map(Number);
        for (let i = 0; i < 3; i++)
          document.querySelector("#viz .zoom-in").click();
        return new Promise(resolve =>
          setTimeout(() => {
            const scale = viz._xAxis._d3Scale;
            const domain = scale.domain().map(Number);
            // A weekend inside the zoomed window.
            let fri = new Date(domain[0]);
            while (fri.getDay() !== 5) fri = new Date(+fri + 864e5);
            fri.setHours(0, 0, 0, 0);
            const thu = new Date(+fri - 864e5);
            const mon = new Date(+fri + 3 * 864e5);
            resolve({
              before,
              domain,
              broken: window.d3plus.isBrokenTimeScale(scale),
              step: scale(fri) - scale(thu),
              gap: scale(mon) - scale(fri),
              ticks: viz._xAxis._visibleTicks.map(Number),
            });
          }, 300),
        );
      },
    );
    assert.ok(
      out.domain[1] - out.domain[0] < (out.before[1] - out.before[0]) / 2,
      "zoomed in",
    );
    assert.ok(out.broken, "the zoomed axis is still broken");
    assert.ok(
      out.step > 0 && Math.abs(out.gap - out.step) < 0.01,
      `Fri→Mon (${out.gap}) is one day (${out.step})`,
    );
    out.ticks.forEach(t =>
      assert.ok(weekday(new Date(t)), `tick ${new Date(t)} is a weekday`),
    );
  });

  it(`[${renderer}] a bounds rule draws the break marker and lines, and bars keep even spacing`, async () => {
    const data = [];
    for (let d = 1; d <= 60; d++) {
      const date = new Date(2024, 0, d);
      if (d < 20 || d > 40)
        data.push({id: "Sensor", date, value: 10 + (d % 7)});
    }
    const out = await draw(
      "BarChart",
      {data, xConfig: {rangeBreaks: {bounds: [day(20), day(41)]}}},
      renderer,
      viz => {
        const nodes = sceneNodes(viz._paintedScene.root);
        const bars = [
          ...new Set(
            nodes
              .filter(
                n =>
                  n.type === "rect" &&
                  n.shapeType === "Bar" &&
                  !String(n.key).endsWith("::hit"),
              )
              .map(n => Math.round(n.transform.x * 100) / 100),
          ),
        ].sort((a, b) => a - b);
        return {
          breaks: viz._xAxis._breaks.map(b => [
            b.start,
            b.end,
            b.endPosition - b.startPosition,
          ]),
          marks: nodes.filter(n => /^break-0-[01]$/.test(String(n.key))).length,
          lines: nodes.filter(n => String(n.key).startsWith("break-line-x"))
            .length,
          bars,
        };
      },
    );
    assert.deepStrictEqual(
      out.breaks.map(b => b.slice(0, 2)),
      [[+day(20), +day(41)]],
    );
    assert.ok(
      out.breaks[0][2] > 20,
      `the break takes its space (${out.breaks[0][2]})`,
    );
    assert.strictEqual(out.marks, 2, "two break marks on the axis");
    assert.strictEqual(out.lines, 2, "two break lines across the plot");
    const steps = out.bars.slice(1).map((x, i) => x - out.bars[i]);
    const small = steps.filter(s => s < steps[0] * 1.5);
    assert.strictEqual(
      small.length,
      steps.length - 1,
      "one wide step, at the break",
    );
    small.forEach(s =>
      assert.ok(Math.abs(s - steps[0]) < 0.5, "bars evenly spaced"),
    );
  });
}

it("rows inside a hidden range are not drawn, with one warning", async () => {
  const out = await render(box, () => {
    const warnings = [];
    const warn = console.warn;
    console.warn = msg => warnings.push(String(msg));
    const data = weekdays().concat([{id: "Close", date: day(6), value: 500}]);
    return new Promise(resolve => {
      const viz = new window.d3plus.LinePlot()
        .config({
          data,
          groupBy: "id",
          x: "date",
          time: "date",
          y: "value",
          legend: false,
          timeline: false,
          duration: 0,
          xConfig: {rangeBreaks: "weekends"},
        })
        .select("#viz");
      viz.render(() => {
        viz.render(() => {
          console.warn = warn;
          resolve({
            warnings,
            rows: viz._formattedData.length,
            yMax: Math.max(...viz._yAxis._d3Scale.domain().map(Number)),
          });
        });
      });
    });
  });
  assert.strictEqual(out.rows, 15, "the Saturday row is dropped");
  assert.ok(out.yMax < 500, "and leaves the value domain alone");
  assert.deepStrictEqual(
    out.warnings.filter(w => /rangeBreaks/.test(w)),
    ["Some data falls inside xConfig.rangeBreaks and is not drawn."],
  );
});

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a time-axis Candlestick with weekends hidden places candles where skipGaps does`, async () => {
    const out = await render(box, () => {
      const data = [];
      let c = 100;
      for (let d = 1; d <= 40; d++) {
        const date = new Date(2024, 0, d);
        if (!weekday(date)) continue;
        const o = c;
        c += Math.sin(d) * 3;
        data.push({
          date,
          open: o,
          close: c,
          high: Math.max(o, c) + 1,
          low: Math.min(o, c) - 1,
        });
      }
      const draw = config =>
        new Promise(resolve => {
          document.querySelector("#viz").innerHTML = "";
          const viz = new window.d3plus.Candlestick()
            .config({data, duration: 0, ...config})
            .renderer(renderer)
            .select("#viz");
          viz.render(() =>
            resolve(data.map(d => viz._xAxis._getPosition(d.date))),
          );
        });
      return draw({}).then(slots =>
        draw({skipGaps: false, xConfig: {rangeBreaks: "weekends"}}).then(
          times => ({slots, times}),
        ),
      );
    });
    out.slots.forEach((x, i) =>
      assert.ok(
        Math.abs(x - out.times[i]) < 1,
        `candle ${i}: ${x} vs ${out.times[i]}`,
      ),
    );
  });
}
