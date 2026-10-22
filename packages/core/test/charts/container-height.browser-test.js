import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A chart with an explicit height (or width) in a container that has no size
    of its own reserves that size in the page's layout, so the next element on
    the page starts below it instead of drawing over it. A container sized by
    CSS keeps its own size, a new size moves the reservation, and the tooltip
    and zoom controls still sit over the chart they belong to. Run with both
    renderers: the svg is absolutely positioned (an in-flow spacer holds its
    size), the canvas is in flow itself.
*/

const data = [
  {id: "alpha", x: "A", y: 30},
  {id: "beta", x: "B", y: 50},
  {id: "gamma", x: "C", y: 20},
];

/** Renders a BarChart into `sel` and resolves with the chart. */
const makeSrc = `(sel, renderer, config) => new Promise(res => {
  const viz = new window.d3plus.BarChart()
    .data(${JSON.stringify(data)})
    .groupBy("id").x("x").y("y")
    .duration(0)
    .renderer(renderer)
    .config(config)
    .select(sel);
  viz.render(() => res(viz));
})`;

const box = sel => {
  const r = document.querySelector(sel).getBoundingClientRect();
  return {
    top: r.top,
    bottom: r.bottom,
    height: r.height,
    width: r.width,
    left: r.left,
    right: r.right,
  };
};

/** The painted surface: the canvas in canvas mode, the chart svg otherwise. */
const surfaceSrc = `sel => {
  const el = document.querySelector(sel + " canvas.d3plus-render-canvas") ||
    document.querySelector(sel + " svg.d3plus-viz");
  const r = el.getBoundingClientRect();
  return {top: r.top, bottom: r.bottom, height: r.height, width: r.width};
}`;

