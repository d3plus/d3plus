import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Link interaction on the node-link charts, in Chromium on SVG and Canvas
    with a real pointer: hovering a Network, Rings, or Sankey link shows its
    tooltip ("Source → Target" and the link's fields) and highlights it and
    its two ends; link accessors receive node data at `source`/`target`; a
    node's tooltip lists its connections; the strings follow the locale; and
    ArcDiagram's tooltips read the same.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const nodes = [
  {id: "A", name: "Alpha", x: 0, y: 0, color: "#c00"},
  {id: "B", name: "Bravo", x: 200, y: 0, color: "#0c0"},
  {id: "C", name: "Charlie", x: 0, y: 120, color: "#00c"},
  {id: "D", name: "Delta", x: 200, y: 120, color: "#cc0"},
];
const links = [
  {source: "A", target: "B", weight: 4, kind: "trade"},
  {source: "A", target: "C", weight: 9, kind: "aid"},
  {source: "C", target: "D", weight: 1, kind: "trade"},
];

/**
    Runs in the page: draws `chart` from `config` (functions given as source
    strings under `fns`), then resolves once it has painted.
*/
const draw = ([chart, config, fns, renderer]) =>
  new Promise(resolve => {
    window.__seen = [];
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
    Runs in the page: the screen point on the link whose key is `key`, clear
    of every node, plus that link's aria label.
*/
const linkPoint = key => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let link = null;
  const shapes = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key === key) link = {n, x: nx, y: ny};
    if (n.type === "circle")
      shapes.push({x: nx + (n.cx || 0), y: ny + (n.cy || 0), r: n.r});
    if (n.type === "rect" && n.datum && !n.datum.source)
      shapes.push({x: nx + n.x, y: ny + n.y, w: n.width, h: n.height});
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  if (!link) return null;
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
  const fractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.75, 0.85, 0.9];
  for (const f of fractions) {
    const p = path.getPointAtLength(length * f);
    const q = {x: p.x + link.x, y: p.y + link.y};
    if (clear(q)) {
      at = q;
      break;
    }
  }
  svg.remove();
  return at && {point: [rect.left + at.x, rect.top + at.y], aria: link.n.aria};
};

/** Runs in the page: the screen point at the center of the node mark `key`. */
const nodePoint = key => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let at = null;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.key === key)
      at =
        n.type === "circle"
          ? [nx + (n.cx || 0), ny + (n.cy || 0)]
          : [nx + n.x + n.width / 2, ny + n.y + n.height / 2];
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return at && [rect.left + at[0], rect.top + at[1]];
};

