import assert from "assert";
import {closeBrowser, render, withPage} from "../playwright.js";

/**
    Stacked bars grow in from their stack, one segment after another: each
    stacked Bar's scene nodes carry the enter window of its level in the
    stack, and on both renderers the bottom segment has finished growing
    before the one on top of it starts.
*/

after(closeBrowser);

const data = [
  {id: "A", q: "Q1", v: 10},
  {id: "B", q: "Q1", v: 20},
  {id: "C", q: "Q1", v: -5},
  {id: "A", q: "Q2", v: 15},
  {id: "B", q: "Q2", v: -8},
  {id: "C", q: "Q2", v: 4},
];

/** Draws a BarChart (and optionally redraws it), reporting each bar's and label's window. */
const windows = ([config, rows, update]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .data(rows)
      .groupBy("id")
      .x("q")
      .y("v")
      .config(config)
      .width(500)
      .height(400)
      .duration(0)
      .select("#viz");
    const report = () => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const bars = nodes.filter(n => n.type === "rect" && n.shapeType === "Bar" && !`${n.key}`.endsWith("::hit"));
      const barOf = n => bars.find(b => n.datum && n.datum.data === b.datum);
      const labels = nodes.filter(n => n.type === "text" && barOf(n));
      resolve({
        bars: Object.fromEntries(bars.map(n => [n.key, n.enterWindow || null])),
        labels: labels.map(n => ({bar: barOf(n).key, window: n.enterWindow || null})),
      });
    };
    viz.render(() => (update ? viz.data(update).render(report) : report()));
  });

const run = (config, rows = data, update) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", windows, [config, rows, update]);

const first = {start: 0, end: 0.5};
const second = {start: 0.5, end: 1};

it("stacked bars enter one stack level after another, counting outward from zero", async () => {
  const {bars, labels} = await run({stacked: true});
  assert.deepStrictEqual(bars, {
    // Q1: B (20) sits under A (10); C (-5) starts the stack below zero.
    B_Q1: first, A_Q1: second, C_Q1: first,
    // Q2: A (15) sits under C (4); B (-8) starts the stack below zero.
    A_Q2: first, C_Q2: second, B_Q2: first,
  });
  assert.ok(labels.length >= 6, "the bars are labeled");
  for (const label of labels) assert.deepStrictEqual(label.window, bars[label.bar], `${label.bar}'s label enters with it`);
});

it("horizontal stacked bars enter by stack level too", async () => {
  const {bars} = await run({stacked: true, discrete: "y", x: "v", y: "q"}, data.filter(d => d.v > 0));
  assert.deepStrictEqual(bars, {B_Q1: first, A_Q1: second, A_Q2: first, C_Q2: second});
});

it("unstacked bars enter over the whole transition", async () => {
  const {bars, labels} = await run({});
  assert.ok(Object.keys(bars).length === 6);
  assert.ok(Object.values(bars).every(w => w === null));
  assert.ok(labels.every(l => l.window === null));
});

it("a data update leaves the bars, old and new, without windows", async () => {
  const update = [...data.map(d => ({...d, v: d.v * 2})), {id: "D", q: "Q1", v: 3}];
  const {bars, labels} = await run({stacked: true}, data, update);
  assert.strictEqual(Object.keys(bars).length, 7);
  assert.ok(Object.values(bars).every(w => w === null), JSON.stringify(bars));
  assert.ok(labels.every(l => l.window === null));
});

it("a stacked Histogram's series enter one after another", async () => {
  const out = await render("<div id='viz' style='width:500px;height:400px'></div>", () =>
    new Promise(resolve => {
      const rows = [1, 2, 2, 3, 3, 3, 4].flatMap(v => [{s: "a", v}, {s: "b", v: v + 0.5}]);
      const viz = new window.d3plus.Histogram()
        .data(rows).groupBy("s").value("v").binWidth(1)
        .width(500).height(400).duration(0).select("#viz");
      viz.render(() => {
        const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        resolve(flat(viz._chartScene)
          .filter(n => n.type === "rect" && n.shapeType === "Bar" && !`${n.key}`.endsWith("::hit") && n.height > 0)
          .map(n => (n.enterWindow ? n.enterWindow.start : null)));
      });
    }));
  assert.ok(out.length > 2, "the bins are drawn");
  assert.deepStrictEqual(Array.from(new Set(out)).sort(), [0, 0.5], `every bin's segments by level: ${out}`);
});

