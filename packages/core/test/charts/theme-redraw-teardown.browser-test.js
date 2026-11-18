import {afterEach, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An `"auto"` themed chart redraws when its page flips between light and
    dark. A framework that unmounts the chart in the same task (destroying it,
    removing its container, or both) does so after the page's observer has
    started that redraw but before it draws, a microtask later. The draw is
    then dropped, with nothing logged: an animated SVG draw into a container
    off the page throws "transition N not found" (logged as "could not
    draw"), and a draw for a destroyed chart would mount its renderer and
    page watcher again.
*/

const BODY = `<style>html[data-theme="dark"] body {background: #111;}</style>
<div id="wrap"><div id="viz" style="width:500px;height:300px"></div></div>`;

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

const ROWS = [];
for (const platform of ["web", "ios", "android"])
  for (let month = 1; month <= 6; month++)
    ROWS.push({platform, month, users: 10 + month * (platform.length + 1)});

const charts = {
  StackedArea: {
    data: ROWS,
    groupBy: "platform",
    x: "month",
    y: "users",
    time: "month",
    timeline: false,
  },
  LinePlot: {data: ROWS, groupBy: "platform", x: "month", y: "users"},
  Treemap: {
    data: [
      {id: "a", value: 30},
      {id: "b", value: 20},
    ],
    sum: "value",
  },
  Pie: {
    data: [
      {id: "a", value: 30},
      {id: "b", value: 20},
    ],
    value: "value",
  },
};

/** How each test takes the chart down, as page-side source taking `viz`. */
const teardowns = {
  "is destroyed": "viz.destroy()",
  "has its container removed": "document.querySelector('#wrap').remove()",
  "is destroyed and has its container removed":
    "viz.destroy(); document.querySelector('#wrap').remove()",
};

/**
    Runs in the page: draws `chart` on a light page, then, in one task, flips
    the page dark and (a microtask later, as a framework's unmount lands)
    runs `teardown`. Reports what was logged and what the chart did after.
*/
const flipAndTearDown = ([chart, json, renderer, teardown]) =>
  new Promise(resolve => {
    const logged = [];
    const original = console.error;
    console.error = (...args) =>
      logged.push(args.map(a => a?.stack || String(a)).join(" "));
    const viz = new window.d3plus[chart]()
      .config(JSON.parse(json))
      .renderer(renderer)
      .select("#viz");
    let callbacks = 0;
    viz.render(() => {
      if (++callbacks > 1) return;
      const before = viz._theme.dark;
      document.documentElement.dataset.theme = "dark";
      queueMicrotask(() => new Function("viz", teardown)(viz));
      setTimeout(() => {
        console.error = original;
        resolve({
          before,
          after: viz._theme.dark,
          logged,
          callbacks,
          renderer: Boolean(viz._sceneRenderer),
          watching: Boolean(viz._themeWatch),
        });
      }, viz.duration() + 400);
    });
  });

for (const renderer of ["svg", "canvas"])
  for (const [chart, config] of Object.entries(charts))
    for (const [label, teardown] of Object.entries(teardowns))
      it(`${chart} ${renderer}: the page turning dark in the same task the chart ${label} drops its redraw`, async () => {
        const out = await render(BODY, flipAndTearDown, [
          chart,
          JSON.stringify(config),
          renderer,
          teardown,
        ]);
        assert.strictEqual(out.before, false, "drew light first");
        assert.deepStrictEqual(out.logged, [], "nothing logged");
        assert.strictEqual(out.after, false, "the redraw never drew");
        if (/destroyed/.test(label)) {
          assert.strictEqual(out.callbacks, 1, "no callback once destroyed");
          assert.strictEqual(out.renderer, false, "no renderer mounted again");
          assert.strictEqual(out.watching, false, "no page watcher again");
        } else {
          assert.strictEqual(out.callbacks, 2, "the callback still runs");
        }
      });

it("a chart still on the page redraws when it turns dark", async () => {
  const out = await render(
    BODY,
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.StackedArea()
          .data([
            {id: "a", x: 1, y: 2},
            {id: "a", x: 2, y: 3},
          ])
          .groupBy("id")
          .x("x")
          .y("y")
          .select("#viz");
        let callbacks = 0;
        viz.render(() => {
          if (++callbacks === 1) {
            document.documentElement.dataset.theme = "dark";
            return;
          }
          resolve(viz._theme.dark);
          viz.destroy();
        });
      }),
  );
  assert.strictEqual(out, true);
});

it("a render a chart is destroyed in the same task as draws nothing", async () => {
  const out = await render(
    BODY,
    () =>
      new Promise(resolve => {
        let callbacks = 0;
        const viz = new window.d3plus.Treemap()
          .data([{id: "a", value: 1}])
          .sum("value")
          .select("#viz")
          .render(() => callbacks++)
          .destroy();
        setTimeout(
          () =>
            resolve({
              callbacks,
              renderer: Boolean(viz._sceneRenderer),
              painted: document.querySelectorAll("#viz .d3plus-render-svg")
                .length,
            }),
          viz.duration() + 400,
        );
      }),
  );
  assert.deepStrictEqual(out, {callbacks: 0, renderer: false, painted: 0});
});
