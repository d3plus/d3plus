import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Dragging Sankey nodes, in Chromium on SVG and Canvas with a real mouse:
    a node moves up or down its column (never across), its links follow,
    the drag doesn't click, and the node stays where it is dropped through
    a redraw until the links change.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const links = [
  {source: "a", target: "c", value: 4},
  {source: "b", target: "c", value: 6},
  {source: "c", target: "d", value: 7},
  {source: "c", target: "e", value: 3},
];

/** Runs in the page: starts drawing a Sankey. */
const start = ([json, renderer]) => {
  window.__drawn = false;
  window.__clicks = 0;
  window.__viz = new window.d3plus.Sankey()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .value("value")
    .config(JSON.parse(json))
    .on("click.shape", () => window.__clicks++)
    .render(() => (window.__drawn = true));
  return true;
};

/** Runs in the page: redraws, with new `links` when given. */
const redraw = json => {
  window.__drawn = false;
  if (json) window.__viz.links(JSON.parse(json));
  window.__viz.render(() => (window.__drawn = true));
  return true;
};

async function painted(page) {
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__drawn)); i++)
    await page.waitForTimeout(16);
  assert.ok(await page.evaluate(() => window.__drawn), "drawn");
}

/** Runs in the page: each node's box (on screen and in the chart) and each link's path. */
const laidOut = () => {
  const viz = window.__viz;
  const surface =
    document.querySelector("#viz canvas") || document.querySelector("#viz svg");
  const rect = surface.getBoundingClientRect();
  const t = viz._chartTransform || {x: 0, y: 0};
  const nodes = {};
  const paths = {};
  const order = [];
  const walk = n => {
    const key = String(n.key);
    const node = key.match(/^sankey-Rect-(.+)$/);
    if (node) order.push(node[1]);
    if (node)
      nodes[node[1]] = {
        x: n.x,
        y: n.y,
        height: n.height,
        screen: [
          rect.left + t.x + n.x + n.width / 2,
          rect.top + t.y + n.y + n.height / 2,
        ],
      };
    if (
      /^sankey-link-/.test(key) &&
      n.type === "path" &&
      !key.endsWith("::hit")
    )
      paths[key] = n.d;
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  return {nodes, paths, order, clicks: window.__clicks};
};

async function drag(page, id, dy) {
  const [x, y] = (await page.evaluate(laidOut)).nodes[id].screen;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(x + i * 3, y + (dy * i) / 6);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(50);
}

for (const renderer of ["svg", "canvas"]) {
  it(`a dragged node moves along its column, its links follow, and it stays put (${renderer})`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [JSON.stringify({links}), renderer]);
      await painted(page);
      const before = await page.evaluate(laidOut);
      await drag(page, "a", 60);
      const after = await page.evaluate(laidOut);
      assert.ok(
        Math.abs(after.nodes.a.y - before.nodes.a.y - 60) < 0.5,
        `moved down: ${before.nodes.a.y} → ${after.nodes.a.y}`,
      );
      assert.strictEqual(after.nodes.a.x, before.nodes.a.x, "same column");
      assert.strictEqual(after.nodes.b.y, before.nodes.b.y, "others stay");
      assert.notStrictEqual(
        after.paths["sankey-link-a-c"],
        before.paths["sankey-link-a-c"],
        "its link follows",
      );
      assert.strictEqual(after.clicks, 0, "the drag doesn't click");
      assert.strictEqual(after.order.at(-1), "a", "drawn over the rest");

      // Dragged far past the edge, it stops at the bottom.
      await drag(page, "a", 1000);
      const edge = await page.evaluate(laidOut);
      const bottom = await page.evaluate(
        () => window.__viz.ctx.sankeyCtx.height,
      );
      assert.ok(edge.nodes.a.y + edge.nodes.a.height <= bottom + 0.5);

      await page.evaluate(redraw);
      await painted(page);
      assert.strictEqual(
        (await page.evaluate(laidOut)).nodes.a.y,
        edge.nodes.a.y,
        "stays through a redraw",
      );
      await page.evaluate(redraw, JSON.stringify(links.slice()));
      await painted(page);
      assert.strictEqual(
        (await page.evaluate(laidOut)).nodes.a.y,
        before.nodes.a.y,
        "new links lay it out afresh",
      );
    }));
}

it("nodeDrag: false leaves the nodes where the layout puts them", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      JSON.stringify({links, nodeDrag: false}),
      "svg",
    ]);
    await painted(page);
    const before = await page.evaluate(laidOut);
    await drag(page, "a", 60);
    assert.deepStrictEqual((await page.evaluate(laidOut)).nodes, before.nodes);
  }));
