import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Parallel Sankey links (two rows with the same source and target), in
    Chromium on SVG and Canvas with a real pointer: both bands draw under
    their own keys, each shows its own tooltip on hover, and both keep their
    keys and stay drawn through an animated redraw that drops another link.
    Rings draws each of its links once, parallel ones under their own keys.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const nodes = [{id: "A"}, {id: "B"}, {id: "C"}];
const links = [
  {source: "A", target: "B", amount: 5, kind: "trade"},
  {source: "A", target: "C", amount: 2, kind: "loan"},
  {source: "A", target: "B", amount: 3, kind: "aid"},
  {source: "B", target: "C", amount: 4, kind: "trade"},
];

/** Runs in the page: draws a Sankey, then resolves once it has painted. */
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Sankey()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .value(d => d.amount)
      .config(config);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: redraws with `config` over `duration` ms, resolving after it ends. */
const redraw = ([config, duration]) =>
  new Promise(resolve => {
    window.__viz
      .duration(duration)
      .config(config)
      .render(() => setTimeout(() => resolve(true), duration + 100));
  });

/**
    Runs in the page: every painted link mark (not its hit path) as
    `{key, kind, d}`, plus the SVG paths drawn for each key.
*/
const linkMarks = () => {
  const marks = [];
  const walk = n => {
    const key = String(n.key);
    if (key.startsWith("sankey-link-") && !key.endsWith("::hit"))
      marks.push({key, kind: n.datum?.kind, d: n.d, opacity: n.paint?.opacity});
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  const svg = Array.from(
    document.querySelectorAll(
      "#viz svg path[data-key^='sankey-link-']:not([data-key$='::hit'])",
    ),
  ).map(el => ({
    key: el.getAttribute("data-key"),
    d: el.getAttribute("d"),
    opacity: getComputedStyle(el).opacity,
  }));
  return {marks, svg};
};

/** Runs in the page: a screen point in the middle of the link band keyed `key`. */
const bandPoint = key => {
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
  // The band is a filled ribbon: the middle of its fill, halfway across.
  const box = path.getBBox();
  const x = box.x + box.width / 2;
  const inside = [];
  const point = svg.createSVGPoint();
  for (let y = box.y; y <= box.y + box.height; y += 0.5) {
    point.x = x;
    point.y = y;
    if (path.isPointInFill(point)) inside.push(y);
  }
  svg.remove();
  if (!inside.length) return null;
  const y = (inside[0] + inside[inside.length - 1]) / 2;
  return [rect.left + found.x + x, rect.top + found.y + y];
};

/** Runs in the page: the visible tooltip's text, whitespace removed. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** Moves the real pointer onto `point`, from a little away. */
async function hover(page, point) {
  await page.mouse.move(5, 5);
  await page.mouse.move(point[0] - 20, point[1] - 30);
  await page.mouse.move(...point, {steps: 4});
  await page.waitForTimeout(150);
}

/** Asserts the two A→B bands are drawn, keyed apart, with their own rows. */
function assertParallel({marks, svg}, renderer) {
  const ab = marks.filter(m => m.key.startsWith("sankey-link-A-B"));
  assert.deepStrictEqual(
    ab.map(m => [m.key, m.kind]),
    [
      ["sankey-link-A-B", "trade"],
      ["sankey-link-A-B-1", "aid"],
    ],
  );
  assert.notStrictEqual(ab[0].d, ab[1].d, "each band has its own path");
  const keys = marks.map(m => m.key);
  assert.strictEqual(new Set(keys).size, keys.length, "link keys are unique");
  if (renderer === "svg") {
    for (const {key} of ab) {
      const drawn = svg.filter(p => p.key === key);
      assert.strictEqual(drawn.length, 1, `one SVG path for ${key}`);
      assert.ok(drawn[0].d, `${key} has a path`);
      assert.notStrictEqual(drawn[0].opacity, "0", `${key} is visible`);
    }
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`Sankey ${renderer}: parallel links draw, hover, and redraw on their own keys`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [{nodes, links}, renderer]);
      assertParallel(await page.evaluate(linkMarks), renderer);

      for (const [key, kind, other] of [
        ["sankey-link-A-B", "trade", "aid"],
        ["sankey-link-A-B-1", "aid", "trade"],
      ]) {
        const point = await page.evaluate(bandPoint, key);
        assert.ok(point, `a point on ${key}`);
        await hover(page, point);
        const tip = await page.evaluate(tooltip);
        assert.ok(
          tip.includes(`kind${kind}`),
          `${key} shows ${kind}: "${tip}"`,
        );
        assert.ok(!tip.includes(`kind${other}`), `${key} hides ${other}`);
      }
      await page.mouse.move(5, 5);

      await page.evaluate(redraw, [
        {links: links.filter(l => l.kind !== "loan")},
        300,
      ]);
      const after = await page.evaluate(linkMarks);
      assertParallel(after, renderer);
      assert.ok(
        !after.marks.some(m => m.key === "sankey-link-A-C"),
        "the dropped link is gone",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}

/** Runs in the page: draws Rings, then lists each painted link mark's key and row. */
const ringsLinks = renderer =>
  new Promise(resolve => {
    const viz = new window.d3plus.Rings()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .center("A")
      .links([
        {source: "A", target: "B", kind: "ab"},
        {source: "A", target: "C", kind: "ac"},
        {source: "B", target: "C", kind: "bc"},
        {source: "B", target: "D", kind: "bd1"},
        {source: "B", target: "D", kind: "bd2"},
      ]);
    viz.render(() => {
      const marks = [];
      const walk = n => {
        const key = String(n.key);
        if (key.startsWith("rings-link-") && !key.endsWith("::hit"))
          marks.push([key, n.datum?.kind]);
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      resolve(marks);
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Rings ${renderer}: each link draws once, parallel links on their own keys`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const marks = await page.evaluate(ringsLinks, renderer);
      const kinds = marks.map(m => m[1]).sort();
      assert.deepStrictEqual(kinds, ["ab", "ac", "bc", "bd1", "bd2"]);
      const keys = marks.map(m => m[0]);
      assert.strictEqual(new Set(keys).size, keys.length, keys.join(", "));
      assert.deepStrictEqual(
        marks.filter(m => m[0].startsWith("rings-link-B-D")),
        [
          ["rings-link-B-D", "bd1"],
          ["rings-link-B-D-1", "bd2"],
        ],
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
