import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Links from a node to itself, in Chromium on SVG and Canvas: Network,
    ArcDiagram, and Rings draw them as loops (with arrows, labels, a tooltip,
    hover, click focus, and keyboard focus), and Sankey leaves them out with
    one warning. Sankey also draws the nodes no link touches.
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
  {source: "A", target: "A", weight: 5},
  {source: "A", target: "A", weight: 2},
  {source: "D", target: "D", weight: 3},
];

/**
    Runs in the page: draws `chart` from `config` (functions given as source
    strings under `fns`), logging console warnings to `window.__warnings`,
    then resolves once it has painted.
*/
const draw = ([chart, config, fns, renderer]) =>
  new Promise(resolve => {
    window.__warnings = [];
    const warn = console.warn;
    console.warn = (...args) => {
      window.__warnings.push(args.join(" "));
      warn.apply(console, args);
    };
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

/** Runs in the page: every painted scene node (minus groups) with its offset, by key. */
const sceneNodes = () => {
  const out = {};
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key !== undefined)
      out[String(n.key)] = {
        type: n.type,
        d: n.d,
        x: nx,
        y: ny,
        cx: n.cx,
        cy: n.cy,
        r: n.r,
        rx: n.x,
        ry: n.y,
        width: n.width,
        height: n.height,
        aria: n.aria?.label,
        opacity: n.paint?.opacity ?? 1,
      };
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  return out;
};

/** Runs in the page: the screen point at the far point of the loop path `key` (labels are inert). */
const loopPoint = key => {
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
  const p = path.getPointAtLength(path.getTotalLength() / 2);
  svg.remove();
  return [rect.left + found.x + p.x, rect.top + found.y + p.y];
};

/** Runs in the page: the visible tooltip's text, without whitespace. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** Opens a page, draws a chart, and runs `check(page)` on it. */
async function withChart(args, check) {
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, args);
    await check(page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

/** Moves the real pointer onto `point`, from a little away. */
async function hover(page, point) {
  await page.mouse.move(point[0] - 20, point[1] - 30);
  await page.mouse.move(...point, {steps: 4});
  await page.waitForTimeout(150);
}

const finite = d => !/NaN|Infinity|undefined/.test(d);
const label = "d => d.name";

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: draws each self-link as a loop with its arrow and label`, async () => {
    await withChart(
      [
        "Network",
        {nodes, links, sizeMax: 12, arrows: true},
        {label, linkSize: "d => d.weight", linkLabel: "d => d.weight"},
        renderer,
      ],
      async page => {
        const scene = await page.evaluate(sceneNodes);
        for (const key of [
          "network-link-A-A-3",
          "network-link-A-A-4",
          "network-link-D-D-5",
        ]) {
          const loop = scene[key];
          assert.ok(loop, `${key} is drawn`);
          assert.ok(/C/.test(loop.d) && finite(loop.d), `${key}: ${loop.d}`);
          assert.ok(scene[`${key}::hit`], `${key} has a hit path`);
        }
        assert.notStrictEqual(
          scene["network-link-A-A-3"].d,
          scene["network-link-A-A-4"].d,
          "two loops on a node fan apart",
        );
        assert.ok(scene["network-arrow-A-A-3-t"], "the loop's arrowhead");
        assert.ok(
          scene["network-link-D-D-5-label-group"],
          "the loop's label at its far point",
        );
        assert.strictEqual(
          scene["network-link-A-A-3"].aria,
          "Alpha to Alpha, 5.",
        );
        assert.deepStrictEqual(
          await page.evaluate(() => window.__warnings),
          [],
          "no warnings",
        );
      },
    );
  });

  it(`Network ${renderer}: hovering and clicking a loop shows its tooltip and focuses it`, async () => {
    await withChart(
      ["Network", {nodes, links, sizeMax: 12}, {label}, renderer],
      async page => {
        const point = await page.evaluate(loopPoint, "network-link-D-D-5");
        assert.ok(point, "a point on the loop");
        await hover(page, point);
        const tip = await page.evaluate(tooltip);
        assert.ok(tip.includes("Delta→Delta"), `title, got "${tip}"`);
        const scene = await page.evaluate(sceneNodes);
        assert.strictEqual(scene["network-link-D-D-5"].opacity, 1);
        assert.strictEqual(scene["network-Circle-D"].opacity, 1);
        assert.ok(scene["network-Circle-A"].opacity < 1, "the rest dims");
        assert.ok(scene["network-link-A-A-3"].opacity < 1, "other loops dim");

        await page.mouse.click(...point);
        await page.waitForTimeout(100);
        assert.strictEqual(
          await page.evaluate(() => window.__viz._focus),
          "link:5",
        );
      },
    );
  });

  it(`Network ${renderer}: a node's tooltip lists its loop, and the keyboard reaches loops`, async () => {
    await withChart(
      ["Network", {nodes, links, sizeMax: 12}, {label}, renderer],
      async page => {
        const center = await page.evaluate(() => {
          const host =
            document.querySelector("#viz svg") ||
            document.querySelector("#viz canvas");
          const rect = host.getBoundingClientRect();
          let at = null;
          const walk = (n, x, y) => {
            const t = n.transform || {};
            const nx = x + (t.x || 0),
              ny = y + (t.y || 0);
            if (n.key === "network-Circle-D") at = [nx + n.cx, ny + n.cy];
            (n.children || []).forEach(c => walk(c, nx, ny));
          };
          walk(window.__viz._paintedScene.root, 0, 0);
          return [rect.left + at[0], rect.top + at[1]];
        });
        await page.evaluate(() => window.__viz.nodeTooltipLinks(3));
        await hover(page, center);
        const tip = await page.evaluate(tooltip);
        assert.ok(tip.includes("Connections2"), `counts the loop once: ${tip}`);
        assert.ok(tip.includes("↻Delta"), `lists the loop: ${tip}`);

        const visited = await page.evaluate(async () => {
          const viz = window.__viz;
          const host = document.querySelector("#viz .d3plus-keyboard-nav");
          const wait = () =>
            new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
          host.focus();
          await wait();
          const seen = [];
          for (let i = 0; i < 14; i++) {
            if (viz._keyboardNav?.current) seen.push(viz._keyboardNav.current);
            host.dispatchEvent(
              new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
            );
            await wait();
          }
          return seen;
        });
        assert.ok(
          visited.includes("network-link-D-D-5"),
          `reaches the loop: ${visited}`,
        );
      },
    );
  });

  it(`ArcDiagram ${renderer}: draws each self-link as a loop on the arcs' side`, async () => {
    await withChart(
      [
        "ArcDiagram",
        {nodes, links, arrows: true},
        {label, linkSize: "d => d.weight", linkLabel: "d => d.weight"},
        renderer,
      ],
      async page => {
        const scene = await page.evaluate(sceneNodes);
        const loop = scene["arc-link-D-D-5"];
        assert.ok(loop && /C/.test(loop.d) && finite(loop.d), loop?.d);
        assert.ok(scene["arc-link-A-A-3"] && scene["arc-link-A-A-4"]);
        assert.ok(scene["arc-arrow-D-D-5-t"], "the loop's arrowhead");
        // Above the line: the loop's points sit above the node's center.
        const node = scene["arc-node-D"];
        const ys = (loop.d.match(/-?[\d.]+/g) || [])
          .map(Number)
          .filter((_, i) => i % 2);
        assert.ok(Math.min(...ys) < node.cy - node.r, "rises above the node");
        const point = await page.evaluate(loopPoint, "arc-link-D-D-5");
        await hover(page, point);
        const tip = await page.evaluate(tooltip);
        assert.ok(tip.includes("Delta→Delta"), `title, got "${tip}"`);
      },
    );
  });

  it(`Rings ${renderer}: draws loops and keeps a looped center in the middle`, async () => {
    await withChart(
      [
        "Rings",
        {
          links: [
            {source: "A", target: "B"},
            {source: "A", target: "C"},
            {source: "B", target: "D"},
            {source: "A", target: "A"},
            {source: "B", target: "B"},
          ],
          center: "A",
          arrows: true,
        },
        {},
        renderer,
      ],
      async page => {
        const scene = await page.evaluate(sceneNodes);
        const center = scene["rings-Circle-A"];
        assert.ok(Math.abs(center.x - 320) < 2, `centered: ${center.x}`);
        for (const key of ["rings-link-A-A-3", "rings-link-B-B-4"]) {
          const loop = scene[key];
          assert.ok(loop && /C/.test(loop.d) && finite(loop.d), key);
        }
        assert.ok(scene["rings-arrow-A-A-3-t"] || scene["rings-arrow-A-A-3"]);
        assert.ok(scene["rings-Circle-B"] && scene["rings-Circle-D"]);
      },
    );
  });

  it(`Sankey ${renderer}: leaves out self-links with one warning, and draws unlinked nodes`, async () => {
    await withChart(
      [
        "Sankey",
        {
          nodes: [
            {id: "A"},
            {id: "B"},
            {id: "C"},
            {id: "D", value: 3},
            {id: "E"},
          ],
          links: [
            {source: "A", target: "B", value: 4},
            {source: "B", target: "C", value: 2},
            {source: "B", target: "B", value: 5},
          ],
          value: "value",
        },
        {},
        renderer,
      ],
      async page => {
        const scene = await page.evaluate(sceneNodes);
        const keys = Object.keys(scene);
        assert.ok(
          !keys.some(k => k.includes("B-B")),
          `no self-link drawn: ${keys}`,
        );
        const warnings = await page.evaluate(() => window.__warnings);
        assert.strictEqual(warnings.length, 1, String(warnings));
        assert.ok(warnings[0].includes("leaves out 1 link (B → B)"));
        const a = scene["sankey-Rect-A"];
        const d = scene["sankey-Rect-D"];
        const e = scene["sankey-Rect-E"];
        assert.ok(d && e, "unlinked nodes are drawn");
        assert.ok(Math.abs(d.x + d.rx - (a.x + a.rx)) < 1, "first column");
        assert.ok(e.height > 1 && d.height > e.height, "D by its value");
        // E has no value of its own: it is as tall as the thinnest link.
        const c = scene["sankey-Rect-C"];
        assert.ok(Math.abs(e.height - c.height) < 1, `${e.height} ${c.height}`);

        // Redrawing doesn't warn again.
        await page.evaluate(
          () => new Promise(r => window.__viz.render(() => r(true))),
        );
        assert.strictEqual(
          (await page.evaluate(() => window.__warnings)).length,
          1,
        );
      },
    );
  });
}
