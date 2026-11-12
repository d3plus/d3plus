import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A Pack's group circles (those enclosing others) carry their group's row,
    as Treemap's group headers do: clicking one zooms into its group, keeping
    the drawn depth, and Back returns. Clicking the outermost circle, which
    holds every group, changes nothing. Leaves drill down as before.
*/

const places = [
  {region: "East", country: "A", city: "a1", value: 30},
  {region: "East", country: "A", city: "a2", value: 20},
  {region: "East", country: "B", city: "b1", value: 25},
  {region: "East", country: "B", city: "b2", value: 15},
  {region: "West", country: "C", city: "c1", value: 22},
  {region: "West", country: "C", city: "c2", value: 12},
  {region: "West", country: "D", city: "d1", value: 18},
  {region: "West", country: "D", city: "d2", value: 9},
];

/**
    Opens a page and renders a Pack of `places` with `calls` (`[method,
    ...args]` pairs) into a 600×400 #viz, kept as `window.__viz`. Clicks the
    default handler sees are logged to `window.__clicks`.
*/
async function chart(calls, renderer) {
  const opened = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([places, calls, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Pack()
          .data(JSON.parse(JSON.stringify(places)))
          .sum("value")
          .legend(false);
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [places, calls, renderer],
  );
  await opened.page.evaluate(installCircles);
  return opened;
}

/** Waits for a click's re-render to settle. */
const settle = page => page.waitForTimeout(150);

/**
    Installs `window.__packCircles()`: the drawn circles, each with the leaf
    circles (those enclosing no other) inside it, found by geometry so the
    lookup doesn't depend on what a circle's datum holds.
*/
function installCircles() {
  window.__packCircles = (scene = window.__viz._chartScene) => {
    const nodes = [];
    const walk = list =>
      list.forEach(n => {
        if (n.type === "circle" && n.shapeType === "Pack") nodes.push(n);
        if (n.children) walk(n.children);
      });
    walk(scene);
    const inside = (a, b) =>
      a !== b && b.r < a.r && Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r;
    const leaves = nodes.filter(n => !nodes.some(m => inside(n, m)));
    return nodes.map(node => ({
      node,
      leaf: leaves.includes(node),
      inner: leaves.filter(m => inside(node, m)),
      contained: nodes.filter(m => inside(node, m)),
    }));
  };
}

/**
    The leaf circles (region, country, painted opacity), with the chart's
    depth and history.
*/
function scene(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const painted = viz._paintedScene
      ? [viz._paintedScene.root]
      : viz._chartScene;
    return {
      leaves: window
        .__packCircles(painted)
        .filter(c => c.leaf)
        .map(({node}) => ({
          region: node.datum.region,
          country: node.datum.country,
          opacity: node.paint.opacity ?? 1,
        })),
      depth: viz._drawDepth,
      history: viz._history.length,
    };
  });
}

/**
    Client coordinates on a drawn circle: the center of the leaf for country
    `leaf`, or a point clear of every circle inside the group circle holding
    only `region`'s leaves (the outermost circle when `region` is null).
*/
function circlePoint(page, target) {
  return page.evaluate(target => {
    const viz = window.__viz;
    const circles = window.__packCircles();
    const found =
      target.leaf !== undefined
        ? circles.find(c => c.leaf && c.node.datum.country === target.leaf)
        : target.region === null
          ? circles.reduce((a, b) => (b.node.r > a.node.r ? b : a))
          : circles.find(
              c =>
                !c.leaf &&
                c.inner.length < circles.filter(d => d.leaf).length &&
                c.inner.every(d => d.datum.region === target.region),
            );
    const {node} = found;
    const surface = document
      .querySelector("#viz svg, #viz canvas")
      .getBoundingClientRect();
    const c = viz._chartTransform || {x: 0, y: 0};
    const at = (x, y) => [surface.left + c.x + x, surface.top + c.y + y];
    if (found.leaf) return at(node.cx, node.cy);
    for (const f of [0.9, 0.8, 0.7, 0.6, 0.5])
      for (let a = 0; a < 360; a += 5) {
        const x = node.cx + node.r * f * Math.cos((a * Math.PI) / 180);
        const y = node.cy + node.r * f * Math.sin((a * Math.PI) / 180);
        if (
          found.contained.every(n => Math.hypot(x - n.cx, y - n.cy) > n.r + 2)
        )
          return at(x, y);
      }
    throw new Error("no clear point in the circle");
  }, target);
}

const backClick = page =>
  page.evaluate(() => document.querySelector("#viz .back-control").click());

const regions = s => [...new Set(s.leaves.map(c => c.region))].sort();

