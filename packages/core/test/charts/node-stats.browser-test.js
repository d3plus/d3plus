import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Network measures in node tooltips, in Chromium on SVG and Canvas with a
    real pointer: Network, Rings, ArcDiagram, and Sankey list a node's
    degree, betweenness, and closeness (and its cluster, where clusters
    color the chart) without configuration; `arrows` split the degree in
    and out; `nodeTooltipStats` picks the measures or turns them off; and
    betweenness and closeness are worked out in idle time after the chart
    draws, filling in a tooltip that opened before them.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

/** Two triangles, Alpha–Bravo–Charlie and Delta–Echo–Foxtrot, joined by Charlie–Delta. */
const names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];
const nodes = names.map((name, i) => ({
  id: name[0],
  name,
  x: (i % 3) * 120 + (i > 2 ? 300 : 0),
  y: i % 2 ? 0 : 100,
}));
const links = [
  ["A", "B"],
  ["B", "C"],
  ["A", "C"],
  ["D", "E"],
  ["E", "F"],
  ["D", "F"],
  ["C", "D"],
].map(([source, target]) => ({source, target}));

/**
    Runs in the page: draws `chart` from `config`, then resolves once it has
    painted. With `hold`, idle callbacks wait for `release`.
*/
const draw = ([chart, config, renderer, hold]) =>
  new Promise(resolve => {
    // Holding idle callbacks keeps the measures from arriving until `release`.
    const idle = window.requestIdleCallback.bind(window);
    window.__held = [];
    window.__hold = hold;
    window.requestIdleCallback = (fn, options) =>
      window.__hold ? window.__held.push(fn) : idle(fn, options);
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .label(d => d.name ?? d.id)
      .config(config);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the screen point at the center of the node mark `key`. */
const nodePoint = key => {
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
  walk(window.__viz._paintedScene.root, 0, 0);
  return at && [rect.left + at[0], rect.top + at[1]];
};

/** Runs in the page: the visible tooltip's text, without whitespace. */
const tooltip = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

/** Runs in the page: whether the measures have been worked out. */
const worked = () => (window.__viz.ctx.nodeStatsCache?.size ?? 0) > 0;

/** Runs in the page: lets the held idle callbacks run. */
const release = () => {
  window.__hold = false;
  for (const fn of window.__held.splice(0)) window.requestIdleCallback(fn);
};

/** Waits (up to 3 seconds) for `fn` to hold in the page. */
async function waitFor(page, fn) {
  for (let i = 0; i < 60 && !(await page.evaluate(fn)); i++)
    await page.waitForTimeout(50);
}

/**
    Draws a chart, hovers the node mark `key`, and hands its tooltip's text
    to `check`. `mode` is `"wait"` (for the measures to arrive before
    hovering), `"hold"` (keep them from arriving), or `"none"`.
*/
async function nodeTip(chart, config, renderer, key, check, mode = "wait") {
  const hold = mode === "hold";
  const {page, errors, close} = await openPage(box);
  try {
    await page.evaluate(draw, [chart, config, renderer, hold]);
    if (mode === "wait") await waitFor(page, worked);
    const point = await page.evaluate(nodePoint, key);
    assert.ok(point, `found ${key}`);
    await page.mouse.move(point[0] - 20, point[1] - 30);
    await page.mouse.move(...point, {steps: 4});
    await page.waitForTimeout(150);
    const tip = await page.evaluate(tooltip);
    await check(tip, {worked: await page.evaluate(worked)}, page);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: a node's tooltip lists its measures and cluster by default, worked out after the draw`, async () => {
    await nodeTip(
      "Network",
      {nodes, links},
      renderer,
      "network-Circle-C",
      tip => {
        assert.ok(tip.startsWith("Charlie"), `title, got "${tip}"`);
        for (const row of [
          "Degree3",
          "Betweenness0.6",
          "Closeness0.71",
          "ClusterCharliecluster",
        ])
          assert.ok(tip.includes(row), `${row} in "${tip}"`);
        assert.ok(!tip.includes("Connections"), "degree replaces the count");
      },
    );
  });

  it(`Network ${renderer}: an open tooltip fills in the measures when they arrive`, async () => {
    await nodeTip(
      "Network",
      {nodes, links},
      renderer,
      "network-Circle-C",
      async (tip, {worked: ready}, page) => {
        assert.strictEqual(ready, false, "held back");
        assert.ok(tip.includes("Degree3"), `the degree at once: "${tip}"`);
        assert.ok(tip.includes("ClusterCharliecluster"), "and the cluster");
        // Ellipses hold the measures' places until they arrive.
        assert.ok(tip.includes("Betweenness\u2026"), `pending: "${tip}"`);
        assert.ok(tip.includes("Closeness\u2026"), `pending: "${tip}"`);
        await page.evaluate(release);
        await waitFor(page, worked);
        await page.waitForTimeout(100);
        const after = await page.evaluate(tooltip);
        assert.ok(after.includes("Betweenness0.6"), `filled in: "${after}"`);
        assert.ok(after.includes("Closeness0.71"), `filled in: "${after}"`);
        assert.ok(!after.includes("\u2026"), `no ellipsis left: "${after}"`);
      },
      "hold",
    );
  });

  it(`Network ${renderer}: arrows split the degree in and out`, async () => {
    await nodeTip(
      "Network",
      {nodes, links, arrows: true, nodeTooltipStats: ["degree"]},
      renderer,
      "network-Circle-C",
      async (tip, _, page) => {
        assert.ok(tip.includes("In-degree2"), `got "${tip}"`);
        assert.ok(tip.includes("Out-degree1"), `got "${tip}"`);
        assert.ok(!tip.includes("Betweenness"), "only the degree");
        await page.waitForTimeout(200);
        assert.strictEqual(
          await page.evaluate(worked),
          false,
          "degree alone needs no paths",
        );
      },
      "none",
    );
  });

  it(`Network ${renderer}: nodeTooltipStats: false keeps the connection count only`, async () => {
    await nodeTip(
      "Network",
      {nodes, links, nodeTooltipStats: false},
      renderer,
      "network-Circle-C",
      async (tip, _, page) => {
        assert.ok(tip.includes("Connections3"), `got "${tip}"`);
        for (const row of ["Degree", "Betweenness", "Closeness", "Cluster"])
          assert.ok(!tip.includes(row), `no ${row} in "${tip}"`);
        await page.waitForTimeout(200);
        assert.strictEqual(await page.evaluate(worked), false);
      },
      "none",
    );
  });

  it(`Rings ${renderer}: a node's tooltip lists its measures, with no cluster`, async () => {
    await nodeTip(
      "Rings",
      {nodes, links, center: "C"},
      renderer,
      "rings-Circle-D",
      tip => {
        for (const row of ["Degree3", "Betweenness0.6", "Closeness0.71"])
          assert.ok(tip.includes(row), `${row} in "${tip}"`);
        assert.ok(!tip.includes("Cluster"), `no cluster in "${tip}"`);
      },
    );
  });

  it(`ArcDiagram ${renderer}: a node's tooltip lists its measures and cluster`, async () => {
    await nodeTip("ArcDiagram", {nodes, links}, renderer, "arc-node-A", tip => {
      for (const row of [
        "Degree2",
        "Betweenness0",
        "Closeness0.5",
        "ClusterCharliecluster",
      ])
        assert.ok(tip.includes(row), `${row} in "${tip}"`);
    });
  });

  it(`Sankey ${renderer}: a node's tooltip lists its in- and out-degree and measures along the flows`, async () => {
    await nodeTip(
      "Sankey",
      {
        nodes: [{id: "Alpha"}, {id: "Bravo"}, {id: "Charlie"}, {id: "Delta"}],
        links: [
          {source: "Alpha", target: "Bravo", value: 5},
          {source: "Bravo", target: "Charlie", value: 3},
          {source: "Bravo", target: "Delta", value: 2},
        ],
      },
      renderer,
      "sankey-Rect-Bravo",
      tip => {
        // Flows run left to right: Alpha reaches Charlie and Delta through
        // Bravo, and Bravo reaches two of the other three.
        for (const row of [
          "In-degree1",
          "Out-degree2",
          "Betweenness0.33",
          "Closeness0.67",
        ])
          assert.ok(tip.includes(row), `${row} in "${tip}"`);
        assert.ok(!tip.includes("Cluster"), `no cluster in "${tip}"`);
      },
    );
  });
}
