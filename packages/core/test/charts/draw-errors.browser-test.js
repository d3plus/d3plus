import {afterEach, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    An error thrown while a chart draws is logged once with `console.error`,
    naming the chart, and the render callback still runs. It once ended the
    draw in an unhandled promise rejection, so `render(callback)` never called
    back and the chart hung with no message. Each draw that fails here throws
    from a `label` accessor; `render` itself fails a test on any uncaught error
    or unhandled rejection.
*/

const BODY = '<div id="viz" style="width:500px;height:300px"></div>';
const ROWS = [
  {id: "alpha", group: "A", value: 29},
  {id: "beta", group: "A", value: 10},
  {id: "gamma", group: "B", value: 18},
  {id: "delta", group: "B", value: 7},
];

let cleanup = [];
afterEach(() => {
  cleanup.forEach(f => f());
  cleanup = [];
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Throws, as a broken `label` accessor would. */
const boom = () => {
  throw new Error("label blew up");
};

/** Collects the page's `console.error` calls (as strings) until the test ends. */
function spyErrors() {
  const original = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.map(String).join(" "));
  cleanup.push(() => (console.error = original));
  return logged;
}

/**
    Resolves when `viz` calls back, or rejects after `ms`, so a draw that
    never calls back fails fast.
*/
function nextCallback(viz, ms = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("the render callback never ran")),
      ms,
    );
    viz._renderCallback = () => {
      clearTimeout(timer);
      resolve();
    };
  });
}

/** Renders `viz`, resolving once its callback runs (see `nextCallback`). */
function draw(viz, ms) {
  const done = nextCallback(viz, ms);
  viz.render(viz._renderCallback);
  return done;
}

/**
    How much of the chart is painted: the SVG's rects, or the canvas's
    non-white pixels.
*/
function painted() {
  const host = document.querySelector("#viz");
  const canvas = host.querySelector("canvas.d3plus-render-canvas");
  if (!canvas) return host.querySelectorAll("rect.d3plus-render-rect").length;
  const data = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 4)
    if (data[i + 3] > 250 && (data[i] < 245 || data[i + 2] < 245)) count++;
  return count;
}

/** A Treemap of `ROWS` on `renderer`, with no transitions. */
function treemap(renderer) {
  const viz = new window.d3plus.Treemap()
    .data(ROWS)
    .groupBy("id")
    .sum("value")
    .legend(false)
    .duration(0)
    .renderer(renderer)
    .select("#viz");
  cleanup.push(() => viz.destroy());
  return viz;
}

/** The logged draw errors, which name the chart and the error. */
const drawErrors = logged =>
  logged.filter(line => line.includes("could not draw"));