for (const renderer of ["svg", "canvas"]) {
  it(`Pack (${renderer}): clicking a group circle zooms into its group, Back returns, a leaf drills down`, async () => {
    const {page, close} = await chart(
      [
        ["groupBy", ["region", "country", "city"]],
        ["depth", 1],
      ],
      renderer,
    );
    try {
      const start = await scene(page);
      assert.deepStrictEqual(regions(start), ["East", "West"]);
      assert.strictEqual(start.leaves.length, 4);

      const point = await circlePoint(page, {region: "East"});
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(120);
      const tooltip = await page.evaluate(() =>
        document.querySelector(".d3plus-tooltip")?.innerText.trim(),
      );
      assert.match(tooltip ?? "", /^East\b/, "the tooltip names the group");
      assert.match(tooltip, /Click to Expand/);
      // The cursor of the element under the pointer: a circle inside the
      // chart's svg or, with the Canvas renderer, its canvas.
      assert.strictEqual(
        await page.evaluate(
          ([x, y]) => getComputedStyle(document.elementFromPoint(x, y)).cursor,
          point,
        ),
        "pointer",
      );
      const hovered = await scene(page);
      assert.ok(
        hovered.leaves
          .filter(c => c.region === "East")
          .every(c => c.opacity === 1),
        `the group's circles stay bright: ${JSON.stringify(hovered.leaves)}`,
      );
      assert.ok(
        hovered.leaves
          .filter(c => c.region === "West")
          .every(c => c.opacity < 1),
        "the other group's circles dim",
      );

      await page.mouse.click(point[0], point[1]);
      await settle(page);
      const zoomed = await scene(page);
      assert.strictEqual(zoomed.history, 1, "the zoom is on the history");
      assert.strictEqual(zoomed.depth, 1, "the drawn depth is unchanged");
      assert.deepStrictEqual(regions(zoomed), ["East"]);
      assert.deepStrictEqual(
        zoomed.leaves.map(c => c.country).sort(),
        ["A", "B"],
        "only the group's countries are drawn",
      );

      await backClick(page);
      await settle(page);
      const back = await scene(page);
      assert.strictEqual(back.history, 0);
      assert.deepStrictEqual(regions(back), ["East", "West"]);
      assert.strictEqual(back.leaves.length, 4);

      // A leaf drills down a level into its own rows, as it always has.
      const leaf = await circlePoint(page, {leaf: "C"});
      await page.mouse.click(leaf[0], leaf[1]);
      await settle(page);
      const drilled = await scene(page);
      assert.strictEqual(drilled.depth, 2);
      assert.strictEqual(drilled.history, 1);
      assert.deepStrictEqual(
        drilled.leaves.map(c => c.country),
        ["C", "C"],
        "the leaf's cities are drawn",
      );
    } finally {
      await close();
    }
  });

  for (const [levels, depth] of [
    [["region", "country", "city"], 1],
    [["region", "country"], 0],
  ])
    it(`Pack (${renderer}): clicking the outermost circle changes nothing (${levels.length} levels, depth ${depth})`, async () => {
      const {page, close} = await chart(
        [
          ["groupBy", levels],
          ["depth", depth],
        ],
        renderer,
      );
      try {
        const before = await scene(page);
        const point = await circlePoint(page, {region: null});
        await page.mouse.move(point[0], point[1], {steps: 3});
        await page.mouse.click(point[0], point[1]);
        await settle(page);
        const after = await scene(page);
        assert.strictEqual(after.history, 0);
        assert.strictEqual(after.depth, depth);
        assert.strictEqual(after.leaves.length, before.leaves.length);
        assert.ok(after.leaves.length > 0, "the chart still draws its rows");
        assert.strictEqual(
          await page.evaluate(() => window.__viz.schema.filter),
          undefined,
        );
      } finally {
        await close();
      }
    });

  it(`Pack (${renderer}): a click.shape handler receives a group circle's row`, async () => {
    const {page, close} = await chart(
      [
        ["groupBy", ["region", "country", "city"]],
        ["depth", 1],
      ],
      renderer,
    );
    try {
      await page.evaluate(() => {
        window.__clicked = [];
        window.__viz.on("click.shape", d =>
          window.__clicked.push({...d, key: d.key}),
        );
      });
      const point = await circlePoint(page, {region: "West"});
      await page.mouse.click(point[0], point[1]);
      await settle(page);
      const clicked = await page.evaluate(() => window.__clicked);
      assert.strictEqual(clicked.length, 1);
      const [row] = clicked;
      assert.strictEqual(row.region, "West");
      assert.deepStrictEqual(row.country, ["C", "D"]);
      assert.strictEqual(row.value, 61);
      assert.strictEqual(row.__d3plusGroupDepth, 0);
      assert.strictEqual(row.key, "West", "it keeps the group's nest key");
    } finally {
      await close();
    }
  });
}
