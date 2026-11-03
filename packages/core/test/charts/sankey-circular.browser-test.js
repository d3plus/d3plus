import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Sankey's circular links, in Chromium on SVG and Canvas: links that loop
    back into a node they left draw as bands around the nodes, inside the
    chart, with arrowheads, labels, tooltips, hover, click and keyboard
    focus, in small multiples too. `sankey-cycles.browser-test.js` covers
    `circularLinks(false)`.
*/

const W = 640;
const H = 420;
const box = `<div id='viz' style='width:${W}px;height:${H}px'></div>`;

const links = [
  {source: "A", target: "B", value: 20},
  {source: "B", target: "C", value: 15},
  {source: "C", target: "A", value: 1},
  {source: "C", target: "D", value: 10},
  {source: "D", target: "B", value: 1},
  {source: "E", target: "E", value: 1},
  {source: "D", target: "E", value: 6},
];

/**
    Runs in the page: draws a Sankey from `config`, logging console warnings
    to `window.__warnings`, then resolves once it has painted.
*/
const draw = ([config, renderer, labels]) =>
  new Promise(resolve => {
    window.__warnings = [];
    const warn = console.warn;
    console.warn = (...args) => {
      window.__warnings.push(args.join(" "));
      warn.apply(console, args);
    };
    const viz = new window.d3plus.Sankey()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .value("value")
      .config(config);
    if (labels) viz.linkLabel(d => d.value);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: every painted scene node (minus groups) with its offset, by key. */
const sceneNodes = () => {
  const out = {};
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key !== undefined && n.type !== "group")
      out[String(n.key)] = {
        type: n.type,
        d: n.d,
        ox: nx,
        oy: ny,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        aria: n.aria?.label,
        stroke: n.paint?.stroke,
        fill: n.paint?.fill,
        fillOpacity: n.paint?.fillOpacity,
        strokeWidth: n.paint?.strokeWidth,
        strokeOpacity: n.paint?.strokeOpacity,
        opacity: n.paint?.opacity ?? 1,
        text: n.text,
      };
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  return out;
};

/** Runs in the page: the screen point in the middle of the band `key`'s lane. */
const lanePoint = key => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let found = null;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key === key) found = {n, x: nx, y: ny};
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  if (!found) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", found.n.d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  // The middles of the ribbon's two edges, a quarter and three quarters of
  // the way around it, and between them the middle of the band.
  const length = path.getTotalLength();
  const a = path.getPointAtLength(length / 4);
  const b = path.getPointAtLength((length * 3) / 4);
  svg.remove();
  return [
    rect.left + found.x + (a.x + b.x) / 2,
    rect.top + found.y + (a.y + b.y) / 2,
  ];
};

