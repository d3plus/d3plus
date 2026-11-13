/* global requestAnimationFrame, setTimeout */
import {afterAll, beforeAll, it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Time axes in UTC (`utc: true`) in Chromium, on both backends, with the
    page in Los Angeles time: dates stored at UTC midnight land on their own
    day in the ticks, labels, tooltips, timeline and Gantt with `utc`, and on
    the evening before without it.
*/

beforeAll(() => commands.emulateTimezone("America/Los_Angeles"));
afterAll(() => commands.emulateTimezone(null));

const box = "<div id='viz' style='width:800px;height:400px'></div>";

/** Ten days of values at UTC midnight, March 1 to 10, 2024. */
const daily = () => {
  const out = [];
  for (let d = 1; d <= 10; d++)
    out.push({id: "Visits", date: Date.UTC(2024, 2, d), value: 40 + d});
  return out;
};

/** Renders a chart and resolves with `read(viz)`. */
const draw = (Chart, config, renderer, read) =>
  render(
    box,
    () =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus[Chart]()
          .config({legend: false, duration: 0, ...config})
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

/** The text of every label under the scene node keyed `key`. */
const labelsOf = (viz, key) => {
  const node = sceneNodes(viz._paintedScene.root).find(n => n.key === key);
  return sceneNodes(node)
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "));
};

/** Hovers the plot area at `date`'s x and reads the tooltip and x badge. */
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

const line = {groupBy: "id", x: "date", time: "date", y: "value"};

it("the page runs west of UTC", async () => {
  const day = await render(box, () => new Date(Date.UTC(2024, 2, 1)).getDate());
  assert.strictEqual(day, 29);
});

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] xConfig.utc labels UTC midnights as their own day`, async () => {
    const read = viz => ({
      labels: labelsOf(viz, "plot-x-axis"),
      ticks: viz._xAxis._getLabels().map(Number),
    });
    const utc = await draw(
      "LinePlot",
      {...line, data: daily(), timeline: false, xConfig: {utc: true}},
      renderer,
      read,
    );
    assert.strictEqual(utc.labels[0], "Mar 1, 2024");
    assert.ok(utc.labels.includes("Mar 10"), `Mar 10 drawn (${utc.labels})`);
    utc.ticks.forEach(t =>
      assert.strictEqual(t % 864e5, 0, `${new Date(t)} is UTC midnight`),
    );

    const local = await draw(
      "LinePlot",
      {...line, data: daily(), timeline: false},
      renderer,
      read,
    );
    assert.ok(
      !local.labels.includes("Mar 10"),
      `locally the last day reads as Mar 9 (${local.labels})`,
    );
  });

  it(`[${renderer}] the tooltip reads the hovered UTC day`, async () => {
    const tip = await draw(
      "LinePlot",
      {...line, data: daily(), timeline: false, xConfig: {utc: true}},
      renderer,
      viz => hoverAt(viz, new Date(Date.UTC(2024, 2, 4))),
    );
    assert.ok(/Mar 4, 2024/.test(tip), `tooltip reads Mar 4 (${tip})`);
  });

  it(`[${renderer}] string dates parse in UTC and the timeline follows the axis`, async () => {
    const data = ["2023-11", "2023-12", "2024-01", "2024-02"].map(
      (month, k) => ({id: "Revenue", month, value: 100 + k}),
    );
    const out = await draw(
      "BarChart",
      {
        data,
        groupBy: "id",
        x: "month",
        time: "month",
        y: "value",
        timeline: true,
        xConfig: {utc: true},
      },
      renderer,
      viz => ({
        x: labelsOf(viz, "plot-x-axis"),
        timeline: viz._timelineClass._availableTicks.map(Number),
        utc: viz._timelineClass.utc(),
        timelineLabels: viz._timelineClass._availableTicks.map(d =>
          viz._timelineClass.schema.tickFormat(d),
        ),
      }),
    );
    // Four labels or fewer each carry the year.
    assert.deepStrictEqual(out.x, [
      "Nov 2023",
      "Dec 2023",
      "Jan 2024",
      "Feb 2024",
    ]);
    assert.ok(out.utc, "the timeline reads UTC");
    assert.deepStrictEqual(out.timeline, [
      Date.UTC(2023, 10, 1),
      Date.UTC(2023, 11, 1),
      Date.UTC(2024, 0, 1),
      Date.UTC(2024, 1, 1),
    ]);
    assert.strictEqual(out.timelineLabels[0], "Nov 2023");
  });

  it(`[${renderer}] a Gantt's axisConfig.utc places tasks on UTC days`, async () => {
    const out = await draw(
      "Gantt",
      {
        data: [
          {id: "Plan", start: "2024-03-01", end: "2024-03-05"},
          {id: "Build", start: "2024-03-04", end: "2024-03-09"},
        ],
        groupBy: "id",
        start: "start",
        end: "end",
        axisConfig: {utc: true},
      },
      renderer,
      viz => ({
        format: viz.ctx.gantt.format(new Date(Date.UTC(2024, 2, 1))),
        labels: labelsOf(viz, "gantt-axis"),
      }),
    );
    assert.strictEqual(out.format, "Mar 1, 2024");
    assert.ok(
      out.labels.every(l => !/Feb/.test(l)),
      `no label before March (${out.labels})`,
    );
  });
}
