import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A Plot's marks tween in place while a redraw starts or stops clipping
    them, in Chromium on SVG and Canvas. A masked axis break and a domain
    that cuts data off each wrap the marks in a clip group; the marks keep
    their parents whether or not anything clips them, so they move to their
    new place instead of fading out and back in. This looks halfway through
    each redraw: a BarChart's bars while `baselineBreak` turns on and off and
    a `yBreak` comes and goes, and a LinePlot's lines while a `yDomain`
    starts and stops cutting them off.
*/

const DURATION = 1000;
const body =
  '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';

/** Draws `chart` from `config` with no animation, resolving once painted. */
const draw = ([chart, config, renderer]) =>
  new Promise(resolve => {
    window.viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(config);
    window.viz.render(() => resolve(true));
  });

/**
    Redraws over `duration` with `config` merged in, resolving `wait`
    milliseconds into the transition.
*/
const redraw = ([config, duration, wait]) =>
  new Promise(resolve => {
    window.viz.duration(duration).config(config).render();
    setTimeout(() => resolve(true), wait);
  });

/** Resolves `ms` milliseconds from now. */
const pause = ms => new Promise(resolve => setTimeout(() => resolve(true), ms));

/**
    Every SVG mark of `tag` keyed one of `keys` (or any key, with none): its
    key, opacity through its ancestors, and screen box.
*/
const svgMarks = ([tag, keys]) =>
  [...document.querySelectorAll(`#viz svg ${tag}[data-key]`)]
    .filter(el => {
      const key = el.getAttribute("data-key");
      return !key.endsWith("::hit") && (!keys || keys.includes(key));
    })
    .map(el => {
      let opacity = 1;
      for (let n = el; n && n.tagName !== "svg"; n = n.parentElement)
        opacity *= parseFloat(getComputedStyle(n).opacity);
      const {x, y, width, height} = el.getBoundingClientRect();
      return {key: el.getAttribute("data-key"), opacity, x, y, width, height};
    });

/**
    The Canvas frame just painted: each mark keyed one of `keys` that it
    drew (its key and own opacity), and the most opaque alpha (0–1) within
    2px of each screen point.
*/
const canvasFrame = ([keys, points]) => {
  const drawn = window.viz._sceneRenderer._pickIndex
    .map(({node}) => node)
    .filter(node => keys.includes(node.key))
    .map(node => ({key: node.key, opacity: node.paint?.opacity ?? 1}));
  const canvas = document.querySelector("#viz canvas");
  const rect = canvas.getBoundingClientRect();
  const k = canvas.width / rect.width;
  const ctx = canvas.getContext("2d");
  const alpha = points.map(([x, y]) => {
    const px = Math.round((x - rect.x) * k);
    const py = Math.round((y - rect.y) * k);
    const r = Math.round(2 * k);
    const {data} = ctx.getImageData(px - r, py - r, 2 * r + 1, 2 * r + 1);
    let max = 0;
    for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
    return max / 255;
  });
  return {drawn, alpha};
};

/**
    Draws `chart` on SVG, then redraws it with `toggled`, pausing halfway:
    returns the `tag` marks keyed `keys` at rest, halfway, and at the end.
*/
async function svgToggle(chart, config, toggled, tag, keys) {
  const {page, errors, close} = await openPage(body);
  try {
    await page.evaluate(draw, [chart, config, "svg"]);
    const rest = await page.evaluate(svgMarks, [tag, keys]);
    await page.evaluate(redraw, [toggled, DURATION, DURATION / 2]);
    const half = await page.evaluate(svgMarks, [tag, keys]);
    await page.evaluate(pause, DURATION);
    const end = await page.evaluate(svgMarks, [tag, keys]);
    assert.deepStrictEqual(errors, [], "no page errors");
    return {rest, half, end};
  } finally {
    await close();
  }
}

/**
    Draws `chart` on Canvas, then redraws it with `toggled`, pausing
    halfway: returns that frame's `keys` marks and its alpha at `points`.
*/
async function canvasToggle(chart, config, toggled, keys, points = []) {
  const {page, errors, close} = await openPage(body);
  try {
    await page.evaluate(draw, [chart, config, "canvas"]);
    await page.evaluate(redraw, [toggled, DURATION, DURATION / 2]);
    const frame = await page.evaluate(canvasFrame, [keys, points]);
    assert.deepStrictEqual(errors, [], "no page errors");
    return frame;
  } finally {
    await close();
  }
}

/** Asserts each of `keys` is drawn once, opaque, in `marks`. */
function drawnOnce(marks, keys, label) {
  assert.deepStrictEqual(
    marks.map(m => m.key).sort(),
    [...keys].sort(),
    `${label}: one mark per key halfway`,
  );
  for (const mark of marks)
    assert.ok(
      mark.opacity > 0.99,
      `${label}: ${mark.key} stays opaque: ${mark.opacity}`,
    );
}