/** Runs in the page: the visible tooltip's text and each keyed mark's opacity. */
const state = prefixes => {
  const tip = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");
  const opacity = {};
  const walk = n => {
    const key = String(n.key);
    if (!key.endsWith("::hit") && prefixes.some(p => key.startsWith(p)))
      opacity[key] = n.paint?.opacity ?? 1;
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  return {tip, opacity};
};

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

const networkConfig = {nodes, links, sizeMax: 10};
const label = "d => d.name";
const networkFns = {label, linkSize: "d => d.weight"};

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: hovering a link shows its tooltip and highlights its ends`, async () => {
    await withChart(
      ["Network", networkConfig, networkFns, renderer],
      async page => {
        const found = await page.evaluate(linkPoint, "network-link-A-B-0");
        assert.ok(found, "a clear point on the link");
        assert.strictEqual(found.aria.label, "Alpha to Bravo, 4.");
        await hover(page, found.point);
        const {tip, opacity} = await page.evaluate(state, [
          "network-Circle-",
          "network-link-",
        ]);
        assert.ok(tip.includes("Alpha→Bravo"), `title, got "${tip}"`);
        assert.ok(tip.includes("weight") && tip.includes("4"), "its weight");
        assert.ok(tip.includes("kind") && tip.includes("trade"), "its kind");
        assert.ok(!tip.includes("Value"), "weight already shows the value");
        assertBright(opacity, [
          "network-Circle-A",
          "network-Circle-B",
          "network-link-A-B-0",
        ]);
      },
    );
  });

  it(`Network ${renderer}: keyboard focus reaches links and reads their label`, async () => {
    await withChart(
      ["Network", networkConfig, networkFns, renderer],
      async page => {
        const visited = await page.evaluate(async () => {
          const viz = window.__viz;
          const host = document.querySelector("#viz .d3plus-keyboard-nav");
          const wait = () =>
            new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
          host.focus();
          await wait();
          const live = host.querySelector("[aria-live]");
          const seen = {};
          for (let i = 0; i < 12; i++) {
            const id = viz._keyboardNav?.current;
            if (id) seen[id] = live ? live.textContent : "";
            host.dispatchEvent(
              new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
            );
            await wait();
          }
          return seen;
        });
        const ids = Object.keys(visited);
        const links = ids.filter(k => k.startsWith("network-link-"));
        assert.ok(links.length > 0, `reaches links: ${ids}`);
        assert.ok(!links.some(k => k.endsWith("::hit")), "not hit paths");
        const labels = {
          "network-link-A-B-0": "Alpha to Bravo, 4.",
          "network-link-A-C-1": "Alpha to Charlie, 9.",
          "network-link-C-D-2": "Charlie to Delta, 1.",
        };
        for (const k of links)
          assert.ok(
            visited[k].includes(labels[k]),
            `${k} announces "${labels[k]}", got "${visited[k]}"`,
          );
      },
    );
  });

  it(`Network ${renderer}: link accessors receive node data at source and target`, async () => {
    await withChart(
      [
        "Network",
        networkConfig,
        {
          label,
          linkSize: `d => (window.__seen.push([typeof d.source, d.source.name, d.target.name, d.kind]), d.weight)`,
          shapeConfig: `({Path: {stroke: d => d.source.color}})`,
        },
        renderer,
      ],
      async page => {
        const {seen, strokes} = await page.evaluate(() => {
          const strokes = {};
          const walk = n => {
            const key = String(n.key);
            if (key.startsWith("network-link-") && !key.endsWith("::hit"))
              strokes[key] = n.paint.stroke;
            (n.children || []).forEach(walk);
          };
          walk(window.__viz._paintedScene.root);
          return {seen: window.__seen, strokes};
        });
        assert.deepStrictEqual(seen.slice(0, 3), [
          ["object", "Alpha", "Bravo", "trade"],
          ["object", "Alpha", "Charlie", "aid"],
          ["object", "Charlie", "Delta", "trade"],
        ]);
        assert.strictEqual(strokes["network-link-A-B-0"], "#c00");
        assert.strictEqual(strokes["network-link-C-D-2"], "#00c");
      },
    );
  });

  it(`Network ${renderer}: a node's tooltip lists its connections`, async () => {
    await withChart(
      ["Network", networkConfig, networkFns, renderer],
      async page => {
        await hover(page, await page.evaluate(nodePoint, "network-Circle-A"));
        const {tip} = await page.evaluate(state, []);
        assert.ok(tip.includes("Alpha"), `title, got "${tip}"`);
        assert.ok(tip.includes("Degree2"), "its degree");
        assert.ok(tip.includes("→Charlie9"), "its strongest link first");
        assert.ok(tip.includes("→Bravo4"), "then the next");
        assert.ok(tip.indexOf("Charlie9") < tip.indexOf("Bravo4"));
      },
    );
  });

  it(`Network ${renderer}: nodeTooltipLinks: false lists no links`, async () => {
    await withChart(
      [
        "Network",
        {...networkConfig, nodeTooltipLinks: false},
        networkFns,
        renderer,
      ],
      async page => {
        await hover(page, await page.evaluate(nodePoint, "network-Circle-C"));
        const {tip} = await page.evaluate(state, []);
        assert.ok(tip.includes("Degree2"), `got "${tip}"`);
        assert.ok(!tip.includes("→") && !tip.includes("←"), "no links");
      },
    );
  });

  it(`Network ${renderer}: the strings follow the es-ES locale`, async () => {
    await withChart(
      [
        "Network",
        {...networkConfig, locale: "es-ES"},
        {label, linkSize: "d => d.weight * 10"},
        renderer,
      ],
      async page => {
        const found = await page.evaluate(linkPoint, "network-link-A-C-1");
        assert.strictEqual(found.aria.label, "Alpha a Charlie, 90.");
        await hover(page, found.point);
        const link = (await page.evaluate(state, [])).tip;
        assert.ok(link.includes("Alpha→Charlie"), `got "${link}"`);
        assert.ok(link.includes("Valor90"), "the value row");
        await page.mouse.move(5, 5);
        await hover(page, await page.evaluate(nodePoint, "network-Circle-D"));
        const node = (await page.evaluate(state, [])).tip;
        assert.ok(node.includes("Grado1"), `got "${node}"`);
        assert.ok(node.includes("←Charlie10"), "an incoming link");
      },
    );
  });

  it(`Rings ${renderer}: hovering a link shows its tooltip and highlights its ends`, async () => {
    await withChart(
      [
        "Rings",
        {
          nodes,
          links: [
            links[0],
            links[1],
            {source: "B", target: "D", weight: 2, kind: "aid"},
          ],
          center: "A",
        },
        networkFns,
        renderer,
      ],
      async page => {
        const found = await page.evaluate(linkPoint, "rings-link-A-B");
        assert.ok(found, "a clear point on the link");
        assert.strictEqual(found.aria.label, "Alpha to Bravo, 4.");
        await hover(page, found.point);
        const {tip, opacity} = await page.evaluate(state, [
          "rings-Circle-",
          "rings-link-",
        ]);
        assert.ok(tip.includes("Alpha→Bravo"), `title, got "${tip}"`);
        assert.ok(tip.includes("kind") && tip.includes("trade"), "its fields");
        assertBright(opacity, [
          "rings-Circle-A",
          "rings-Circle-B",
          "rings-link-A-B",
        ]);
        await page.mouse.move(5, 5);
        await hover(page, await page.evaluate(nodePoint, "rings-Circle-B"));
        const node = (await page.evaluate(state, [])).tip;
        assert.ok(node.includes("Degree2"), `got "${node}"`);
        assert.ok(node.includes("→Delta2"), "its links");
      },
    );
  });

  it(`Sankey ${renderer}: hovering a link shows its tooltip and highlights its ends`, async () => {
    await withChart(
      [
        "Sankey",
        {
          nodes: [{id: "Alpha"}, {id: "Bravo"}, {id: "Charlie"}, {id: "Delta"}],
          links: [
            {source: "Alpha", target: "Charlie", amount: 5, kind: "trade"},
            {source: "Alpha", target: "Delta", amount: 1, kind: "aid"},
            {source: "Bravo", target: "Delta", amount: 3, kind: "trade"},
          ],
        },
        {
          value: `d => (window.__seen.push(d.source.id + ">" + d.target.id), d.amount)`,
        },
        renderer,
      ],
      async page => {
        const seen = await page.evaluate(() => window.__seen);
        assert.deepStrictEqual(seen.slice(0, 3), [
          "Alpha>Charlie",
          "Alpha>Delta",
          "Bravo>Delta",
        ]);
        const found = await page.evaluate(
          linkPoint,
          "sankey-link-Alpha-Charlie",
        );
        assert.ok(found, "a clear point on the link");
        assert.strictEqual(found.aria.label, "Alpha to Charlie, 5.");
        await hover(page, found.point);
        const {tip, opacity} = await page.evaluate(state, [
          "sankey-Rect-",
          "sankey-link-",
        ]);
        assert.ok(tip.includes("Alpha→Charlie"), `title, got "${tip}"`);
        assert.ok(tip.includes("amount") && tip.includes("5"), "its amount");
        assert.ok(tip.includes("kind") && tip.includes("trade"), "its kind");
        assertBright(opacity, [
          "sankey-Rect-Alpha",
          "sankey-Rect-Charlie",
          "sankey-link-Alpha-Charlie",
        ]);
        await page.mouse.move(5, 5);
        await hover(page, await page.evaluate(nodePoint, "sankey-Rect-Delta"));
        const node = (await page.evaluate(state, [])).tip;
        assert.ok(node.includes("Degree2"), `got "${node}"`);
        assert.ok(node.indexOf("←Bravo3") < node.indexOf("←Alpha1"));
      },
    );
  });

  it(`ArcDiagram ${renderer}: tooltips read as before, with the link's fields`, async () => {
    await withChart(
      ["ArcDiagram", {nodes, links}, {label}, renderer],
      async page => {
        const found = await page.evaluate(linkPoint, "arc-link-A-C-1");
        assert.strictEqual(found.aria.label, "Alpha to Charlie.");
        await hover(page, found.point);
        const {tip, opacity} = await page.evaluate(state, [
          "arc-node-",
          "arc-link-",
        ]);
        assert.ok(tip.includes("Alpha→Charlie"), `got "${tip}"`);
        assert.ok(tip.includes("weight9"), "the link's fields");
        assertBright(opacity, ["arc-node-A", "arc-node-C", "arc-link-A-C-1"]);
        await page.mouse.move(5, 5);
        await hover(page, await page.evaluate(nodePoint, "arc-node-A"));
        const node = (await page.evaluate(state, [])).tip;
        assert.ok(node.includes("Degree2"), `got "${node}"`);
        assert.ok(!node.includes("→"), "unsized links aren't listed");
      },
    );
  });
}
