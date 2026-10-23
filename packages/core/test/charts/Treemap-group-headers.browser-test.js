import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #363: a nested Treemap gives each group above its tiles a header strip
    naming it (finviz-style), drawn on both backends, nested per level, left
    off groups too small for one, and acting as the group's handle: hovering
    it highlights the group, and clicking it zooms into the group.
*/

const market = [
  {sector: "Tech", industry: "Software", company: "Alpha", value: 30},
  {sector: "Tech", industry: "Software", company: "Beta", value: 25},
  {sector: "Tech", industry: "Chips", company: "Gamma", value: 18},
  {sector: "Health", industry: "Pharma", company: "Delta", value: 22},
  {sector: "Health", industry: "Devices", company: "Epsilon", value: 16},
  {sector: "Energy", industry: "Oil", company: "Zeta", value: 14},
  {sector: "Energy", industry: "Oil", company: "Eta", value: 8},
];

/**
    Opens a page and renders a Treemap with `calls` (`[method, ...args]`
    pairs) into a 600×400 #viz, kept as `window.__viz`.
*/
async function chart(calls, renderer = "svg") {
  const opened = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([calls, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap();
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [calls, renderer],
  );
  return opened;
}

/** Waits for a click's re-render to settle. */
const settle = page => page.waitForTimeout(120);

/** The headers and tiles in the chart's scene, with the header names. */
function scene(page) {
  return page.evaluate(() => {
    const viz = window.__viz;
    const headers = [],
      names = [],
      tiles = [];
    const walk = nodes =>
      nodes.forEach(n => {
        const key = `${n.key}`;
        if (n.type === "rect" && key.includes("treemap-group-"))
          headers.push({
            key,
            box: [n.x, n.y, n.width, n.height],
            fill: n.paint.fill,
            opacity: n.paint.opacity ?? 1,
          });
        else if (n.type === "rect" && key.includes("treemap-"))
          tiles.push({
            key,
            y: n.y,
            opacity: n.paint.opacity ?? 1,
            group: n.datum.sector,
          });
        if (n.type === "text" && key.includes("group-"))
          names.push(n.lines.map(l => l.text).join(" "));
        if (n.children) walk(n.children);
      });
    walk(viz._paintedScene ? [viz._paintedScene.root] : viz._chartScene);
    const svg = document.querySelector("#viz svg.d3plus-render-svg");
    return {
      headers,
      names,
      tiles,
      depth: viz._drawDepth,
      history: viz._history.length,
      domHeaders: svg
        ? svg.querySelectorAll('[data-key*="treemap-group-"]').length
        : null,
      canvas: !!document.querySelector("#viz canvas"),
    };
  });
}

/** Client coordinates inside a header strip (`key` suffix), near its left. */
function headerPoint(page, id) {
  return page.evaluate(id => {
    const viz = window.__viz;
    const node = viz._chartScene.find(n => n.key === `treemap-group-${id}`);
    const surface = document
      .querySelector("#viz svg, #viz canvas")
      .getBoundingClientRect();
    const c = viz._chartTransform || {x: 0, y: 0};
    return [
      surface.left + c.x + node.x + 20,
      surface.top + c.y + node.y + node.height / 2,
    ];
  }, id);
}

for (const renderer of ["svg", "canvas"]) {
  it(`group headers (${renderer}): a strip per group, named, above its tiles`, async () => {
    const {page, close} = await chart(
      [
        ["data", market],
        ["groupBy", ["sector", "company"]],
        ["sum", "value"],
      ],
      renderer,
    );
    try {
      const s = await scene(page);
      assert.deepStrictEqual(s.names.sort(), ["Energy", "Health", "Tech"]);
      assert.strictEqual(s.headers.length, 3);
      for (const h of s.headers) {
        const group = h.key.split("treemap-group-")[1];
        const below = s.tiles.filter(t => t.group === group);
        assert.ok(below.length, `${group} has tiles`);
        assert.ok(
          below.every(t => t.y >= h.box[1] + h.box[3]),
          `${group}'s tiles sit below its strip`,
        );
      }
      if (renderer === "svg") assert.strictEqual(s.domHeaders, 3);
      else assert.ok(s.canvas, "painted on the canvas");
    } finally {
      await close();
    }
  });

  it(`group headers (${renderer}): hovering a strip highlights its group, clicking zooms in`, async () => {
    const {page, close} = await chart(
      [
        ["data", market],
        ["groupBy", ["sector", "company"]],
        ["sum", "value"],
      ],
      renderer,
    );
    try {
      const point = await headerPoint(page, "Tech");
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(120);
      const hovered = await scene(page);
      const tooltip = await page.evaluate(() =>
        document.querySelector(".d3plus-tooltip")?.innerText.trim(),
      );
      assert.match(tooltip, /^Tech\b/, "the tooltip names the group");
      assert.match(tooltip, /Share\s+54.9%/, "with the group's share");
      assert.match(tooltip, /Click to Expand/);
      assert.ok(
        hovered.tiles
          .filter(t => t.group === "Tech")
          .every(t => t.opacity === 1),
        "the group's tiles stay bright",
      );
      assert.ok(
        hovered.tiles.filter(t => t.group !== "Tech").every(t => t.opacity < 1),
        "the other groups' tiles dim",
      );
      const strip = key => hovered.headers.find(h => h.key.endsWith(key));
      assert.strictEqual(
        strip("Tech").opacity,
        1,
        "its own strip stays bright",
      );
      assert.ok(strip("Health").opacity < 1, "other strips dim");

      await page.mouse.click(point[0], point[1]);
      await settle(page);
      const zoomed = await scene(page);
      assert.strictEqual(zoomed.history, 1, "the zoom is on the history");
      assert.deepStrictEqual(zoomed.names, ["Tech"]);
      assert.deepStrictEqual(
        [...new Set(zoomed.tiles.map(t => t.group))],
        ["Tech"],
        "only the group's tiles are drawn",
      );
      assert.strictEqual(zoomed.depth, 1, "the drawn depth is unchanged");

      // The zoomed-in group is everything drawn: its strip no longer zooms.
      const again = await headerPoint(page, "Tech");
      await page.mouse.click(again[0], again[1]);
      await settle(page);
      assert.strictEqual((await scene(page)).history, 1);

      await page.evaluate(() =>
        document.querySelector("#viz .back-control").click(),
      );
      await settle(page);
      const back = await scene(page);
      assert.strictEqual(back.history, 0);
      assert.deepStrictEqual(back.names.sort(), ["Energy", "Health", "Tech"]);
    } finally {
      await close();
    }
  });
}

it("group headers: hovering a tile keeps its group's strip bright", async () => {
  const {page, close} = await chart([
    ["data", market],
    ["groupBy", ["sector", "company"]],
    ["sum", "value"],
  ]);
  try {
    await page.evaluate(() => {
      const viz = window.__viz;
      const tile = viz._chartScene.find(n => n.key === "treemap-Alpha");
      viz.schema.on.mouseenter(tile.datum, 0);
    });
    await page.waitForTimeout(80);
    const s = await scene(page);
    const strip = key => s.headers.find(h => h.key.endsWith(key));
    assert.strictEqual(strip("Tech").opacity, 1);
    assert.ok(strip("Energy").opacity < 1);
  } finally {
    await close();
  }
});

it("group headers: three levels nest a strip per level", async () => {
  const {page, close} = await chart([
    ["data", market],
    ["groupBy", ["sector", "industry", "company"]],
    ["sum", "value"],
  ]);
  try {
    const s = await scene(page);
    assert.deepStrictEqual(
      s.headers.map(h => h.key.split("treemap-group-")[1]).sort(),
      [
        "Energy",
        "Energy/Oil",
        "Health",
        "Health/Devices",
        "Health/Pharma",
        "Tech",
        "Tech/Chips",
        "Tech/Software",
      ],
    );
    const box = key => s.headers.find(h => h.key.endsWith(key)).box;
    const [, techY, , techH] = box("group-Tech");
    const [, softY] = box("Tech/Software");
    assert.ok(softY >= techY + techH, "the inner strip sits below the outer");
  } finally {
    await close();
  }
});

it("group headers: off with groupLabels(false), and with a single level", async () => {
  for (const calls of [
    [
      ["groupBy", ["sector", "company"]],
      ["groupLabels", false],
    ],
    [["groupBy", "company"]],
  ]) {
    const {page, close} = await chart([
      ["data", market],
      ["sum", "value"],
      ...calls,
    ]);
    try {
      const s = await scene(page);
      assert.strictEqual(s.headers.length, 0, JSON.stringify(calls));
      assert.strictEqual(s.tiles.length, market.length);
    } finally {
      await close();
    }
  }
});

it("group headers: a group too small for a strip gets none", async () => {
  const {page, close} = await chart([
    [
      "data",
      [
        ...market,
        {sector: "Tiny", industry: "Small", company: "Omega", value: 0.4},
        {sector: "Tiny", industry: "Small", company: "Psi", value: 0.3},
      ],
    ],
    ["groupBy", ["sector", "company"]],
    ["sum", "value"],
  ]);
  try {
    const s = await scene(page);
    assert.deepStrictEqual(s.names.sort(), ["Energy", "Health", "Tech"]);
    assert.strictEqual(s.tiles.filter(t => t.group === "Tiny").length, 2);
  } finally {
    await close();
  }
});

it("group headers: drill-down adds the clicked group's strip, Back removes it", async () => {
  const {page, close} = await chart([
    ["data", market],
    ["groupBy", ["sector", "company"]],
    ["depth", 0],
    ["sum", "value"],
  ]);
  try {
    const top = await scene(page);
    assert.strictEqual(top.headers.length, 0, "one level drawn: no strips");
    await page.evaluate(() => {
      const viz = window.__viz;
      const node = viz._chartScene.find(n => n.key === "treemap-Health");
      viz._routeSceneEvent({
        type: "click",
        point: [node.x + 2, node.y + 2],
        pick: {node, datum: node.datum, index: node.index},
        nativeEvent: {stopPropagation() {}},
      });
    });
    await settle(page);
    const drilled = await scene(page);
    assert.strictEqual(drilled.depth, 1);
    assert.deepStrictEqual(drilled.names, ["Health"]);
    await page.evaluate(() =>
      document.querySelector("#viz .back-control").click(),
    );
    await settle(page);
    const back = await scene(page);
    assert.strictEqual(back.depth, 0);
    assert.strictEqual(back.headers.length, 0);
  } finally {
    await close();
  }
});

it("group headers: a group holding the threshold bucket is named for the group", async () => {
  const {page, close} = await chart([
    ["data", market],
    ["groupBy", ["sector", "company"]],
    ["threshold", 0.1],
    ["sum", "value"],
  ]);
  try {
    const s = await scene(page);
    assert.deepStrictEqual(s.names.sort(), ["Energy", "Health", "Tech"]);
  } finally {
    await close();
  }
});

it("group headers: every small-multiple panel gets its own strips", async () => {
  const {page, close} = await chart([
    ["data", market.map((d, i) => ({...d, region: i % 2 ? "East" : "West"}))],
    ["groupBy", ["sector", "company"]],
    ["facet", "region"],
    ["sum", "value"],
  ]);
  try {
    const s = await scene(page);
    assert.ok(
      s.headers.length >= 5,
      `strips in both panels (${s.headers.length})`,
    );
    assert.strictEqual(
      new Set(s.headers.map(h => h.key)).size,
      s.headers.length,
      "keys stay unique across panels",
    );
    assert.strictEqual(s.names.filter(n => n === "Tech").length, 2);
  } finally {
    await close();
  }
});
