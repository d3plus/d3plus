import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Networks over time, in Chromium: `nodes` and `links` with a `time` key
    give the timeline its periods and follow its selection. On a change,
    nodes that stay keep their places, new ones enter beside a linked
    neighbor, and the rest leave; a live network then settles, a large one
    settles before it paints.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

/** A chain that grows by two nodes a year, linked to the one before. */
const growing = (() => {
  const nodes = [];
  const links = [];
  for (let year = 2020; year <= 2022; year++) {
    const count = 6 + (year - 2020) * 2;
    for (let i = 0; i < count; i++) {
      nodes.push({id: `n${i}`, year});
      if (i) links.push({source: `n${i}`, target: `n${i - 1}`, year});
    }
    links.push({source: "n0", target: `n${count - 1}`, year});
  }
  return {nodes, links};
})();

/** Runs in the page: starts drawing a Network over time. */
const start = ([json, renderer]) => {
  window.__drawn = false;
  window.__viz = new window.d3plus.Network()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .time("year")
    .config(JSON.parse(json))
    .render(() => (window.__drawn = window.__shown()));
  return true;
};

/** Runs in the page: selects `year` on the timeline, as a click on it does. */
const select = year => {
  const viz = window.__viz;
  window.__drawn = false;
  viz._timelineSelection = [
    new Date(`${year}/01/01`),
    new Date(`${year}/01/01`),
  ];
  // Holds the live simulation (as a transition in flight does) so the
  // callback sees the first paint.
  viz._transitionEndsAt = Date.now() + 60000;
  viz
    .timeFilter(d => d.year === year)
    .render(() => (window.__drawn = window.__shown()));
  return true;
};

/**
    Waits until the chart has painted, returning what it showed then (see
    `shown`).
*/
async function painted(page) {
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__drawn)); i++)
    await page.waitForTimeout(16);
  const drawn = await page.evaluate(() => window.__drawn);
  assert.ok(drawn, "drawn");
  return drawn;
}

/** Waits until the live simulation has cooled. */
async function cooled(page) {
  for (
    let i = 0;
    i < 300 &&
    (await page.evaluate(() => !!window.__viz.ctx.networkLive.frame));
    i++
  )
    await page.waitForTimeout(50);
}

/** Runs in the page: the drawn node ids, their positions, and the timeline's ticks. */
const shown = () => {
  const viz = window.__viz;
  const ids = [];
  const walk = n => {
    const m = String(n.key).match(/^network-Circle-(.+)$/);
    if (m) ids.push(m[1]);
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  const state = viz.ctx.networkLive;
  return {
    ids: ids.sort(),
    at: Object.fromEntries(
      [...state.positions].map(([id, p]) => [id, [p.x, p.y]]),
    ),
    r: viz.ctx.nodeLookup.n0?.r ?? 0,
    links: (viz.ctx.linkGraph?.links ?? []).length,
    ticks: viz._timelineClass?.ticks?.()?.length ?? 0,
    live: !!state.sim,
  };
};

/** Installs `shown` in the page, for the draws' callbacks. */
const install = page =>
  page.evaluate(src => (window.__shown = eval(`(${src})`)), shown.toString());

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const range = n => Array.from({length: n}, (_, i) => `n${i}`).sort();

for (const renderer of ["svg", "canvas"]) {
  it(`nodes and links follow the timeline, kept nodes stay and new ones enter beside a neighbor (${renderer})`, () =>
    withPage(box, async page => {
      await install(page);
      await page.evaluate(start, [
        JSON.stringify({...growing, timelineDefault: [2020]}),
        renderer,
      ]);
      const first = await painted(page);
      assert.strictEqual(first.ticks, 3, "periods from nodes and links");
      assert.deepStrictEqual(first.ids, range(6));
      assert.strictEqual(first.links, 6);
      await cooled(page);
      const settled = await page.evaluate(shown);

      await page.evaluate(select, 2021);
      const next = await painted(page);
      assert.deepStrictEqual(next.ids, range(8));
      assert.strictEqual(next.links, 8);
      for (const id of range(6))
        assert.ok(dist(next.at[id], settled.at[id]) < 1e-6, `${id} stays`);
      // n6 enters beside n5, its only linked neighbor that was drawn.
      assert.ok(
        dist(next.at.n6, settled.at.n5) < next.r * 4,
        `n6 beside n5: ${next.at.n6} vs ${settled.at.n5}`,
      );
      assert.ok(next.live);

      await page.evaluate(select, 2020);
      assert.deepStrictEqual((await painted(page)).ids, range(6));
    }));
}

it("a large network settles a change before it paints", () =>
  withPage(box, async page => {
    await install(page);
    await page.evaluate(start, [
      JSON.stringify({...growing, forceLive: false, timelineDefault: [2021]}),
      "svg",
    ]);
    const before = await painted(page);
    assert.ok(!before.live);
    await page.evaluate(select, 2022);
    const after = await painted(page);
    assert.deepStrictEqual(after.ids, range(10));
    assert.ok(!after.live, "no live simulation");
    const moved =
      range(8).reduce((sum, id) => sum + dist(after.at[id], before.at[id]), 0) /
      8;
    assert.ok(moved < 60, `kept nodes stay close: ${moved}`);
  }));
