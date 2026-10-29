import {afterEach, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `reducedMotion`: under `"auto"` (default) a chart follows the OS's
    `(prefers-reduced-motion: reduce)` setting, `true` always draws without
    motion, and `false` always animates. These tests stub `window.matchMedia`
    in the test page to stand in for the OS setting.
*/

const realMatchMedia = window.matchMedia;

/** Makes the page report `(prefers-reduced-motion: reduce)` as `reduce`. */
function stubReducedMotion(reduce) {
  window.matchMedia = query => ({
    matches: query.includes("prefers-reduced-motion") ? reduce : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const first = [
  {id: "alpha", value: 30},
  {id: "beta", value: 20},
  {id: "gamma", value: 10},
];
const second = [
  {id: "alpha", value: 5},
  {id: "beta", value: 20},
  {id: "gamma", value: 40},
];

/**
    Draws a Treemap with the default `duration` and `config`, records the
    duration of every scene draw, then redraws with changed data. Resolves,
    in the redraw's callback, with what was recorded and whether the painted
    picture already sits at its final geometry.
*/
const redraw = ([renderer, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .renderer(renderer)
      .width(500)
      .height(400)
      .legend(false)
      .data(config.first)
      .groupBy("id")
      .sum("value")
      .config(config.viz);
    viz.render(() => {
      const durations = [];
      const draw = viz._sceneRenderer.drawScene.bind(viz._sceneRenderer);
      viz._sceneRenderer.drawScene = (scene, opts) => {
        durations.push(opts?.duration ?? 0);
        return draw(scene, opts);
      };
      viz.data(config.second).render(() => {
        const rects = [];
        const visit = node => {
          if (node.type === "rect" && String(node.key).includes("alpha"))
            rects.push(node);
          (node.children || []).forEach(visit);
        };
        visit(viz._paintedScene.root);
        let settled;
        if (renderer === "svg") {
          settled = rects.every(node => {
            const el = document.querySelector(
              `#viz [data-key="${CSS.escape(String(node.key))}"]`,
            );
            return (
              el &&
              Math.abs(Number(el.getAttribute("width")) - node.width) < 0.5 &&
              Math.abs(Number(el.getAttribute("height")) - node.height) < 0.5
            );
          });
        } else {
          settled =
            !viz._sceneRenderer._cancelAnim &&
            viz._sceneRenderer._scene === viz._paintedScene;
        }
        resolve({
          durations,
          rects: rects.length,
          settled,
          transitionPending:
            viz._transitionEndsAt !== undefined &&
            viz._transitionEndsAt > Date.now(),
          duration: viz.duration(),
          reducedMotion: viz.reducedMotion(),
        });
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`reducedMotion auto: the OS setting makes a redraw instant (${renderer})`, async () => {
    stubReducedMotion(true);
    const out = await render('<div id="viz"></div>', redraw, [
      renderer,
      {first, second, viz: {}},
    ]);
    assert.strictEqual(out.reducedMotion, "auto");
    assert.ok(out.durations.length > 0, "the redraw painted");
    assert.deepStrictEqual(
      out.durations.filter(d => d > 0),
      [],
      "every draw is instant",
    );
    assert.strictEqual(out.transitionPending, false, "no transition in flight");
    assert.ok(out.rects > 0, "the scene holds the alpha rect");
    assert.strictEqual(out.settled, true, "painted at the final geometry");
    assert.strictEqual(out.duration, 600, "duration() keeps the user's value");
  });

  it(`reducedMotion false: animates although the OS reduces motion (${renderer})`, async () => {
    stubReducedMotion(true);
    const out = await render('<div id="viz"></div>', redraw, [
      renderer,
      {first, second, viz: {reducedMotion: false, duration: 400}},
    ]);
    assert.ok(out.durations.includes(400), `animated: ${out.durations}`);
    assert.strictEqual(out.duration, 400);
  });

  it(`reducedMotion true: no motion although the OS allows it (${renderer})`, async () => {
    stubReducedMotion(false);
    const out = await render('<div id="viz"></div>', redraw, [
      renderer,
      {first, second, viz: {reducedMotion: true, duration: 800}},
    ]);
    assert.ok(out.durations.length > 0);
    assert.deepStrictEqual(
      out.durations.filter(d => d > 0),
      [],
    );
    assert.strictEqual(out.transitionPending, false);
    assert.strictEqual(out.settled, true);
    assert.strictEqual(out.duration, 800, "duration() keeps the user's value");
  });
}

it("reducedMotion auto: animates when the OS allows motion", async () => {
  stubReducedMotion(false);
  const out = await render('<div id="viz"></div>', redraw, [
    "svg",
    {first, second, viz: {duration: 300}},
  ]);
  assert.ok(out.durations.includes(300), `animated: ${out.durations}`);
});

it("reducedMotion: zoom buttons, which pass their own duration, zoom instantly", async () => {
  stubReducedMotion(true);
  const out = await render(
    '<div id="viz"></div>',
    data =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#viz")
          .width(500)
          .height(400)
          .data(data)
          .groupBy("id")
          .sum("value")
          .zoomMax(16);
        viz.render(() => {
          const durations = [];
          const draw = viz._sceneRenderer.drawScene.bind(viz._sceneRenderer);
          viz._sceneRenderer.drawScene = (scene, opts) => {
            durations.push(opts?.duration ?? 0);
            return draw(scene, opts);
          };
          document.querySelector("#viz .zoom-in").click();
          viz._zoomToBounds(
            [
              [0, 0],
              [100, 100],
            ],
            900,
          );
          resolve({
            durations,
            scale: viz._zoomTransform && viz._zoomTransform.scale,
            transitionPending:
              viz._transitionEndsAt !== undefined &&
              viz._transitionEndsAt > Date.now(),
          });
        });
      }),
    first,
  );
  assert.ok(out.durations.length >= 2, `zoomed twice: ${out.durations}`);
  assert.deepStrictEqual(
    out.durations.filter(d => d > 0),
    [],
  );
  assert.ok(out.scale > 1, "zoomed in");
  assert.strictEqual(out.transitionPending, false);
});

it("reducedMotion: chrome outside the scene draw drops its transitions", async () => {
  stubReducedMotion(true);
  const out = await render(
    '<div id="viz"></div>',
    data =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#viz")
          .width(500)
          .height(400)
          .data(data.map((d, i) => ({...d, year: 2020 + (i % 2)})))
          .groupBy("id")
          .sum("value")
          .time("year")
          .search(true)
          .minimap(true)
          .zoomMax(16);
        viz.render(() => {
          const minimap = document.querySelector("#viz .d3plus-minimap");
          const search = document.querySelector("#viz .search-input");
          if (!minimap || !search) throw new Error("missing chrome");
          resolve({
            minimap: getComputedStyle(minimap).transitionDuration,
            search: getComputedStyle(search).transitionDuration,
            legend: viz._legendClass.duration(),
            timeline: viz._timelineClass.duration(),
            duration: viz.duration(),
          });
        });
      }),
    first,
  );
  assert.strictEqual(out.minimap, "0s", "the minimap fades instantly");
  assert.strictEqual(out.search, "0s", "the search box opens instantly");
  assert.strictEqual(out.legend, 0, "the legend gets no duration");
  assert.strictEqual(out.timeline, 0, "the timeline gets no duration");
  assert.strictEqual(out.duration, 600);
});

it("reducedMotion: the same chrome keeps its transitions with motion allowed", async () => {
  stubReducedMotion(false);
  const out = await render(
    '<div id="viz"></div>',
    data =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#viz")
          .width(500)
          .height(400)
          .data(data)
          .groupBy("id")
          .sum("value")
          .search(true)
          .minimap(true)
          .zoomMax(16);
        viz.render(() => {
          resolve({
            minimap: getComputedStyle(
              document.querySelector("#viz .d3plus-minimap"),
            ).transitionDuration,
            search: getComputedStyle(
              document.querySelector("#viz .search-input"),
            ).transitionDuration,
            legend: viz._legendClass.duration(),
          });
        });
      }),
    first,
  );
  assert.strictEqual(out.minimap, "0.6s");
  assert.strictEqual(out.search, "0.15s, 0.15s");
  assert.strictEqual(out.legend, 600);
});