/** Runs in the page: the visible tooltip's text, without whitespace. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** Opens a page, draws a Sankey, and runs `check(page)` on it. */
async function withSankey(args, check) {
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, args);
    await check(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
const finite = d => !/NaN|Infinity|undefined/.test(d);
const loops = ["sankey-link-C-A", "sankey-link-D-B", "sankey-link-E-E"];

for (const renderer of ["svg", "canvas"]) {
  it(`Sankey ${renderer}: draws the links that loop back as bands inside the chart`, async () => {
    await withSankey([{links, linkColor: "source"}, renderer], async page => {
      const scene = await page.evaluate(sceneNodes);
      for (const key of loops) {
        const band = scene[key];
        assert.ok(band && finite(band.d), `${key}: ${band?.d}`);
        assert.ok(scene[`${key}::hit`], `${key} has a hit path`);
        const n = numbers(band.d);
        // A filled ribbon: its edges are its outline.
        const half = 0;
        const xs = n.filter((_, k) => !(k % 2)).map(x => x + band.ox);
        const ys = n.filter((_, k) => k % 2).map(y => y + band.oy);
        assert.ok(
          Math.min(...xs) - half >= -0.5 && Math.max(...xs) + half <= W + 0.5,
          `${key} inside horizontally: ${Math.min(...xs)}..${Math.max(...xs)}`,
        );
        assert.ok(
          Math.min(...ys) - half >= -0.5 && Math.max(...ys) + half <= H + 0.5,
          `${key} inside vertically: ${Math.min(...ys)}..${Math.max(...ys)}`,
        );
        // linkColor colors the band like its source, see-through.
        assert.ok(typeof band.fill === "string" && band.fill !== "none");
        assert.strictEqual(band.fillOpacity, 0.5);
        assert.ok(band.d.endsWith("Z"), "a closed ribbon");
      }
      for (const [key, node] of Object.entries(scene))
        assert.ok(
          Object.values(node).every(v => !/NaN|Infinity/.test(String(v))),
          key,
        );
      // A node's height counts its returns: 7 into E (its loop and D → E)
      // and 21 into B (A → B and D → B).
      const a = scene["sankey-Rect-A"];
      const e = scene["sankey-Rect-E"];
      const b = scene["sankey-Rect-B"];
      assert.ok(
        Math.abs(e.height / 7 - b.height / 21) < 0.5,
        `${e.height} ${b.height}`,
      );
      assert.ok(a.height > 0);
      // The loop to E leaves its right side and enters its left side.
      const self = numbers(scene["sankey-link-E-E"].d);
      assert.ok(Math.abs(self[0] - (e.x + e.width)) < 0.5, "leaves E's right");
      assert.ok(
        self.some((x, k) => !(k % 2) && Math.abs(x - e.x) < 0.5),
        "enters E's left",
      );
      assert.strictEqual(scene["sankey-link-C-A"].aria, "C to A, 1.");
      const warnings = await page.evaluate(() => window.__warnings);
      assert.deepStrictEqual(warnings, [], "no warnings");
    });
  });

  it(`Sankey ${renderer}: circular links carry arrowheads, labels, tooltips and focus`, async () => {
    await withSankey([{links, arrows: true}, renderer, true], async page => {
      const scene = await page.evaluate(sceneNodes);
      const band = scene["sankey-link-C-A"];
      const head = scene["sankey-arrow-t-C-A"];
      const a = scene["sankey-Rect-A"];
      assert.ok(head && finite(head.d), "the return's arrowhead");
      // The band ends inside its head, which points into A's left side.
      const xs = numbers(band.d).filter((_, k) => !(k % 2));
      const end = Math.max(...xs.filter(x => x < a.x + 1));
      assert.ok(
        end < a.x - 0.5 && end > a.x - 28,
        `band ends at ${end}, A at ${a.x}`,
      );
      const tip = numbers(head.d);
      assert.ok(
        Math.abs(Math.max(...tip.filter((_, k) => !(k % 2))) - a.x) < 1,
        `the head's tip is on A's edge: ${head.d}`,
      );
      // Its label sits on the lane.
      const labels = Object.keys(scene).filter(
        k =>
          k.startsWith("sankey-link-C-A-label") ||
          k === "sankey-link-C-A::label",
      );
      assert.ok(
        labels.length,
        Object.keys(scene)
          .filter(k => /label/.test(k))
          .join(),
      );

      const point = await page.evaluate(lanePoint, "sankey-link-C-A");
      await page.mouse.move(point[0] - 20, point[1] - 30);
      await page.mouse.move(...point, {steps: 4});
      await page.waitForTimeout(200);
      const tip2 = await page.evaluate(tooltip);
      assert.ok(tip2.includes("C→A"), `tooltip: "${tip2}"`);

      await page.mouse.click(...point);
      await page.waitForTimeout(400);
      const focus = await page.evaluate(() => window.__viz._focus ?? null);
      assert.ok(`${focus}`.startsWith("link:"), `focus: ${focus}`);

      const visited = await page.evaluate(async () => {
        const viz = window.__viz;
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
        host.focus();
        await wait();
        const seen = [];
        for (let i = 0; i < 16; i++) {
          if (viz._keyboardNav?.current) seen.push(viz._keyboardNav.current);
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
          );
          await wait();
        }
        return seen;
      });
      assert.ok(
        visited.some(k => loops.includes(k)),
        `keyboard reaches a return: ${visited}`,
      );
    });
  });

  it(`Sankey ${renderer}: draws circular links inside each small multiple`, async () => {
    const rows = [
      ...links.map(l => ({...l, panel: "one"})),
      ...links.map(l => ({...l, panel: "two"})),
    ];
    await withSankey(
      [
        {links: rows, data: rows, facet: "panel", reducedMotion: true},
        renderer,
      ],
      async page => {
        const scene = await page.evaluate(sceneNodes);
        const bands = Object.entries(scene).filter(([k]) =>
          /sankey-link-C-A$/.test(k),
        );
        assert.strictEqual(bands.length, 2, Object.keys(scene).join());
        for (const [key, band] of bands) {
          assert.ok(finite(band.d), key);
          const xs = numbers(band.d)
            .filter((_, k) => !(k % 2))
            .map(x => x + band.ox);
          assert.ok(
            Math.min(...xs) >= -0.5 && Math.max(...xs) <= W + 0.5,
            `${key}: ${Math.min(...xs)}..${Math.max(...xs)}`,
          );
        }
        // The two panels sit side by side, each with its own loop.
        const [l, r] = bands.map(
          ([, b]) =>
            Math.min(...numbers(b.d).filter((_, k) => !(k % 2))) + b.ox,
        );
        assert.ok(Math.abs(l - r) > W / 4, `${l} ${r}`);
      },
    );
  });

  it(`Sankey ${renderer}: draws a 200-node graph full of loops inside the chart`, async () => {
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const many = [];
    for (let s = 0; s < 200; s++)
      for (let k = 0; k < 4; k++) {
        const t = Math.floor(random() * 200);
        many.push({source: `n${s}`, target: `n${t}`, value: random() * 9});
      }
    const {page, errors, close} = await openPage(box);
    try {
      const time = await page.evaluate(
        args =>
          new Promise(resolve => {
            const start = performance.now();
            window.__warnings = [];
            console.warn = (...a) => window.__warnings.push(a.join(" "));
            window.__viz = new window.d3plus.Sankey()
              .select("#viz")
              .renderer(args[1])
              .duration(0)
              .links(args[0])
              .value("value");
            window.__viz.render(() => resolve(performance.now() - start));
          }),
        [many, renderer],
      );
      assert.ok(time < 8000, `drawn in ${time}ms`);
      const scene = await page.evaluate(sceneNodes);
      const bands = Object.entries(scene).filter(([k]) =>
        /^sankey-link-n\d+-n\d+$/.test(k),
      );
      assert.ok(bands.length > 400, `${bands.length} bands`);
      for (const [key, node] of Object.entries(scene))
        assert.ok(
          Object.values(node).every(v => !/NaN|Infinity/.test(String(v))),
          key,
        );
      assert.deepStrictEqual(await page.evaluate(() => window.__warnings), []);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });
}