/** A point inside both of two screen boxes, near the top of their overlap. */
const shared = (a, b) => {
  const x0 = Math.max(a.x, b.x),
    x1 = Math.min(a.x + a.width, b.x + b.width);
  const y0 = Math.max(a.y, b.y),
    y1 = Math.min(a.y + a.height, b.y + b.height);
  return [(x0 + x1) / 2, y0 + Math.min(8, (y1 - y0) / 2)];
};

/**
    Toggles a BarChart from `from` to `to` and checks that each bar is one
    opaque mark halfway on both backends, on SVG moving between where it
    rests and ends, and that Canvas paints each bar solid there.
*/
async function barsTween(config, from, to) {
  const start = {...config, ...from};
  const {rest, half, end} = await svgToggle("BarChart", start, to, "rect");
  const bars = marks =>
    marks.filter(m => m.width > 10 && m.height > 1 && m.key !== "background");
  const r = bars(rest);
  const e = bars(end);
  const keys = r.map(m => m.key);
  assert.ok(keys.length >= 5, `bars drawn at rest: ${keys}`);
  assert.deepStrictEqual(e.map(m => m.key).sort(), [...keys].sort());
  const halfBars = half.filter(m => keys.includes(m.key));
  drawnOnce(halfBars, keys, "SVG");
  let moved = 0;
  for (const bar of halfBars) {
    const a = r.find(m => m.key === bar.key);
    const b = e.find(m => m.key === bar.key);
    if (Math.abs(a.height - b.height) > 4) {
      moved++;
      assert.ok(
        bar.height > Math.min(a.height, b.height) + 0.5 &&
          bar.height < Math.max(a.height, b.height) - 0.5,
        `${bar.key} halfway: ${bar.height} between ${a.height} and ${b.height}`,
      );
    }
  }
  assert.ok(moved > 0, "some bar changes height");

  const points = r.map(a =>
    shared(
      a,
      e.find(m => m.key === a.key),
    ),
  );
  const {drawn, alpha} = await canvasToggle(
    "BarChart",
    start,
    to,
    keys,
    points,
  );
  drawnOnce(drawn, keys, "Canvas");
  for (const [i, a] of alpha.entries())
    assert.ok(a > 0.95, `${keys[i]} paints solid halfway on Canvas: ${a}`);
}

const housingStarts = [
  {year: 2019, starts: 1290},
  {year: 2020, starts: 1380},
  {year: 2021, starts: 1601},
  {year: 2022, starts: 1553},
  {year: 2023, starts: 1420},
  {year: 2024, starts: 1367},
];
const baselineBars = {
  data: housingStarts,
  groupBy: "year",
  x: "year",
  y: "starts",
  yDomain: [1200, 1700],
};

const outlierBars = {
  data: [
    {region: "North", sales: 42},
    {region: "South", sales: 58},
    {region: "East", sales: 35},
    {region: "Online", sales: 960},
    {region: "West", sales: 51},
  ],
  groupBy: "region",
  x: "region",
  y: "sales",
};

for (const [from, to] of [
  [false, true],
  [true, false],
]) {
  it(`BarChart: bars tween in place while baselineBreak turns ${to ? "on" : "off"}, on SVG and Canvas`, async () => {
    await barsTween(baselineBars, {baselineBreak: from}, {baselineBreak: to});
  });
}

it("BarChart: bars tween in place while a yBreak comes and goes, on SVG and Canvas", async () => {
  await barsTween(outlierBars, {}, {yBreak: [80, 900]});
  await barsTween(outlierBars, {yBreak: [80, 900]}, {yBreak: false});
});

// Two series that dip well below 980.
const values = [1000, 1012, 995, 940, 900, 990, 1024, 1040, 1018, 930];
const series = {
  data: ["Alpha", "Beta"].flatMap((id, s) =>
    values.map((v, x) => ({id, x, value: s ? v - 10 : v})),
  ),
  groupBy: "id",
  x: "x",
  y: "value",
};

for (const [from, to] of [
  [[850, 1050], [980]],
  [[980], [850, 1050]],
]) {
  it(`LinePlot: lines tween in place while yDomain ${to.length === 1 ? "starts" : "stops"} cutting them off, on SVG and Canvas`, async () => {
    const keys = ["Alpha", "Beta"];
    const start = {...series, yDomain: from};
    const {rest, half} = await svgToggle(
      "LinePlot",
      start,
      {yDomain: to},
      "path",
      keys,
    );
    assert.strictEqual(rest.length, 2, "both lines drawn at rest");
    drawnOnce(half, keys, "SVG");
    const {drawn} = await canvasToggle("LinePlot", start, {yDomain: to}, keys);
    drawnOnce(drawn, keys, "Canvas");
  });
}
