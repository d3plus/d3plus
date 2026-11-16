import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Network's precomputed force layout in Chromium, on SVG and Canvas:
    symmetric graphs (a star, a binary tree) spread their nodes out instead
    of stacking them, so the nodes keep a readable size, and a faceted
    binary tree draws every panel.
*/

const body = `
  <div id="viz" style="width:640px;height:480px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** A star: one hub linked to `n` leaves. */
const star = n => ({
  nodes: Array.from({length: n + 1}, (_, i) => ({id: `s${i}`})),
  links: Array.from({length: n}, (_, i) => ({
    source: "s0",
    target: `s${i + 1}`,
  })),
});

/** A complete binary tree of `n` nodes, ids prefixed with `prefix`. */
const tree = (n, prefix = "t") => ({
  nodes: Array.from({length: n}, (_, i) => ({
    id: `${prefix}${i}`,
    group: prefix,
  })),
  links: Array.from({length: n - 1}, (_, i) => ({
    source: `${prefix}${Math.floor(i / 2)}`,
    target: `${prefix}${i + 1}`,
  })),
});

/** Draws a Network and reads its node circles and any draw error. */
const draw = async ({config, renderer, facet}) => {
  const viz = new window.d3plus.Network()
    .config({duration: 0, legend: false, forceLive: false, ...config})
    .renderer(renderer)
    .select("#viz");
  if (facet) viz.facet(d => d.group);
  await new Promise(resolve => viz.render(resolve));
  const flat = list =>
    list.flatMap(n => (n.children ? [n, ...flat(n.children)] : [n]));
  const all = flat(viz._chartScene || []);
  return {
    circles: all
      .filter(n => n.type === "circle")
      .map(n => ({key: n.key, cx: n.cx, cy: n.cy, r: n.r})),
    error: document
      .querySelector("#viz")
      ?.textContent?.includes("could not draw"),
  };
};

/** The smallest distance between two circles' centers. */
const closest = circles => {
  let d = Infinity;
  for (let i = 0; i < circles.length; i++)
    for (let j = i + 1; j < circles.length; j++)
      d = Math.min(
        d,
        Math.hypot(
          circles[i].cx - circles[j].cx,
          circles[i].cy - circles[j].cy,
        ),
      );
  return d;
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a star spreads its leaves around the hub`, async () => {
    const {circles} = await render(body, draw, {config: star(8), renderer});
    assert.strictEqual(circles.length, 9);
    assert.ok(closest(circles) > 40, `closest ${closest(circles)}`);
    // The hub sits in the middle of its leaves, each about as far from it.
    const [hub, ...leaves] = circles;
    const reach = leaves.map(c => Math.hypot(c.cx - hub.cx, c.cy - hub.cy));
    assert.ok(
      Math.max(...reach) / Math.min(...reach) < 1.5,
      `leaf distances ${reach}`,
    );
    const mx = leaves.reduce((s, c) => s + c.cx, 0) / leaves.length;
    const my = leaves.reduce((s, c) => s + c.cy, 0) / leaves.length;
    assert.ok(
      Math.hypot(mx - hub.cx, my - hub.cy) < Math.min(...reach) / 2,
      "hub at the leaves' center",
    );
    assert.ok(
      circles.every(c => c.r >= 8),
      `radii ${circles.map(c => c.r)}`,
    );
  });

  it(`[${renderer}] a binary tree keeps its nodes apart`, async () => {
    const {circles} = await render(body, draw, {config: tree(15), renderer});
    assert.strictEqual(circles.length, 15);
    assert.ok(closest(circles) > 25, `closest ${closest(circles)}`);
    assert.ok(
      circles.every(c => c.r >= 6),
      `radii ${circles.map(c => c.r)}`,
    );
  });

  it(`[${renderer}] a small network caps its nodes at a twelfth of the chart's smaller side`, async () => {
    // The chart area is 640 × 451 (the 480px viz less its padding), so no
    // node reaches 451 / 12 ≈ 37.6px.
    for (const n of [1, 2, 3, 5, 12]) {
      const {circles} = await render(body, draw, {config: tree(n), renderer});
      assert.strictEqual(circles.length, n);
      const radii = circles.map(c => c.r);
      assert.ok(
        radii.every(r => r > 25 && r <= 451 / 12),
        `${n} nodes: radii ${radii}`,
      );
    }
  });

  it(`[${renderer}] a sized small network caps its largest node, unless sizeMax sets it`, async () => {
    const {nodes, links} = tree(5);
    const sized = nodes.map((d, i) => ({...d, v: [5, 40, 100, 70, 20][i]}));
    const capped = await render(body, draw, {
      config: {nodes: sized, links, size: "v"},
      renderer,
    });
    const largest = Math.max(...capped.circles.map(c => c.r));
    assert.ok(largest > 25 && largest <= 451 / 12, `largest ${largest}`);
    const set = await render(body, draw, {
      config: {nodes: sized, links, size: "v", sizeMax: 60},
      renderer,
    });
    assert.ok(
      Math.max(...set.circles.map(c => c.r)) > 451 / 12,
      "sizeMax overrides the cap",
    );
  });

  it(`[${renderer}] a faceted binary tree draws every panel`, async () => {
    const a = tree(7, "a");
    const b = tree(7, "b");
    const nodes = [...a.nodes, ...b.nodes];
    const {circles, error} = await render(body, draw, {
      config: {data: nodes, nodes, links: [...a.links, ...b.links]},
      renderer,
      facet: true,
    });
    assert.ok(!error, "no draw error");
    assert.ok(circles.length >= 14, `${circles.length} circles`);
    assert.ok(
      circles.every(c => c.r >= 4),
      `radii ${circles.map(c => c.r)}`,
    );
  });
}