for (const renderer of ["svg", "canvas"]) {
  it(`draw errors (${renderer}): a draw that throws is logged, calls back, and leaves the last paint`, async () => {
    const out = await render(BODY, async () => {
      const logged = spyErrors();
      const viz = treemap(renderer).label(boom);
      await draw(viz);
      const failedFirst = {logged: [...logged], painted: painted()};

      viz.label(d => d.id);
      await draw(viz);
      const good = {logged: [...logged], painted: painted()};

      viz.label(boom);
      await draw(viz);
      const failedAgain = {logged: [...logged], painted: painted()};
      return {failedFirst, good, failedAgain};
    });
    assert.deepStrictEqual(out.failedFirst.logged, [
      "d3plus: Treemap could not draw. Error: label blew up",
    ]);
    assert.strictEqual(out.failedFirst.painted, 0, "nothing painted yet");
    assert.strictEqual(
      out.good.logged.length,
      1,
      "the good render logs nothing",
    );
    assert.ok(out.good.painted > 0, "the following render draws");
    assert.strictEqual(drawErrors(out.failedAgain.logged).length, 2);
    assert.strictEqual(
      out.failedAgain.painted,
      out.good.painted,
      "a failed redraw keeps what the chart last painted",
    );
  });

  it(`draw errors (${renderer}): an error the callback throws is reported once, by the browser`, async () => {
    // A page of its own, whose uncaught errors the test runner doesn't see.
    const {page, errors, close} = await openPage(BODY);
    try {
      const logged = await page.evaluate(
        renderer =>
          new Promise((resolve, reject) => {
            const logged = [];
            console.error = (...args) =>
              logged.push(args.map(String).join(" "));
            const timer = setTimeout(
              () => reject(new Error("the render callback never ran")),
              3000,
            );
            window.addEventListener(
              "error",
              () => setTimeout(() => resolve(logged), 50),
              {once: true},
            );
            new window.d3plus.Treemap()
              .data([
                {id: "alpha", value: 29},
                {id: "beta", value: 10},
              ])
              .groupBy("id")
              .sum("value")
              .duration(0)
              .renderer(renderer)
              .label(() => {
                throw new Error("label blew up");
              })
              .select("#viz")
              .render(() => {
                clearTimeout(timer);
                throw new Error("callback blew up");
              });
          }),
        renderer,
      );
      assert.deepStrictEqual(errors, ["Uncaught Error: callback blew up"]);
      assert.deepStrictEqual(logged, [
        "d3plus: Treemap could not draw. Error: label blew up",
      ]);
    } finally {
      await close();
    }
  });

  it(`draw errors (${renderer}): a draw that throws after loading data hides the loading message`, async () => {
    const out = await render(BODY, async () => {
      const logged = spyErrors();
      const original = window.fetch;
      window.fetch = async () => {
        await sleep(100);
        return new Response(JSON.stringify(ROWS), {status: 200});
      };
      cleanup.push(() => (window.fetch = original));
      const viz = treemap(renderer)
        .data("/__draw-errors/rows.json")
        .label(boom);
      const done = nextCallback(viz);
      viz.render(viz._renderCallback);
      const loading = viz._messageClass._isVisible;
      await done;
      return {loading, after: viz._messageClass._isVisible, logged};
    });
    assert.strictEqual(out.loading, true, "the loading message shows");
    assert.strictEqual(out.after, false, "the loading message is hidden");
    assert.deepStrictEqual(out.logged, [
      "d3plus: Treemap could not draw. Error: label blew up",
    ]);
  });

  it(`draw errors (${renderer}): a dataFormat that throws on a cached load fails the load, not the draw`, async () => {
    const out = await render(BODY, async () => {
      const logged = spyErrors();
      const original = window.fetch;
      window.fetch = async () =>
        new Response(JSON.stringify(ROWS), {status: 200});
      cleanup.push(() => (window.fetch = original));
      const format = () => {
        throw new Error("format blew up");
      };
      const url = "/__draw-errors/cached.json";
      const fetched = treemap(renderer).data(url, format);
      await draw(fetched);
      fetched.destroy();
      // The response is cached now, so this load formats synchronously.
      const cached = treemap(renderer).data(url, format);
      await draw(cached);
      return logged;
    });
    assert.deepStrictEqual(out, [
      "Error: format blew up",
      "Error: format blew up",
    ]);
  });

  it(`draw errors (${renderer}): a redraw after a resize that throws is logged and calls back`, async () => {
    const out = await render(BODY, async () => {
      const logged = spyErrors();
      const viz = treemap(renderer).detectResizeDelay(10);
      await draw(viz);
      viz.label(boom);
      const done = nextCallback(viz);
      document.querySelector("#viz").style.width = "400px";
      await done;
      return logged;
    });
    assert.deepStrictEqual(out, [
      "d3plus: Treemap could not draw. Error: label blew up",
    ]);
  });

  it(`draw errors (${renderer}): a draw deferred until the chart scrolls into view is logged and calls back`, async () => {
    const out = await render(
      `<div style="height:3000px"></div>${BODY}`,
      async () => {
        const logged = spyErrors();
        const viz = treemap(renderer).label(boom);
        const done = nextCallback(viz);
        viz.render(viz._renderCallback);
        await sleep(100);
        const deferred = logged.length;
        document.querySelector("#viz").scrollIntoView();
        await done;
        return {deferred, logged};
      },
    );
    assert.strictEqual(out.deferred, 0, "nothing draws while off-screen");
    assert.deepStrictEqual(out.logged, [
      "d3plus: Treemap could not draw. Error: label blew up",
    ]);
  });

  it(`draw errors (${renderer}): a facet panel that throws is logged, and the next render draws every panel`, async () => {
    const out = await render(BODY, async () => {
      const logged = spyErrors();
      const viz = treemap(renderer)
        .facet("group")
        .label(d => (d.group === "B" ? boom() : d.id));
      await draw(viz);
      viz.label(d => d.id);
      await draw(viz);
      return {logged, panels: viz._facetPanels.length};
    });
    assert.deepStrictEqual(out.logged, [
      "d3plus: Treemap could not draw. Error: label blew up",
    ]);
    assert.strictEqual(out.panels, 2);
  });
}