/**
    The bottom (B) and top (A) segment heights of Q1's stack at 25%, 47%, 51%,
    and 75% of a 1600ms first draw, on a paused clock.
*/
const frames = renderer =>
  withPage("<div id='viz' style='width:500px;height:400px'></div>", async page => {
    await page.clock.pauseAt(Date.now() + 1000);
    await page.evaluate(renderer => {
      window.viz = new window.d3plus.BarChart()
        .data([{id: "A", q: "Q1", v: 10}, {id: "B", q: "Q1", v: 20}, {id: "A", q: "Q2", v: 5}, {id: "B", q: "Q2", v: 15}])
        .groupBy("id").x("q").y("v").stacked(true).legend(false)
        .renderer(renderer).width(500).height(400).duration(1600)
        .select("#viz");
      window.viz.render();
    }, renderer);
    // The transition starts when the scene is first drawn.
    for (let i = 0; i < 1000 && !(await page.evaluate(() => !!window.viz._sceneRenderer)); i++)
      await page.clock.runFor(1);
    // The canvas paints each frame's interpolated scene.
    await page.evaluate(() => {
      window.frame = null;
      const r = window.viz._sceneRenderer;
      if (r.kind !== "canvas") return;
      const paint = r._paint.bind(r);
      r._paint = frame => {
        window.frame = frame;
        return paint(frame);
      };
    });
    const heights = () => page.evaluate(() => {
      const keys = ["B_Q1", "A_Q1"];
      if (window.frame) {
        const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const nodes = flat([window.frame.root]);
        return keys.map(k => nodes.find(n => n.key === k).height);
      }
      return keys.map(k => Number(document.querySelector(`svg.d3plus-render-svg rect[data-key="${k}"]`).getAttribute("height")));
    });
    const final = await page.evaluate(() => ["B_Q1", "A_Q1"].map(k => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      return flat(window.viz._chartScene).find(n => n.key === k).height;
    }));
    const out = [];
    let now = 0;
    for (const ms of [400, 750, 820, 1200]) {
      await page.clock.runFor(ms - now);
      now = ms;
      out.push(await heights());
    }
    return {final, frames: out};
  }, {clock: true});

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: the bottom segment has grown before the one above it starts`, async () => {
    const {final: [bottom, top], frames: [quarter, nearlyHalf, half, threeQuarters]} = await frames(renderer);
    const at = (frame, label) => `${label}: ${frame.map(h => h.toFixed(1))} of ${bottom.toFixed(1)}, ${top.toFixed(1)}`;
    assert.ok(quarter[0] > 0 && quarter[0] < bottom / 2, at(quarter, "25%: the bottom is growing"));
    assert.strictEqual(quarter[1], 0, at(quarter, "25%: the top waits"));
    assert.ok(nearlyHalf[0] > bottom / 2 && nearlyHalf[0] < bottom, at(nearlyHalf, "47%: the bottom is nearly grown"));
    assert.strictEqual(nearlyHalf[1], 0, at(nearlyHalf, "47%: the top still waits"));
    assert.ok(Math.abs(half[0] - bottom) < 0.5, at(half, "51%: the bottom has grown"));
    assert.ok(half[1] < top * 0.15, at(half, "51%: the top is only starting"));
    assert.ok(Math.abs(threeQuarters[0] - bottom) < 0.5, at(threeQuarters, "75%: the bottom stays grown"));
    assert.ok(threeQuarters[1] > top / 2 && threeQuarters[1] < top, at(threeQuarters, "75%: the top is growing"));
  });
}
