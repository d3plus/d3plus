import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Parallel Rings links, in Chromium on SVG and Canvas with a real pointer:
    two links between the center and the same node (and one back the other
    way) place that node once, all draw as their own bowed curves under
    their own keys, with their own arrowheads, tooltips and focus
    stops, and keep it all through a redraw.
*/

const box = "<div id='viz' style='width:600px;height:600px'></div>";

const links = [
  {source: "A", target: "B", kind: "trade"},
  {source: "A", target: "B", kind: "aid"},
  {source: "B", target: "A", kind: "loan"},
  {source: "A", target: "C", kind: "solo"},
  {source: "C", target: "D", kind: "far"},
];

/** Runs in the page: draws Rings around A, then resolves once it has painted. */
const draw = renderer =>
  new Promise(resolve => {
    const viz = new window.d3plus.Rings()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .center("A")
      .arrows(true)
      .linkLabel(d => d.kind)
      .links(window.__links);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the painted scene's keys, link marks, and focus stops. */
const scene = () => {
  const viz = window.__viz;
  const keys = [];
  const links = [];
  const walk = n => {
    const key = String(n.key);
    keys.push(key);
    if (
      key.startsWith("rings-link-") &&
      n.type === "path" &&
      !/::|-label/.test(key)
    )
      links.push({key, kind: n.datum?.kind, d: n.d});
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  const focus = window.d3plus
    .focusTargets(viz._paintedScene.root.children || [])
    .map(t => String(t.node.key));
  return {keys, links, focus};
};

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

/** Runs in the page: the visible tooltip's text, whitespace removed. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** Asserts B is drawn once and every A–B link is its own curve, arrow and focus stop. */
function assertParallel({keys, links: marks, focus}) {
  assert.strictEqual(
    keys.filter(k => k === "rings-Circle-B").length,
    1,
    "B is drawn once",
  );
  assert.deepStrictEqual(
    marks.map(m => m.kind).sort(),
    ["aid", "far", "loan", "solo", "trade"],
    "every link draws",
  );
  const ab = marks.filter(m => ["trade", "aid", "loan"].includes(m.kind));
  assert.deepStrictEqual(ab.map(m => m.key).sort(), [
    "rings-link-A-B",
    "rings-link-A-B-1",
    "rings-link-B-A",
  ]);
  assert.strictEqual(new Set(ab.map(m => m.d)).size, 3, "three curves");
  assert.ok(
    ab.every(m => m.d.includes("C")),
    "each bows",
  );
  const solo = marks.find(m => m.kind === "solo");
  assert.ok(!solo.d.includes("C"), "a single center link stays straight");
  const pathKeys = keys.filter(k => k.startsWith("rings-link-"));
  for (const {key} of ab) {
    assert.ok(pathKeys.includes(`${key}::hit`), `${key} has a hit path`);
    assert.ok(focus.includes(key), `${key} is a focus stop`);
  }
  const arrows = keys.filter(k => /^rings-arrow-(t-)?[AB]-[AB]/.test(k));
  assert.strictEqual(arrows.length, 3, `an arrow each: ${arrows}`);
  assert.strictEqual(new Set(arrows).size, 3, "arrow keys are unique");
  assert.strictEqual(new Set(keys).size, keys.length, "scene keys are unique");
}

for (const renderer of ["svg", "canvas"]) {
  it(`Rings ${renderer}: parallel center links place their node once and draw apart`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(l => (window.__links = l), links);
      await page.evaluate(draw, renderer);
      const first = await page.evaluate(scene);
      assertParallel(first);

      for (const [key, kind] of [
        ["rings-link-A-B", "trade"],
        ["rings-link-A-B-1", "aid"],
        ["rings-link-B-A", "loan"],
      ]) {
        const point = await page.evaluate(linkPoint, key);
        assert.ok(point, `a point on ${key}`);
        await page.mouse.move(5, 5);
        await page.mouse.move(point[0] - 20, point[1] - 30);
        await page.mouse.move(...point, {steps: 4});
        await page.waitForTimeout(150);
        const tip = await page.evaluate(tooltip);
        assert.ok(
          tip.includes(`kind${kind}`),
          `${key} shows ${kind}: "${tip}"`,
        );
        for (const other of ["trade", "aid", "loan"].filter(k => k !== kind))
          assert.ok(!tip.includes(`kind${other}`), `${key} hides ${other}`);
      }
      await page.mouse.move(5, 5);

      await page.evaluate(
        () => new Promise(r => window.__viz.config({}).render(r)),
      );
      const again = await page.evaluate(scene);
      assertParallel(again);
      assert.deepStrictEqual(again.links, first.links, "a redraw keeps them");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
