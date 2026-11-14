import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Lines stay drawn while a config toggle redraws them, in Chromium on SVG
    and Canvas. A straight link or spoke is written as a moveto and an
    implicit lineto (`M0,0 10,0`), and the path tween once read only the
    moveto, so every such line vanished until the transition ended. This
    looks halfway through each redraw: Network's links when
    `arrows` turns on (their ends easing back inside the new heads, which
    fade in) and off again, and Radar's spokes when `levelLabels` turns
    off.
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
    The SVG paths whose key starts with `prefix` (hit paths aside): their
    `d`, length, opacity through their ancestors, and the screen points
    halfway and nine tenths along them.
*/
const svgPaths = prefix =>
  [...document.querySelectorAll("#viz svg path[data-key]")]
    .filter(p => {
      const key = p.getAttribute("data-key");
      return key.startsWith(prefix) && !key.endsWith("::hit");
    })
    .map(p => {
      let opacity = 1;
      for (let el = p; el && el.tagName !== "svg"; el = el.parentElement)
        opacity *= parseFloat(getComputedStyle(el).opacity);
      const length = p.getTotalLength();
      const m = p.getScreenCTM();
      const at = k => {
        const q = p.getPointAtLength(length * k);
        return [m.a * q.x + m.c * q.y + m.e, m.b * q.x + m.d * q.y + m.f];
      };
      return {
        key: p.getAttribute("data-key"),
        d: p.getAttribute("d"),
        length,
        opacity,
        points: [at(0.5), at(0.9)],
      };
    });

/** The most opaque canvas alpha (0–1) within 2px of each screen point. */
const canvasAlpha = points => {
  const canvas = document.querySelector("#viz canvas");
  const rect = canvas.getBoundingClientRect();
  const k = canvas.width / rect.width;
  const ctx = canvas.getContext("2d");
  return points.map(([x, y]) => {
    const px = Math.round((x - rect.x) * k);
    const py = Math.round((y - rect.y) * k);
    const r = Math.round(2 * k);
    const {data} = ctx.getImageData(px - r, py - r, 2 * r + 1, 2 * r + 1);
    let max = 0;
    for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
    return max / 255;
  });
};

/** Whether a path's `d` draws anything past its moveto. */
const draws = d =>
  /[LCQAHVSTZlcqahvstz]/.test(d) ||
  (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).length > 2;

const nodes = [
  {id: "A", x: 0, y: 0},
  {id: "B", x: 200, y: 0},
  {id: "C", x: 0, y: 140},
  {id: "D", x: 200, y: 140},
];
const links = [
  {source: "A", target: "B"},
  {source: "A", target: "C"},
  {source: "B", target: "D"},
  {source: "C", target: "D"},
];

/**
    Draws `chart` on SVG, then redraws it with `toggled`, pausing halfway:
    returns the `prefix` paths at rest, halfway, and at the end (and, with
    `heads`, the paths keyed `heads` halfway).
*/
async function svgToggle(chart, config, toggled, prefix, heads) {
  const {page, errors, close} = await openPage(body);
  try {
    await page.evaluate(draw, [chart, config, "svg"]);
    const rest = await page.evaluate(svgPaths, prefix);
    await page.evaluate(redraw, [toggled, DURATION, DURATION / 2]);
    const half = await page.evaluate(svgPaths, prefix);
    const halfHeads = heads ? await page.evaluate(svgPaths, heads) : [];
    await page.evaluate(pause, DURATION);
    const end = await page.evaluate(svgPaths, prefix);
    assert.deepStrictEqual(errors, [], "no page errors");
    return {rest, half, halfHeads, end};
  } finally {
    await close();
  }
}

/**
    Draws `chart` on Canvas, then redraws it with `toggled`, pausing
    halfway: returns the canvas alpha at each of `points` there.
*/
async function canvasToggle(chart, config, toggled, points) {
  const {page, errors, close} = await openPage(body);
  try {
    await page.evaluate(draw, [chart, config, "canvas"]);
    await page.evaluate(redraw, [toggled, DURATION, DURATION / 2]);
    const alpha = await page.evaluate(canvasAlpha, points);
    assert.deepStrictEqual(errors, [], "no page errors");
    return alpha;
  } finally {
    await close();
  }
}

for (const [from, to] of [
  [false, "both"],
  ["both", false],
]) {
  it(`Network: links stay drawn and ease while arrows turn ${to ? "on" : "off"}, on SVG and Canvas`, async () => {
    const config = {nodes, links, arrows: from, sizeMax: 20};
    const {rest, half, halfHeads, end} = await svgToggle(
      "Network",
      config,
      {arrows: to},
      "network-link-",
      "network-arrow-",
    );
    assert.strictEqual(rest.length, links.length, "every link drawn");
    for (const [i, link] of half.entries()) {
      assert.ok(draws(link.d), `${link.key} draws halfway: ${link.d}`);
      assert.ok(link.opacity > 0.99, `${link.key} stays opaque`);
      // Its length eases between the two, rather than jumping.
      const [a, b] = [rest[i].length, end[i].length];
      assert.ok(Math.abs(a - b) > 4, `${link.key} changes length`);
      assert.ok(
        link.length > Math.min(a, b) + 0.5 &&
          link.length < Math.max(a, b) - 0.5,
        `${link.key} halfway: ${link.length} between ${a} and ${b}`,
      );
    }
    // The heads fade, on the way in or out.
    assert.strictEqual(halfHeads.length, 2 * links.length, "a head per end");
    for (const head of halfHeads)
      assert.ok(
        head.opacity > 0.05 && head.opacity < 0.95,
        `${head.key} fades: ${head.opacity}`,
      );

    const points = rest.map(link => link.points[0]);
    const alpha = await canvasToggle("Network", config, {arrows: to}, points);
    for (const [i, a] of alpha.entries())
      assert.ok(a > 0.5, `${rest[i].key} draws halfway on Canvas: ${a}`);
  });
}

it("Radar: spokes stay drawn while levelLabels turns off, on SVG and Canvas", async () => {
  const config = {
    data: ["Speed", "Power", "Range", "Comfort", "Safety"].map((metric, i) => ({
      group: "A",
      metric,
      value: 20 + i * 5,
    })),
    groupBy: "group",
    metric: "metric",
    value: "value",
  };
  const {rest, half} = await svgToggle(
    "Radar",
    config,
    {levelLabels: false},
    "radar-spoke-",
  );
  assert.strictEqual(rest.length, 5, "a spoke per metric");
  for (const spoke of half)
    assert.ok(draws(spoke.d), `${spoke.key} draws halfway: ${spoke.d}`);

  // Most of the way out along each spoke, clear of the polygon's fill.
  const points = rest.map(spoke => spoke.points[1]);
  const alpha = await canvasToggle(
    "Radar",
    config,
    {levelLabels: false},
    points,
  );
  for (const [i, a] of alpha.entries())
    assert.ok(a > 0.2, `${rest[i].key} draws halfway on Canvas: ${a}`);
});
