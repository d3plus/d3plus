import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A chart with a `sizeRatio` in a container whose own height is lower than
    the ratio asks for narrows to keep its ratio and sits centered in the
    container: its surface, the overlay host (the top-left controls), and
    pointer hits all line up with the centered chart, its export is the chart
    alone, and breakpoints still match the container's full width. Run with
    both renderers.
*/

const data = [
  {id: "alpha", x: "A", y: 30},
  {id: "beta", x: "B", y: 50},
  {id: "gamma", x: "C", y: 20},
];

/** Draws the chart and measures it against its container. */
const draw = ([data, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .duration(0)
      .renderer(renderer)
      .sizeRatio(2)
      .responsive([{minWidth: 500, config: {title: "Wide"}}])
      .select("#viz");
    window.__viz = viz;
    viz.render(() => resolve());
  });

/** The chart's size, where its parts sit, and what its export holds. */
const measure = renderer => {
  const viz = window.__viz;
  const content = document.querySelector("#viz").getBoundingClientRect();
  const surface = document
    .querySelector(
      renderer === "canvas"
        ? "#viz canvas.d3plus-render-canvas"
        : "#viz svg.d3plus-viz",
    )
    .getBoundingClientRect();
  const host = document
    .querySelector("#viz .d3plus-render-overlays")
    .getBoundingClientRect();
  const markup = viz.toSVGString();
  return {
    width: viz.width(),
    configWidth: viz.config().width,
    height: viz.height(),
    title:
      typeof viz.schema.title === "function"
        ? viz.schema.title()
        : viz.schema.title,
    left: surface.left - content.left,
    right: content.right - surface.right,
    surfaceWidth: surface.width,
    hostLeft: host.left - surface.left,
    hostWidth: host.width,
    exportWidth: /<svg[^>]*\swidth="([\d.]+)"/.exec(markup)?.[1],
    point: [
      surface.left + surface.width / 2,
      surface.top + surface.height * 0.75,
    ],
  };
};

/** The visible tooltip's text. */
const tips = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);

