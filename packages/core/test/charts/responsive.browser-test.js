import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `sizeRatio` and `responsive` on a drawn chart: the height follows the
    width and props open an unsized container, breakpoints swap config in as
    the container narrows and back out as it grows, and an explicit height
    keeps the ratio out. Run with both renderers.
*/

const data = [
  {id: "alpha", x: "A", y: 30},
  {id: "beta", x: "B", y: 50},
  {id: "gamma", x: "C", y: 20},
];

/** Draws a BarChart into `#viz` and resolves once it rendered. */
const makeSrc = `(renderer, config) => new Promise(res => {
  const viz = new window.d3plus.BarChart()
    .data(${JSON.stringify(data)})
    .groupBy("id").x("x").y("y")
    .duration(0)
    .renderer(renderer)
    .config(config)
    .select("#viz");
  viz.render(() => res(viz));
})`;

/** Resizes `#box` to `width` and waits for the chart's resize redraw (debounced by `detectResizeDelay`, 400ms). */
const resizeSrc = `(width) => new Promise(res => {
  document.querySelector("#box").style.width = width + "px";
  setTimeout(res, 1000);
})`;

const titleSrc = `() => Array.from(
  document.querySelectorAll("#viz text, #viz .d3plus-textBox")
).map(t => t.textContent).join(" | ")`;

for (const renderer of ["svg", "canvas"]) {
  it(
    `${renderer}: sizeRatio sets the height from the width and holds the container open`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="box" style="width: 800px"><div id="viz"></div></div><p id="after">after</p>`,
        async ({makeSrc, resizeSrc, renderer}) => {
          const make = eval(makeSrc);
          const resize = eval(resizeSrc);
          const viz = await make(renderer, {sizeRatio: 2});
          const first = {
            width: viz.width(),
            height: viz.height(),
            box: document.querySelector("#viz").getBoundingClientRect().height,
            after: document.querySelector("#after").getBoundingClientRect().top,
          };
          await resize(500);
          return {
            first,
            second: {width: viz.width(), height: viz.height()},
          };
        },
        {makeSrc, resizeSrc, renderer},
      );
      assert.strictEqual(r.first.width, 800);
      assert.strictEqual(r.first.height, 400);
      assert.ok(
        Math.round(r.first.box) >= 400,
        `the container holds the chart (${r.first.box}px)`,
      );
      assert.ok(r.first.after >= 400, "the next element starts below it");
      assert.strictEqual(r.second.width, 500);
      assert.strictEqual(r.second.height, 250);
    },
  );

  it(
    `${renderer}: breakpoints apply as the chart narrows and come off as it grows`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="box" style="width: 800px"><div id="viz"></div></div>`,
        async ({makeSrc, resizeSrc, titleSrc, renderer}) => {
          const make = eval(makeSrc);
          const resize = eval(resizeSrc);
          const viz = await make(renderer, {
            title: "Wide title",
            sizeRatio: 2,
            responsive: [
              {maxWidth: 600, config: {title: "Narrow", sizeRatio: 1}},
            ],
          });
          const read = () => ({
            title: viz.schema.title(),
            height: viz.height(),
            drawn: renderer === "svg" ? eval(titleSrc)() : "",
          });
          const wide = read();
          await resize(400);
          const narrow = read();
          viz.title("Changed meanwhile");
          await resize(800);
          const back = read();
          return {wide, narrow, back};
        },
        {makeSrc, resizeSrc, titleSrc, renderer},
      );
      assert.strictEqual(r.wide.title, "Wide title");
      assert.strictEqual(r.wide.height, 400);
      assert.strictEqual(r.narrow.title, "Narrow");
      assert.strictEqual(r.narrow.height, 400, "the breakpoint's ratio of 1");
      assert.strictEqual(r.back.title, "Changed meanwhile");
      assert.strictEqual(r.back.height, 400);
      if (renderer === "svg") {
        assert.ok(/Wide title/.test(r.wide.drawn), r.wide.drawn);
        assert.ok(/Narrow/.test(r.narrow.drawn), r.narrow.drawn);
        assert.ok(/Changed meanwhile/.test(r.back.drawn), r.back.drawn);
      }
    },
  );

  it(
    `${renderer}: an explicit height keeps sizeRatio out`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="box" style="width: 600px"><div id="viz"></div></div>`,
        async ({makeSrc, renderer}) => {
          const make = eval(makeSrc);
          const viz = await make(renderer, {sizeRatio: 2});
          const ratio = viz.height();
          viz.height(150);
          await new Promise(res => viz.render(res));
          return {ratio, explicit: viz.height()};
        },
        {makeSrc, renderer},
      );
      assert.strictEqual(r.ratio, 300);
      assert.strictEqual(r.explicit, 150);
    },
  );

  it(
    `${renderer}: sizeRatio fits inside a container with a height of its own`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="box" style="width: 600px; height: 200px; padding: 10px"><div id="viz" style="height: 100%"></div></div><p id="after">after</p>`,
        async ({makeSrc, resizeSrc, renderer}) => {
          const make = eval(makeSrc);
          const resize = eval(resizeSrc);
          let draws = 0;
          const viz = await make(renderer, {sizeRatio: 2});
          viz.render(() => draws++);
          await new Promise(res => setTimeout(res, 300));
          const read = () => ({
            width: viz.width(),
            height: viz.height(),
            box: document.querySelector("#box").getBoundingClientRect().height,
          });
          const fitted = read();
          // Narrow enough that width / ratio is shorter than the box.
          await resize(300);
          const narrow = read();
          // The box's own height shrinks: the chart refits to it.
          document.querySelector("#box").style.height = "120px";
          document.querySelector("#box").style.width = "600px";
          await new Promise(res => setTimeout(res, 1000));
          const shrunk = read();
          const before = draws;
          await new Promise(res => setTimeout(res, 1500));
          return {fitted, narrow, shrunk, idleDraws: draws - before};
        },
        {makeSrc, resizeSrc, renderer},
      );
      assert.strictEqual(r.fitted.width, 600, "width() keeps the box's width");
      assert.strictEqual(r.fitted.height, 200, "capped at the box's height");
      assert.strictEqual(
        Math.round(r.fitted.box),
        220,
        "the box keeps its own height",
      );
      assert.strictEqual(r.narrow.width, 300);
      assert.strictEqual(r.narrow.height, 150, "width / ratio fits the box");
      assert.strictEqual(
        r.shrunk.height,
        120,
        "refits to the box's new height",
      );
      assert.strictEqual(r.shrunk.width, 600);
      assert.strictEqual(r.idleDraws, 0, "no resize loop once it settles");
    },
  );

  it(
    `${renderer}: sizeRatio in a container with no height settles without a resize loop`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="box" style="width: 600px; min-height: 100px"><div id="viz"></div></div>`,
        async ({makeSrc, resizeSrc, renderer}) => {
          const make = eval(makeSrc);
          const resize = eval(resizeSrc);
          let draws = 0;
          const viz = await make(renderer, {sizeRatio: 2});
          viz.render(() => draws++);
          await resize(400);
          const before = draws;
          await new Promise(res => setTimeout(res, 1500));
          return {
            height: viz.height(),
            box: document.querySelector("#box").getBoundingClientRect().height,
            idleDraws: draws - before,
          };
        },
        {makeSrc, resizeSrc, renderer},
      );
      assert.strictEqual(r.height, 200, "a min-height does not cap the ratio");
      assert.ok(Math.round(r.box) >= 200, `the box grows (${r.box}px)`);
      assert.strictEqual(r.idleDraws, 0, "no resize loop once it settles");
    },
  );
}