for (const renderer of ["svg", "canvas"]) {
  it(
    `${renderer}: two charts with explicit heights in unsized containers stack`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a" style="padding: 10px"></div><div id="b" style="padding: 10px"></div>`,
        async ({makeSrc, surfaceSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const surface = eval(surfaceSrc);
          const box = eval(boxSrc);
          await make("#a", renderer, {height: 200});
          await make("#b", renderer, {height: 200});
          return {
            a: box("#a"),
            b: box("#b"),
            surfaceA: surface("#a"),
            surfaceB: surface("#b"),
          };
        },
        {makeSrc, surfaceSrc, renderer, boxSrc: box.toString()},
      );
      assert.strictEqual(
        Math.round(r.a.height),
        220,
        "first container holds the chart and its padding",
      );
      assert.strictEqual(
        Math.round(r.b.height),
        220,
        "second container holds the chart and its padding",
      );
      assert.ok(
        r.surfaceA.bottom <= r.b.top,
        `first chart ends (${r.surfaceA.bottom}) before the second container starts (${r.b.top})`,
      );
      assert.strictEqual(Math.round(r.surfaceA.height), 200);
      assert.strictEqual(
        Math.round(r.surfaceB.top - r.b.top),
        10,
        "second chart sits inside its container's padding",
      );
    },
  );

  it(
    `${renderer}: an explicit width widens a shrink-to-fit container`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a" style="display: inline-block"></div>`,
        async ({makeSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const box = eval(boxSrc);
          await make("#a", renderer, {width: 260, height: 180});
          return box("#a");
        },
        {makeSrc, renderer, boxSrc: box.toString()},
      );
      assert.strictEqual(Math.round(r.width), 260);
      assert.ok(Math.round(r.height) >= 180, `container is ${r.height}px tall`);
    },
  );

  it(
    `${renderer}: side-by-side flex items each reserve their own chart's height`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div style="display: flex"><div id="a" style="flex: 1"></div><div id="b" style="flex: 1"></div></div><div id="after">after</div>`,
        async ({makeSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const box = eval(boxSrc);
          await make("#a", renderer, {height: 300});
          await make("#b", renderer, {height: 150});
          return {a: box("#a"), b: box("#b"), after: box("#after")};
        },
        {makeSrc, renderer, boxSrc: box.toString()},
      );
      assert.strictEqual(Math.round(r.a.height), 300);
      assert.ok(
        Math.round(r.after.top) >= 300,
        `following content starts at ${r.after.top}`,
      );
    },
  );

  it(
    `${renderer}: a container sized by CSS keeps its size, and an auto-sized chart fills it`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a" style="height: 120px"></div><div id="b" style="height: 300px"></div>`,
        async ({makeSrc, surfaceSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const surface = eval(surfaceSrc);
          const box = eval(boxSrc);
          await make("#a", renderer, {height: 200});
          await make("#b", renderer, {});
          return {a: box("#a"), b: box("#b"), surfaceB: surface("#b")};
        },
        {makeSrc, surfaceSrc, renderer, boxSrc: box.toString()},
      );
      assert.strictEqual(
        Math.round(r.a.height),
        120,
        "a CSS height wins over the chart's",
      );
      assert.strictEqual(Math.round(r.b.height), 300);
      assert.strictEqual(
        Math.round(r.surfaceB.height),
        300,
        "an auto-sized chart fills its container",
      );
    },
  );

  it(
    `${renderer}: a new height moves the reservation, and RESET drops it`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a"></div><div id="b" style="height: 260px"></div>`,
        async ({makeSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const box = eval(boxSrc);
          const a = await make("#a", renderer, {height: 200});
          const first = box("#a").height;
          await new Promise(res => a.height(120).render(res));
          const second = box("#a").height;
          const b = await make("#b", renderer, {height: 100});
          await new Promise(res =>
            b.config({height: window.d3plus.RESET}).render(res),
          );
          return {
            first,
            second,
            b: box("#b").height,
            bChart: b.height(),
            spacers: document.querySelectorAll("#b .d3plus-viz-spacer").length,
          };
        },
        {makeSrc, renderer, boxSrc: box.toString()},
      );
      assert.strictEqual(Math.round(r.first), 200);
      assert.strictEqual(Math.round(r.second), 120, "shrinks with the chart");
      assert.strictEqual(Math.round(r.b), 260);
      assert.strictEqual(
        Math.round(r.bChart),
        260,
        "a RESET height fills the container again",
      );
      assert.strictEqual(r.spacers, 0, "no spacer is left behind");
    },
  );

  it(
    `${renderer}: a RESET height keeps the measured width automatic`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a" style="width: 500px; height: 260px"></div>`,
        async ({makeSrc, renderer}) => {
          const make = eval(makeSrc);
          const a = await make("#a", renderer, {height: 100});
          await new Promise(res =>
            a.config({height: window.d3plus.RESET}).render(res),
          );
          const before = a.width();
          document.querySelector("#a").style.width = "320px";
          await new Promise(res =>
            setTimeout(res, a.detectResizeDelay() + 600),
          );
          return {
            before,
            after: a.width(),
            spacers: document.querySelectorAll("#a .d3plus-viz-spacer").length,
          };
        },
        {makeSrc, renderer},
      );
      assert.strictEqual(Math.round(r.before), 500);
      assert.strictEqual(
        Math.round(r.after),
        320,
        "the chart follows its container's new width",
      );
      assert.strictEqual(r.spacers, 0);
    },
  );

  it(
    `${renderer}: tooltips and zoom controls sit over the chart they belong to`,
    {timeout: 120000},
    async function () {
      const r = await render(
        `<div id="a" style="padding: 10px"></div><div id="b" style="padding: 10px"></div>`,
        async ({makeSrc, renderer, boxSrc}) => {
          const make = eval(makeSrc);
          const box = eval(boxSrc);
          const tick = ms => new Promise(res => setTimeout(res, ms));
          await make("#a", renderer, {height: 200});
          const b = await make("#b", renderer, {height: 200});
          const boxB = box("#b");
          const shown = () =>
            [
              ...(b._tooltipClass._portalEl?.querySelectorAll(
                ".d3plus-tooltip",
              ) ?? []),
            ].filter(t => getComputedStyle(t).visibility === "visible");
          let point;
          for (let y = 20; y < boxB.height && !point; y += 10)
            for (let x = 20; x < boxB.width && !point; x += 20) {
              const [cx, cy] = [boxB.left + x, boxB.top + y];
              document.elementFromPoint(cx, cy).dispatchEvent(
                new MouseEvent("mousemove", {
                  clientX: cx,
                  clientY: cy,
                  bubbles: true,
                }),
              );
              await tick(0);
              if (shown().length) point = [cx, cy];
            }
          const tip = shown()[0];
          const controls = id =>
            [...document.querySelectorAll(`${id} .d3plus-zoom-control`)]
              .map(el => el.getBoundingClientRect())
              .map(r => ({top: r.top, bottom: r.bottom}));
          return {
            point,
            tipTop: tip ? tip.getBoundingClientRect().top : null,
            boxA: box("#a"),
            boxB,
            controlsA: controls("#a"),
            controlsB: controls("#b"),
          };
        },
        {makeSrc, renderer, boxSrc: box.toString()},
      );
      assert.ok(r.point, "a mark in the second chart shows a tooltip");
      assert.ok(
        Math.abs(r.tipTop - r.point[1]) < 150,
        `tooltip is next to the pointer (${r.tipTop} vs ${r.point[1]})`,
      );
      assert.ok(
        r.controlsA.length && r.controlsB.length,
        "both charts draw zoom controls",
      );
      for (const c of r.controlsA)
        assert.ok(
          c.top >= r.boxA.top && c.bottom <= r.boxA.bottom,
          "first chart's controls are inside its container",
        );
      for (const c of r.controlsB)
        assert.ok(
          c.top >= r.boxB.top && c.bottom <= r.boxB.bottom,
          "second chart's controls are inside its container",
        );
    },
  );
}
