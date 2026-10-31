import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A click on a Network's or ArcDiagram's node focuses it, and a click on
    the empty background clears the focus, the same on the SVG and Canvas
    renderers. A click outside the chart area (in its title's band) leaves
    the focus alone.
*/

const nodes = [
  {id: "alpha", x: 0, y: 0},
  {id: "beta", x: 100, y: 0},
  {id: "gamma", x: 50, y: 80},
];
const links = [
  {source: "alpha", target: "beta"},
  {source: "beta", target: "gamma"},
];

/** Draws the chart and returns each node's client center, and the chart area's client box. */
const draw = ([chart, renderer, data]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .nodes(data.nodes)
      .links(data.links)
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .legend(false)
      .title("A title above the chart")
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      const points = {};
      window.d3plus
        .focusTargets(viz._paintedScene.root.children)
        .filter(t => t.node.type === "circle")
        .forEach(t => {
          const row = t.node.datum.data || t.node.datum;
          points[row.id] = [box.left + t.center[0], box.top + t.center[1]];
        });
      resolve({
        points,
        area: {
          left: box.left + viz._margin.left,
          top: box.top + viz._margin.top,
        },
        top: box.top,
      });
    });
  });

const focus = page => page.evaluate(() => window.__viz._focus ?? null);

for (const renderer of ["svg", "canvas"]) {
  for (const chart of ["Network", "ArcDiagram"]) {
    it(`${chart} ${renderer}: a background click clears a node's focus`, async () => {
      const {page, errors, close} = await openPage(
        '<div id="viz" style="width:600px;height:400px;"></div>',
      );
      try {
        const {points, area, top} = await page.evaluate(draw, [
          chart,
          renderer,
          {nodes, links},
        ]);
        const [x, y] = points.gamma;
        await page.mouse.click(x, y);
        await page.waitForTimeout(700);
        assert.strictEqual(await focus(page), "gamma", "the node is focused");

        // The title's band, above the chart area.
        await page.mouse.click(x, top + 4);
        await page.waitForTimeout(100);
        assert.ok(area.top > top + 4, "the click lands above the chart area");
        assert.strictEqual(
          await focus(page),
          "gamma",
          "a click outside the chart area keeps the focus",
        );

        // The chart area's top-left corner, away from every node and link.
        await page.mouse.click(area.left + 4, area.top + 4);
        await page.waitForTimeout(700);
        assert.strictEqual(await focus(page), null, "the focus clears");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }
}
