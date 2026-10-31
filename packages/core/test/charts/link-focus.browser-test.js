import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Link click focus on Network, Rings, and Sankey, in Chromium on SVG and
    Canvas with real clicks: clicking a link keeps it and its two ends bright
    and dims the rest (and Network zooms to them), clicking it again clears
    the focus, and so does a click on the chart's empty background. Enter on
    a keyboard-focused link does the same as a click.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const nodes = [
  {id: "A", name: "Alpha", x: 0, y: 0},
  {id: "B", name: "Bravo", x: 200, y: 0},
  {id: "C", name: "Charlie", x: 0, y: 120},
  {id: "D", name: "Delta", x: 200, y: 120},
];
const links = [
  {source: "A", target: "B", weight: 4},
  {source: "A", target: "C", weight: 9},
  {source: "C", target: "D", weight: 1},
];

/** Runs in the page: draws `chart` from `config`, with functions given as source strings under `fns`. */
const draw = ([chart, config, fns, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(config);
    for (const [key, src] of Object.entries(fns || {}))
      viz[key](new Function(`return ${src}`)());
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: where things are on screen. For the link keyed
    `key`, a point on it clear of every node; for the node keyed `gap[0]`
    and `gap[1]` (two nodes stacked in one column), the point just left of
    the empty space between them; and the chart area's center, top-left
    corner, and right edge.
*/
const locate = ([key, gap]) => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let link = null;
  const shapes = [];
  const marks = {};
  const walk = (n, x, y, k) => {
    const t = n.transform || {};
    const nx = x + k * (t.x || 0),
      ny = y + k * (t.y || 0),
      nk = k * (t.scale ?? 1);
    if (n.key === key) link = {n, x: nx, y: ny, k: nk};
    if (n.type === "circle")
      shapes.push({
        x: nx + nk * (n.cx || 0),
        y: ny + nk * (n.cy || 0),
        r: nk * n.r,
      });
    if (n.type === "rect" && n.datum && !n.datum.source) {
      const r = {
        x: nx + nk * n.x,
        y: ny + nk * n.y,
        w: nk * n.width,
        h: nk * n.height,
      };
      shapes.push(r);
      marks[n.key] = r;
    }
    (n.children || []).forEach(c => walk(c, nx, ny, nk));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", link.n.d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const length = path.getTotalLength();
  const clear = p =>
    shapes.every(s =>
      s.r !== undefined
        ? Math.hypot(p.x - s.x, p.y - s.y) > s.r + 4
        : p.x < s.x - 4 ||
          p.x > s.x + s.w + 4 ||
          p.y < s.y - 4 ||
          p.y > s.y + s.h + 4,
    );
  let at = null;
  for (const f of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.75, 0.85, 0.9]) {
    const p = path.getPointAtLength(length * f);
    const q = {x: link.x + link.k * p.x, y: link.y + link.k * p.y};
    if (clear(q)) {
      at = q;
      break;
    }
  }
  svg.remove();
  const m = viz._margin;
  const width = viz.schema.width - m.left - m.right;
  const height = viz.schema.height - m.top - m.bottom;
  const client = (x, y) => [rect.left + x, rect.top + y];
  const between =
    gap &&
    client(
      marks[gap[0]].x - 4,
      (marks[gap[0]].y + marks[gap[0]].h + marks[gap[1]].y) / 2,
    );
  return {
    link: at && client(at.x, at.y),
    center: client(m.left + width / 2, m.top + height / 2),
    corner: client(m.left + 4, m.top + 4),
    right: client(m.left + width - 14, m.top + height / 2),
    between,
  };
};

/** Runs in the page: the chart's focus, zoom scale, and each keyed mark's opacity. */
const state = prefixes => {
  const viz = window.__viz;
  const opacity = {};
  const walk = n => {
    const key = String(n.key);
    if (!key.endsWith("::hit") && prefixes.some(p => key.startsWith(p)))
      opacity[key] = n.paint?.opacity ?? 1;
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  return {
    focus: viz._focus ?? null,
    active: typeof viz._active === "function",
    scale: viz._zoomTransform?.scale ?? 1,
    opacity,
  };
};

/** Asserts which of the marks in `opacity` stay bright. */
function assertBright(opacity, bright) {
  for (const [key, value] of Object.entries(opacity)) {
    const want = bright.includes(key);
    assert.strictEqual(
      value === 1,
      want,
      `${key} ${want ? "stays bright" : "dims"} (opacity ${value})`,
    );
  }
}

const settle = page => page.waitForTimeout(700);

const charts = [
  {
    name: "Network",
    args: [
      {
        nodes: [...nodes, {id: "E", x: 100, y: 60}],
        links: [...links, {source: "A", target: "E", weight: 3}],
        sizeMax: 10,
      },
      {linkSize: "d => d.weight"},
    ],
    link: "network-link-A-E-3",
    prefixes: ["network-Circle-", "network-link-"],
    bright: ["network-Circle-A", "network-Circle-E", "network-link-A-E-3"],
    background: "right",
    zooms: true,
  },
  {
    name: "Rings",
    args: [{nodes, links, center: "A"}, {linkSize: "d => d.weight"}],
    link: "rings-link-A-B",
    prefixes: ["rings-Circle-", "rings-link-"],
    bright: ["rings-Circle-A", "rings-Circle-B", "rings-link-A-B"],
    background: "corner",
  },
  {
    name: "Sankey",
    args: [
      {
        nodes: [{id: "Alpha"}, {id: "Bravo"}, {id: "Charlie"}, {id: "Delta"}],
        links: [
          {source: "Alpha", target: "Charlie", amount: 5},
          {source: "Alpha", target: "Delta", amount: 1},
          {source: "Bravo", target: "Delta", amount: 3},
        ],
        nodePadding: 60,
      },
      {value: "d => d.amount"},
    ],
    link: "sankey-link-Alpha-Charlie",
    prefixes: ["sankey-Rect-", "sankey-link-"],
    bright: [
      "sankey-Rect-Alpha",
      "sankey-Rect-Charlie",
      "sankey-link-Alpha-Charlie",
    ],
    background: "between",
    gap: ["sankey-Rect-Charlie", "sankey-Rect-Delta"],
  },
];

for (const renderer of ["svg", "canvas"]) {
  for (const c of charts) {
    it(`${c.name} ${renderer}: clicking a link focuses it, again clears, and so does the background`, async () => {
      const {page, errors, close} = await openPage(box);
      try {
        await page.evaluate(draw, [c.name, ...c.args, renderer]);
        const where = () => page.evaluate(locate, [c.link, c.gap]);
        const before = await where();
        assert.ok(before.link, "a clear point on the link");

        // Focus.
        await page.mouse.click(...before.link);
        await settle(page);
        let s = await page.evaluate(state, c.prefixes);
        assert.ok(
          s.focus && `${s.focus}`.startsWith("link:"),
          `focus ${s.focus}`,
        );
        assertBright(s.opacity, c.bright);
        if (c.zooms) assert.ok(s.scale > 1, `zooms in (scale ${s.scale})`);
        else assert.strictEqual(s.scale, 1, "no zoom");

        // The same link again clears.
        const zoomed = await where();
        await page.mouse.click(...zoomed.link);
        await settle(page);
        s = await page.evaluate(state, c.prefixes);
        assert.strictEqual(s.focus, null, "a second click clears the focus");
        assert.strictEqual(s.active, false);
        assert.strictEqual(s.scale, 1, "and the zoom");

        // Focus again, then click the empty background.
        await page.mouse.click(...before.link);
        await settle(page);
        assert.ok((await page.evaluate(state, c.prefixes)).focus);
        const after = await where();
        await page.mouse.click(...after[c.background]);
        await settle(page);
        s = await page.evaluate(state, c.prefixes);
        assert.strictEqual(
          s.focus,
          null,
          "a background click clears the focus",
        );
        assert.strictEqual(s.active, false);
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }

  it(`Network ${renderer}: Enter on a keyboard-focused link focuses it`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Network", ...charts[0].args, renderer]);
      const focus = await page.evaluate(async () => {
        const viz = window.__viz;
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
        const key = k =>
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: k, bubbles: true}),
          );
        host.focus();
        await wait();
        for (let i = 0; i < 12; i++) {
          if (`${viz._keyboardNav?.current}`.startsWith("network-link-")) break;
          key("ArrowRight");
          await wait();
        }
        const current = viz._keyboardNav?.current;
        key("Enter");
        await new Promise(r => setTimeout(r, 400));
        return {current, focus: viz._focus ?? null};
      });
      assert.ok(`${focus.current}`.startsWith("network-link-"), focus.current);
      const index = focus.current.split("-").pop();
      assert.strictEqual(focus.focus, `link:${index}`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
