import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";

/**
    Label layering (bug #30) on both renderers: each label paints together
    with its own shape, so a shape drawn later covers the labels of the
    shapes beneath it; an `"auto"` label a later shape covers moves beside
    its circle when there's room, and otherwise stays inside, partly covered.
*/

/**
    Two overlapping bubbles: Alpha, the largest (drawn first, behind), and
    Beta, a smaller one drawn over Alpha's center. Two small corner points
    spread the axes.
*/
const bubbles = (alpha = "Alpha") => [
  {id: alpha, x: 50, y: 50, value: 100},
  {id: "Beta", x: 48, y: 50, value: 25},
  {id: "C", x: 0, y: 0, value: 4},
  {id: "D", x: 100, y: 100, value: 4},
];

/** The row a scene datum stands for. */
const rowOf = d => {
  let row = d;
  while (row && row.data && typeof row.data === "object") row = row.data;
  return row;
};

/**
    The painted leaves of a scene, in paint order (each group's children
    sorted stably by `z`, as both backends do), in surface space.
*/
function paintOrder(viz) {
  const out = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (n.children) {
      const kids = n.children.some(c => c.z !== undefined)
        ? [...n.children].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
        : n.children;
      kids.forEach(c => walk(c, nx, ny));
      return;
    }
    const row = rowOf(n.datum);
    out.push({
      type: n.type,
      key: String(n.key),
      id: row && row.id,
      text: n.type === "text" ? n.lines.map(l => l.text).join(" ") : null,
      x: nx + (n.cx || 0),
      y: ny + (n.cy || 0),
      r: n.r,
      width: n.width,
      height: n.height,
      interactive: n.interactive,
    });
  };
  walk(viz._paintedScene.root, 0, 0);
  return out;
}

/** The SVG renderer's elements, in document order, as `{type, id, text}`. */
function svgOrder() {
  return Array.from(document.querySelectorAll("#viz .d3plus-render-node"))
    .map(el => el.__data__)
    .filter(n => n && n.type !== "group")
    .map(n => ({
      type: n.type,
      id: rowOf(n.datum) && rowOf(n.datum).id,
      text: n.type === "text" ? n.lines.map(l => l.text).join(" ") : null,
    }));
}

/** Draws a 600 × 400 BubbleChart of `data`, configured by `extra`. */
const drawBubbles = (renderer, data, extra = {}, size = [600, 400]) =>
  render(
    `<div id="viz" style="width:${size[0]}px;height:${size[1]}px"></div>`,
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.BubbleChart()
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .size("value")
          .config(extra)
          .renderer(renderer)
          .width(size[0])
          .height(size[1])
          .duration(0)
          .legend(false)
          .select("#viz");
        viz.render(() =>
          resolve({
            painted: paintOrder(viz),
            dom: renderer === "svg" ? svgOrder() : [],
          }),
        );
      }),
  );

const circleOf = (nodes, id) =>
  nodes.find(
    n => n.type === "circle" && n.id === id && !n.key.endsWith("::hit"),
  );
const labelOf = (nodes, text) =>
  nodes.find(n => n.type === "text" && n.text === text);
const indexOf = (nodes, node) => nodes.indexOf(node);

/** Whether a box reaches more than half a pixel into a circle. */
const hits = (box, c) => {
  const dx = Math.max(box.x - c.x, 0, c.x - (box.x + box.width));
  const dy = Math.max(box.y - c.y, 0, c.y - (box.y + box.height));
  return Math.hypot(dx, dy) < c.r - 0.5;
};

/** A label too long to sit beside its circle anywhere in the chart. */
const LONG =
  "A label written out far too long to sit on one line beside its bubble anywhere in this chart";

