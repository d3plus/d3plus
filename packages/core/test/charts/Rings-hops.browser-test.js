import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    `hops` and `ringLinks`, in Chromium on SVG and Canvas with a real
    pointer: each `hops` draws every node it reaches once, on its rings, with
    the center and first ring at one size, and the links between the rings,
    arrows and link labels; hovering a node on the third ring shows its
    tooltip and clicking it re-centers the chart; small multiples draw each
    panel's rings; and `ringLinks` draws the outermost ring's own links,
    arching out past the ring, with their arrows, labels and tooltips.
*/

const box = "<div id='viz' style='width:700px;height:700px'></div>";

const links = [
  ["c", "a"],
  ["c", "b"],
  ["c", "d"],
  ["a", "b"],
  ["a", "a1"],
  ["a", "a2"],
  ["b", "a2"],
  ["b", "b1"],
  ["a1", "x"],
  ["a2", "x"],
  ["b1", "z"],
  ["a1", "b1"],
  ["x", "y"],
].map(([source, target]) => ({source, target, label: `${source}>${target}`}));

/**
    Runs in the page: draws Rings around c at `hops`, resolving once
    painted. The chart already drawn redraws with the new `hops`.
*/
const draw = ([renderer, hops, extra]) =>
  new Promise(resolve => {
    const viz =
      window.__viz ||
      new window.d3plus.Rings()
        .select("#viz")
        .renderer(renderer)
        .duration(0)
        .legend(false)
        .center("c")
        .arrows(true)
        .linkLabel(d => d.label)
        .links(window.__links)
        .config(extra || {});
    if (hops !== undefined) viz.hops(hops);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the painted scene's node circles, link marks, arrows and labels. */
const scene = () => {
  const keys = [];
  const circles = {};
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const key = String(n.key);
    keys.push(key);
    const m = /rings-Circle-(.+)$/.exec(key);
    if (m && n.type === "circle")
      circles[m[1]] = {x: nx + n.cx, y: ny + n.cy, r: n.r};
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  const links = keys.filter(
    k => k.startsWith("rings-link-") && !/::|-label/.test(k),
  );
  return {
    keys,
    circles,
    links,
    arrows: keys.filter(k => k.startsWith("rings-arrow-")),
    labels: keys.filter(k => /rings-link-.*-label-group$/.test(k)),
  };
};

/** Runs in the page: a node's position on screen. */
const nodePoint = id => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const found = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (String(n.key) === `rings-Circle-${id}` && n.type === "circle")
      found.push([rect.left + nx + n.cx, rect.top + ny + n.cy]);
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  return found[0] ?? null;
};

/** Runs in the page: the visible tooltip's text, whitespace removed. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** The distance of each drawn node from the center node. */
const distances = circles => {
  const c = circles.c;
  return Object.fromEntries(
    Object.entries(circles).map(([id, p]) => [
      id,
      Math.hypot(p.x - c.x, p.y - c.y),
    ]),
  );
};

const expected = {
  1: ["a", "b", "c", "d"],
  2: ["a", "a1", "a2", "b", "b1", "c", "d"],
  3: ["a", "a1", "a2", "b", "b1", "c", "d", "x", "z"],
};

/** Each node's ring. */
const ring = id => ({a: 1, b: 1, d: 1, a1: 2, a2: 2, b1: 2, x: 3, z: 3})[id];

/** Runs in the page: a screen point halfway along the link path keyed `key`. */
const linkPoint = key => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let found = null;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key === key) found = {d: n.d, x: nx, y: ny};
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  if (!found) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", found.d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const p = path.getPointAtLength(path.getTotalLength() / 2);
  svg.remove();
  return [rect.left + found.x + p.x, rect.top + found.y + p.y];
};