for (const renderer of ["svg", "canvas"]) {
  it(
    `${renderer}: a letterboxed chart keeps its ratio, centered, with overlays and hits on it`,
    {timeout: 120000},
    async function () {
      const {page, errors, close} = await openPage(
        `<div id="box" style="width: 600px; height: 200px; padding: 10px"><div id="viz" style="height: 100%"></div></div>`,
      );
      try {
        await page.evaluate(draw, [data, renderer]);
        await page.waitForTimeout(200);
        const m = await page.evaluate(measure, renderer);
        assert.strictEqual(m.height, 200, "the container's height");
        assert.strictEqual(m.width, 600, "width() keeps the measured width");
        assert.strictEqual(m.configWidth, 600, "and so does config()");
        assert.strictEqual(Math.round(m.surfaceWidth), 400, "height × ratio");
        assert.strictEqual(Math.round(m.left), 100, "centered: 100px left");
        assert.strictEqual(Math.round(m.right), 100, "and 100px right");
        assert.strictEqual(
          Math.round(m.hostLeft),
          0,
          "the overlay host starts at the chart",
        );
        assert.strictEqual(Math.round(m.hostWidth), 400);
        assert.strictEqual(m.title, "Wide", "breakpoints match the 600px box");
        assert.strictEqual(m.exportWidth, "400", "the export is the chart");

        await page.mouse.move(m.point[0] - 4, m.point[1] - 4);
        await page.mouse.move(...m.point, {steps: 3});
        await page.waitForTimeout(200);
        const shown = await page.evaluate(tips);
        assert.ok(
          shown.some(t => t.includes("beta")),
          `the middle bar is hit (got ${JSON.stringify(shown)})`,
        );
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    },
  );

  it(
    `${renderer}: the letterbox follows the container and lifts when the ratio fits`,
    {timeout: 120000},
    async function () {
      const {page, errors, close} = await openPage(
        `<div id="box" style="width: 600px; height: 200px"><div id="viz" style="height: 100%"></div></div>`,
      );
      try {
        await page.evaluate(draw, [data, renderer]);
        const resize = ([w, h]) => {
          const box = document.querySelector("#box");
          box.style.width = `${w}px`;
          box.style.height = `${h}px`;
        };
        await page.evaluate(resize, [300, 200]);
        await page.waitForTimeout(1000);
        const narrow = await page.evaluate(measure, renderer);
        await page.evaluate(resize, [600, 120]);
        await page.waitForTimeout(1000);
        const short = await page.evaluate(measure, renderer);
        assert.strictEqual(narrow.width, 300, "the ratio fits: full width");
        assert.strictEqual(narrow.height, 150);
        assert.strictEqual(Math.round(narrow.left), 0);
        assert.notStrictEqual(narrow.title, "Wide", "300px is out of range");
        assert.strictEqual(short.width, 600);
        assert.strictEqual(Math.round(short.surfaceWidth), 240);
        assert.strictEqual(short.height, 120);
        assert.strictEqual(Math.round(short.left), 180);
        assert.strictEqual(Math.round(short.right), 180);
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    },
  );
}

/** Where `selector` sits against `#viz`'s content box. */
const place = selector => {
  const viz = document.querySelector("#viz");
  const style = getComputedStyle(viz);
  const content = viz.getBoundingClientRect();
  const left = content.left + parseFloat(style.paddingLeft);
  const rect = document.querySelector(selector).getBoundingClientRect();
  return {left: rect.left - left, width: rect.width};
};

for (const renderer of ["svg", "canvas"]) {
  it(
    `${renderer}: an explicit width letterboxes inside its own frame`,
    {timeout: 120000},
    async function () {
      const {page, errors, close} = await openPage(
        `<div id="box" style="width: 700px; height: 200px"><div id="viz" style="height: 100%"></div></div>`,
      );
      try {
        const r = await page.evaluate(
          ([data, renderer, placeSrc]) =>
            new Promise(resolve => {
              const place = eval(placeSrc);
              const viz = new window.d3plus.BarChart()
                .data(data)
                .groupBy("id")
                .x("x")
                .y("y")
                .duration(0)
                .renderer(renderer)
                .width(500)
                .sizeRatio(2)
                .responsive([{minWidth: 450, config: {title: "Wide"}}])
                .select("#viz");
              const surface =
                renderer === "canvas"
                  ? "#viz canvas.d3plus-render-canvas"
                  : "#viz svg.d3plus-viz";
              const read = () => ({
                width: viz.width(),
                configWidth: viz.config().width,
                height: viz.height(),
                title:
                  typeof viz.schema.title === "function"
                    ? viz.schema.title()
                    : viz.schema.title,
                surface: place(surface),
                host: place("#viz .d3plus-render-overlays"),
              });
              viz.render(() =>
                setTimeout(() => {
                  const first = read();
                  // A new width re-fits the letterbox inside it.
                  viz.width(300);
                  viz.render(() =>
                    setTimeout(() => resolve({...first, again: read()}), 200),
                  );
                }, 200),
              );
            }),
          [data, renderer, place.toString()],
        );
        assert.strictEqual(r.height, 200, "the box's height");
        assert.strictEqual(r.width, 500, "width() returns the width set");
        assert.strictEqual(r.configWidth, 500, "and so does config()");
        assert.strictEqual(Math.round(r.surface.width), 400, "height × ratio");
        assert.strictEqual(
          Math.round(r.surface.left),
          50,
          "centered in the 500px width set",
        );
        assert.strictEqual(Math.round(r.host.left), 50, "overlays follow");
        assert.strictEqual(r.title, "Wide", "breakpoints match the 500px set");
        assert.strictEqual(r.again.width, 300, "the new width set");
        assert.strictEqual(r.again.height, 150, "300 / 2 fits the box");
        assert.strictEqual(Math.round(r.again.surface.width), 300);
        assert.strictEqual(Math.round(r.again.surface.left), 0);
        assert.notStrictEqual(r.again.title, "Wide", "300px leaves the range");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    },
  );

  it(
    `${renderer}: loading and no-data messages sit over the letterboxed chart`,
    {timeout: 120000},
    async function () {
      const {page, errors, close} = await openPage(
        `<div id="box" style="width: 600px; height: 200px; padding: 10px"><div id="viz" style="height: 100%"></div></div>`,
      );
      try {
        const r = await page.evaluate(
          ([data, renderer, placeSrc]) =>
            new Promise(resolve => {
              const place = eval(placeSrc);
              const url = `data:application/json,${encodeURIComponent(JSON.stringify(data))}`;
              const viz = new window.d3plus.BarChart()
                .data(url)
                .groupBy("id")
                .x("x")
                .y("y")
                .duration(0)
                .renderer(renderer)
                .sizeRatio(2)
                .select("#viz");
              viz.render(() => {
                viz
                  .data([])
                  .render(() =>
                    resolve({loading, empty: place("#viz .d3plus-Message")}),
                  );
              });
              const loading = place("#viz .d3plus-Message");
            }),
          [data, renderer, place.toString()],
        );
        for (const [name, box] of Object.entries(r)) {
          assert.strictEqual(Math.round(box.left), 100, `${name}: centered`);
          assert.strictEqual(Math.round(box.width), 400, `${name}: chart wide`);
        }
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    },
  );
}
