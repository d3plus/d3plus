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
  const walk = n => {
    const key = String(n.key);
    const node = key.match(/^sankey-Rect-(.+)$/);
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
  return {nodes, paths, clicks: window.__clicks};
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

/**
    Three sources over five targets, with wide gaps: the source column has
    room to move in, the target column is full.
*/
const roomy = {
  links: [
    {source: "s1", target: "m1", value: 1},
    {source: "s1", target: "m2", value: 1},
    {source: "s2", target: "m3", value: 1},
    {source: "s3", target: "m4", value: 1},
    {source: "s3", target: "m5", value: 1},
  ],
  nodePadding: 40,
};

/** Whether `ids` (one column) sit apart by at least `gap`, inside 0 → `bottom`. */
function apart(nodes, ids, gap, bottom) {
  const col = ids.map(id => nodes[id]).sort((a, b) => a.y - b.y);
  return (
    col[0].y >= -0.5 &&
    col[col.length - 1].y + col[col.length - 1].height <= bottom + 0.5 &&
    col.every(
      (n, i) => !i || n.y >= col[i - 1].y + col[i - 1].height + gap - 0.5,
    )
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`a dragged node pushes its column's other nodes aside, its links follow, and the column stays put (${renderer})`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [JSON.stringify(roomy), renderer]);
      await painted(page);
      const bottom = await page.evaluate(
        () => window.__viz.ctx.sankeyCtx.height,
      );
      const before = await page.evaluate(laidOut);
      const {s1, s2, s3} = before.nodes;
      assert.ok(s1.y < s2.y && s2.y < s3.y, "s1, s2, s3 top to bottom");
      // Far enough that s1 reaches s2 and pushes it 10px down.
      const reach = s2.y - s1.y - s1.height - 40;
      await drag(page, "s1", reach + 10);
      const after = await page.evaluate(laidOut);
      const sources = ["s1", "s2", "s3"];
      assert.ok(apart(after.nodes, sources, 40, bottom), "no overlap");
      assert.ok(Math.abs(after.nodes.s1.y - s1.y - reach - 10) < 0.5);
      assert.ok(Math.abs(after.nodes.s2.y - s2.y - 10) < 0.5, "pushed s2");
      assert.strictEqual(after.nodes.s3.y, s3.y, "s3 out of the way");
      assert.strictEqual(after.nodes.s1.x, s1.x, "same column");
      for (const id of ["m1", "m2", "m3", "m4", "m5"])
        assert.strictEqual(after.nodes[id].y, before.nodes[id].y, id);
      assert.notStrictEqual(
        after.paths["sankey-link-s1-m1"],
        before.paths["sankey-link-s1-m1"],
        "its links follow",
      );
      assert.strictEqual(after.clicks, 0, "the drag doesn't click");

      // Dragged past the others' middles, s1 takes the bottom, pushing them up.
      await drag(page, "s1", 1000);
      const passed = await page.evaluate(laidOut);
      assert.ok(passed.nodes.s3.y < passed.nodes.s1.y, "order changed");
      assert.ok(apart(passed.nodes, sources, 40, bottom));

      // A full column only reorders.
      await drag(page, "m1", 30);
      const full = await page.evaluate(laidOut);
      assert.ok(apart(full.nodes, ["m1", "m2", "m3", "m4", "m5"], 39, bottom));

      await page.evaluate(redraw);
      await painted(page);
      assert.deepStrictEqual(
        (await page.evaluate(laidOut)).nodes,
        full.nodes,
        "stays through a redraw",
      );
      await page.evaluate(redraw, JSON.stringify(roomy.links.slice()));
      await painted(page);
      assert.deepStrictEqual(
        (await page.evaluate(laidOut)).nodes,
        before.nodes,
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