for (const renderer of ["svg", "canvas"]) {
  it(`Rings ${renderer}: hops draws each reached node once on its rings`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(l => (window.__links = l), links);
      const sizes = {};
      for (const hops of [2, 1, 3]) {
        await page.evaluate(draw, [renderer, hops]);
        const s = await page.evaluate(scene);
        assert.deepStrictEqual(
          Object.keys(s.circles).sort(),
          expected[hops],
          `${hops} hops nodes`,
        );
        assert.strictEqual(
          new Set(s.keys).size,
          s.keys.length,
          `${hops} hops: scene keys are unique`,
        );
        const d = distances(s.circles);
        const radii = {};
        for (const id of expected[hops].filter(i => i !== "c")) {
          radii[ring(id)] ??= d[id];
          assert.ok(
            Math.abs(d[id] - radii[ring(id)]) < 0.5,
            `${hops} hops: ${id} sits on ring ${ring(id)}`,
          );
        }
        if (hops === 3)
          assert.ok(
            Math.abs(radii[3] - radii[2] - (radii[2] - radii[1])) < 0.5,
            "the rings past the first are evenly spaced",
          );
        // The center and the first ring keep one size at any hops.
        sizes.c ??= s.circles.c.r;
        sizes.a ??= s.circles.a.r;
        assert.strictEqual(s.circles.c.r, sizes.c, `${hops} hops: center size`);
        assert.strictEqual(s.circles.a.r, sizes.a, `${hops} hops: ring 1 size`);
        // Arrows and labels follow every drawn link.
        assert.strictEqual(s.arrows.length, s.links.length);
        // The short center links leave no room for a label; the curves between rings do.
        if (hops > 1)
          assert.ok(s.labels.length > 0, `${hops} hops draws link labels`);
      }
      const three = await page.evaluate(scene);
      assert.ok(
        [
          "rings-link-a1-x",
          "rings-link-a2-x",
          "rings-link-b1-z",
          "rings-link-a1-b1",
        ].every(k => three.links.includes(k)),
        `links reach the third ring: ${three.links}`,
      );
      assert.ok(!three.links.includes("rings-link-x-y"), "y is beyond 3 hops");
      assert.ok(
        three.circles.a.r >= three.circles.a1.r &&
          three.circles.a1.r >= three.circles.x.r,
        "outer nodes are no larger",
      );

      // Hover then click a third-ring node: its tooltip, then re-center on it.
      const point = await page.evaluate(nodePoint, "x");
      assert.ok(point, "x is drawn");
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0] - 20, point[1] - 30);
      await page.mouse.move(...point, {steps: 4});
      await page.waitForTimeout(250);
      const tip = await page.evaluate(tooltip);
      assert.ok(tip.startsWith("x"), `x's tooltip: "${tip}"`);
      await page.mouse.click(...point);
      await page.waitForTimeout(100);
      const after = await page.evaluate(scene);
      assert.strictEqual(
        await page.evaluate(() => window.__viz.center()),
        "x",
        "clicking x re-centers on it",
      );
      // Around x, three rings reach every node but d.
      assert.deepStrictEqual(Object.keys(after.circles).sort(), [
        "a",
        "a1",
        "a2",
        "b",
        "b1",
        "c",
        "x",
        "y",
        "z",
      ]);
      assert.ok(
        Math.hypot(
          after.circles.x.x - three.circles.c.x,
          after.circles.x.y - three.circles.c.y,
        ) < 0.5,
        "x moves to the middle",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Rings ${renderer}: hops draws every small-multiple panel's rings`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(l => (window.__links = l), links);
      const data = ["one", "two"].flatMap(panel =>
        expected[3].map(id => ({id, panel})),
      );
      await page.evaluate(draw, [renderer, 3, {data, facet: "panel"}]);
      const keys = (await page.evaluate(scene)).keys;
      for (const panel of ["one", "two"]) {
        const circles = keys.filter(
          k => k.includes(panel) && /rings-Circle-/.test(k),
        );
        assert.ok(
          ["x", "z"].every(id => circles.some(k => k.endsWith(`-${id}`))),
          `${panel} draws its third ring: ${circles}`,
        );
      }
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Rings ${renderer}: ringLinks draws the outermost ring's own links`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(l => (window.__links = l), links);
      await page.evaluate(draw, [renderer, 2]);
      const plain = await page.evaluate(scene);
      assert.ok(!plain.links.includes("rings-link-a1-b1"), "off by default");

      await page.evaluate(
        () => new Promise(r => window.__viz.ringLinks(true).render(r)),
      );
      const linked = await page.evaluate(scene);
      assert.deepStrictEqual(
        linked.links.filter(k => !plain.links.includes(k)),
        ["rings-link-a1-b1"],
      );
      assert.deepStrictEqual(linked.circles, plain.circles, "nodes stay put");
      assert.ok(linked.keys.includes("rings-link-a1-b1::hit"), "a hit path");
      assert.ok(
        linked.arrows.some(k => k.includes("a1-b1")),
        `an arrowhead: ${linked.arrows}`,
      );
      assert.ok(
        linked.labels.some(k => k.includes("a1-b1")),
        `a label: ${linked.labels}`,
      );

      // It arches out past its ring, and its tooltip shows along it.
      const point = await page.evaluate(linkPoint, "rings-link-a1-b1");
      assert.ok(point, "a point on the link");
      const host = await page.evaluate(() => {
        const r = document
          .querySelector("#viz canvas, #viz svg")
          .getBoundingClientRect();
        return [r.left, r.top];
      });
      const c = linked.circles.c;
      const apex = Math.hypot(
        point[0] - host[0] - c.x,
        point[1] - host[1] - c.y,
      );
      const ringRadius = Math.hypot(
        linked.circles.a1.x - c.x,
        linked.circles.a1.y - c.y,
      );
      assert.ok(apex > ringRadius + 5, `${apex} reaches past ${ringRadius}`);
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0] - 20, point[1] - 30);
      await page.mouse.move(...point, {steps: 4});
      await page.waitForTimeout(250);
      const tip = await page.evaluate(tooltip);
      assert.ok(tip.includes("a1>b1"), `the link's tooltip: "${tip}"`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
