import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Box-scoped events on a real BoxWhisker, on both backends.

    A Box draws its parts through inner shapes (a Rect box and median, Whisker
    lines and endpoints, Circle outliers), so each part's node is stamped with
    its inner shape's type. These click every part with a real pointer and
    assert `"click.Box"` (and the Box enter/move/leave handlers) fire once per
    part with the box's own datum, while `.shape`, the part-scoped `.Rect`/
    `.Line`/`.Circle` handlers, and the global handler report what they always
    have.
*/

const rows = [
  ...[300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900].map(value => ({id: "alpha", value})),
  ...[180, 30, 120, 50, 140, 115].map(value => ({id: "beta", value})),
];

const handlers = [
  "click.Box", "mouseenter.Box", "mousemove.Box", "mouseleave.Box",
  "click.Whisker", "click.shape", "click.Rect", "click.Line", "click.Circle", "click",
];

// Every alpha part, by the key it's drawn under.
const parts = [
  "alpha-box", "alpha-median", "alpha-whisker-top", "alpha-whisker-bottom",
  "alpha-whisker-top-end", "alpha-whisker-bottom-end", "alpha-outlier-11",
];

async function chart(renderer) {
  const opened = await openPage('<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>');
  await opened.page.evaluate(([data, renderer, handlers]) => new Promise(resolve => {
    window.__log = [];
    const viz = new window.d3plus.BoxWhisker()
      .data(data).groupBy(["id", "value"]).x("id").y("value")
      .renderer(renderer).duration(0).select("#viz");
    for (const key of handlers) viz.on(key, (d, i, x) => window.__log.push({key, d, i, x}));
    window.__viz = viz;
    viz.render(() => resolve());
  }), [rows, renderer, handlers]);
  return opened;
}

// Where each part sits, read off the SVG render (both backends lay out alike).
async function partCenters() {
  const {page, close} = await chart("svg");
  try {
    return await page.evaluate(keys => Object.fromEntries(keys.map(key => {
      const r = document.querySelector(`#viz [data-key="${key}"]`).getBoundingClientRect();
      return [key, [r.left + r.width / 2, r.top + r.height / 2]];
    })), parts);
  } finally {
    await close();
  }
}

/**
    Hovers and clicks a part, then leaves it, and summarizes what fired:
    `counts` per handler, and per handler whether every datum it got was the
    box's own datum (the one `.shape` reports on the box Rect).
*/
async function interact(page, [x, y]) {
  await page.mouse.move(5, 5);
  await page.evaluate(() => { window.__log = []; });
  await page.mouse.move(x, y);
  await page.mouse.click(x, y);
  await page.mouse.move(5, 5);
  return page.evaluate(() => {
    const counts = {}, ofBox = {}, of = {};
    for (const {key, d, i, x} of window.__log) {
      counts[key] = (counts[key] || 0) + 1;
      const box = !!x && x.id === "alpha" && Array.isArray(x.values) && d === x.data && i === x.i;
      ofBox[key] = (ofBox[key] ?? true) && box;
      of[key] = {d, i, x};
    }
    const same = (a, b) => !!of[a] && !!of[b] && of[a].d === of[b].d && of[a].i === of[b].i && of[a].x === of[b].x;
    return {counts, ofBox, sameAsShape: Object.fromEntries(Object.keys(of).map(k => [k, same(k, "click.shape")]))};
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker (${renderer}): Box-scoped handlers fire once per part, with the box's datum`, {timeout: 120000}, async function () {
    const centers = await partCenters();
    const {page, errors, close} = await chart(renderer);
    try {
      for (const part of parts) {
        const {counts, ofBox, sameAsShape} = await interact(page, centers[part]);
        const scoped = part.includes("outlier") ? "click.Circle"
          : /whisker-(top|bottom)$/.test(part) ? "click.Line"
            : "click.Rect";
        const inWhisker = part.includes("whisker");
        assert.deepStrictEqual(
          {click: counts["click.Box"], enter: counts["mouseenter.Box"], leave: counts["mouseleave.Box"]},
          {click: 1, enter: 1, leave: 1},
          `${part}: click/enter/leave.Box once each (got ${JSON.stringify(counts)})`,
        );
        assert.ok(counts["mousemove.Box"] >= 1, `${part}: mousemove.Box fires`);
        for (const key of ["click.Box", "mouseenter.Box", "mousemove.Box", "mouseleave.Box"])
          assert.ok(ofBox[key], `${part}: ${key} gets the alpha box's datum`);
        // Part-scoped and generic handlers are untouched: once each, same datum as `.shape`.
        assert.strictEqual(counts["click.shape"], 1, `${part}: click.shape once`);
        assert.strictEqual(counts.click, 1, `${part}: click once`);
        assert.strictEqual(counts[scoped], 1, `${part}: ${scoped} once`);
        assert.ok(sameAsShape[scoped] && sameAsShape.click, `${part}: ${scoped} and click report the .shape datum`);
        for (const other of ["click.Rect", "click.Line", "click.Circle"].filter(k => k !== scoped))
          assert.ok(!counts[other], `${part}: ${other} does not fire`);
        assert.strictEqual(counts["click.Whisker"] || 0, inWhisker ? 1 : 0, `${part}: click.Whisker only on whisker parts`);
      }
      // The box Rect's own `.shape` datum is the box's datum.
      const box = await interact(page, centers["alpha-box"]);
      assert.ok(box.sameAsShape["click.Box"], "on the box Rect, click.Box reports exactly what click.shape does");
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}