for (const renderer of ["svg", "canvas"]) {
  describe(`label layering (${renderer})`, () => {
    it("a bubble drawn over another covers the label beneath it", async () => {
      const {painted, dom} = await drawBubbles(renderer, bubbles(), {
        labelPosition: "inside",
      });
      const alpha = circleOf(painted, "Alpha");
      const beta = circleOf(painted, "Beta");
      const label = labelOf(painted, "Alpha");
      assert.ok(alpha && beta && label, "both bubbles and Alpha's label draw");
      assert.ok(beta.r < alpha.r, "Beta is the smaller bubble");
      assert.ok(
        indexOf(painted, alpha) < indexOf(painted, label),
        "Alpha's label paints over Alpha",
      );
      assert.ok(
        indexOf(painted, label) < indexOf(painted, beta),
        "Beta paints over Alpha's label",
      );
      if (renderer === "svg") {
        const at = (type, id, text) =>
          dom.findIndex(
            n => n.type === type && n.id === id && (!text || n.text === text),
          );
        const domLabel = at("text", "Alpha", "Alpha");
        assert.ok(domLabel >= 0, "Alpha's label is in the DOM");
        assert.ok(at("circle", "Alpha") < domLabel);
        assert.ok(domLabel < at("circle", "Beta"));
      }
    });

    it('an "auto" label a later bubble covers moves beside its bubble', async () => {
      const {painted} = await drawBubbles(renderer, bubbles());
      const alpha = circleOf(painted, "Alpha");
      const label = labelOf(painted, "Alpha");
      assert.ok(label, "Alpha is labeled");
      assert.strictEqual(label.interactive, false, "beside, not inside");
      assert.ok(!hits(label, alpha), "the label clears Alpha");
      // Beta, on top, keeps its own label inside.
      const beta = labelOf(painted, "Beta");
      assert.ok(beta && beta.interactive !== false, "Beta's label is inside");
    });

    it('an "auto" label with no room beside its bubble stays inside, partly covered', async () => {
      const {painted} = await drawBubbles(renderer, bubbles(LONG), {
        sizeMax: 110,
      });
      const alpha = circleOf(painted, LONG);
      const beta = circleOf(painted, "Beta");
      const label = labelOf(painted, LONG);
      assert.ok(label, "the long label still draws");
      assert.notStrictEqual(label.interactive, false, "inside its bubble");
      const cx = label.x + label.width / 2,
        cy = label.y + label.height / 2;
      assert.ok(Math.hypot(cx - alpha.x, cy - alpha.y) < alpha.r, "inside");
      assert.ok(
        indexOf(painted, label) < indexOf(painted, beta),
        "Beta covers part of it",
      );
    });
  });

  describe(`label layering (${renderer}): other charts`, () => {
    /** Paint order of a chart drawn by `build`, after one render. */
    const drawChart = build =>
      render(
        '<div id="viz" style="width:600px;height:400px"></div>',
        () =>
          new Promise(resolve => {
            const viz = build(window.d3plus)
              .labelPosition("inside")
              .renderer(renderer)
              .width(600)
              .height(400)
              .duration(0)
              .legend(false)
              .select("#viz");
            viz.render(() => resolve(paintOrder(viz)));
          }),
      );

    it("a Network node drawn over another covers that one's label", async () => {
      const painted = await drawChart(d3plus =>
        new d3plus.Network()
          .nodes([
            {id: "Alpha", x: 0, y: 0, value: 100},
            {id: "Beta", x: 0.1, y: 0, value: 40},
            {id: "C", x: 2, y: 2, value: 1},
          ])
          .links([])
          .size("value")
          .sizeMax(60),
      );
      const label = labelOf(painted, "Alpha");
      assert.ok(label, "Alpha is labeled");
      const at = indexOf(painted, label);
      assert.ok(indexOf(painted, circleOf(painted, "Alpha")) < at);
      assert.ok(at < indexOf(painted, circleOf(painted, "Beta")));
    });

    it("a Geomap point drawn over another covers that one's label", async () => {
      const painted = await drawChart(d3plus =>
        new d3plus.Geomap()
          .data([
            {id: "Alpha", point: [-71.5, 42.5], value: 100},
            {id: "Beta", point: [-71.45, 42.5], value: 40},
          ])
          .groupBy("id")
          .point(d => d.point)
          .pointSize(d => d.value)
          .pointSizeMax(60)
          .pointSizeMin(30)
          .tiles(false)
          .topojson({
            type: "Topology",
            objects: {
              land: {
                type: "GeometryCollection",
                geometries: [{type: "Polygon", arcs: [[0]], id: "land"}],
              },
            },
            arcs: [
              [
                [-74, 41],
                [-74, 44.5],
                [-69, 44.5],
                [-69, 41],
                [-74, 41],
              ],
            ],
          }),
      );
      const label = labelOf(painted, "Alpha");
      assert.ok(label, "Alpha is labeled");
      const at = indexOf(painted, label);
      assert.ok(indexOf(painted, circleOf(painted, "Alpha")) < at);
      assert.ok(at < indexOf(painted, circleOf(painted, "Beta")));
    });
  });

  it(`label layering (${renderer}): a hovered bubble rises with its label`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px"></div>',
    );
    try {
      const at = await page.evaluate(
        ([renderer, data]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.BubbleChart()
              .data(data)
              .groupBy("id")
              .x("x")
              .y("y")
              .size("value")
              .labelPosition("inside")
              .renderer(renderer)
              .duration(0)
              .legend(false)
              .select("#viz");
            window.__viz = viz;
            viz.render(() => {
              let alpha = null,
                label = null;
              const walk = (n, x, y) => {
                const t = n.transform || {};
                const nx = x + (t.x || 0),
                  ny = y + (t.y || 0);
                const id = n.datum && (n.datum.data || n.datum).id;
                if (n.type === "circle" && id === "Alpha" && !alpha)
                  alpha = {x: nx + (n.cx || 0), y: ny + (n.cy || 0), r: n.r};
                if (n.type === "text" && n.lines[0].text === "Alpha")
                  label = {x: nx + n.width / 2, y: ny + n.height / 2};
                (n.children || []).forEach(c => walk(c, nx, ny));
              };
              walk(viz._paintedScene.root, 0, 0);
              const host =
                document.querySelector("#viz svg") ||
                document.querySelector("#viz canvas");
              const box = host.getBoundingClientRect();
              resolve({
                // Alpha's right rim, clear of Beta (which sits to its left).
                rim: [box.left + alpha.x + alpha.r * 0.8, box.top + alpha.y],
                label: [box.left + label.x, box.top + label.y],
              });
            });
          }),
        [renderer, bubbles()],
      );
      // Over Alpha's covered label, the pointer finds Beta, painted on top.
      await page.mouse.move(at.label[0] - 4, at.label[1] - 4);
      await page.mouse.move(...at.label, {steps: 3});
      await page.waitForTimeout(150);
      const under = await page.evaluate(() =>
        window.__viz._hover
          ? ["Alpha", "Beta"].filter(id => window.__viz._hover({id}))
          : [],
      );
      if (renderer === "canvas")
        assert.deepStrictEqual(under, ["Beta"], "Beta takes the pointer");
      // Hovering Alpha raises it, and its label with it, over Beta.
      await page.mouse.move(...at.rim, {steps: 3});
      await page.waitForTimeout(150);
      const order = await page.evaluate(() => {
        const out = [];
        const walk = n => {
          if (n.children) {
            const kids = n.children.some(c => c.z !== undefined)
              ? [...n.children].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
              : n.children;
            kids.forEach(walk);
            return;
          }
          const id = n.datum && (n.datum.data || n.datum).id;
          if (String(n.key).endsWith("::hit")) return;
          if (n.type === "circle" || n.type === "text")
            out.push(`${n.type}:${id}`);
        };
        walk(window.__viz._paintedScene.root);
        return out;
      });
      const alpha = order.indexOf("circle:Alpha");
      assert.ok(alpha > order.indexOf("circle:Beta"), "Alpha rises over Beta");
      assert.strictEqual(
        order[alpha + 1],
        "text:Alpha",
        "its label rises with it",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
