import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    ArcDiagram's Rect nodes in Chromium, on SVG and Canvas: each draws as
    `shapeConfig`'s Rect `width` and `height`, the boxes keep apart along
    the line, arcs leave from the top of each box, and the labels hang
    below the tallest one.
*/

const nodes = [
  {id: "Alpha", w: 80, h: 20},
  {id: "Bravo", w: 30, h: 50},
  {id: "Charlie", w: 60, h: 20},
  {id: "Delta", w: 30, h: 20},
];
const links = [
  {source: "Alpha", target: "Bravo"},
  {source: "Bravo", target: "Charlie"},
  {source: "Alpha", target: "Delta"},
];

const box = "<div id='viz' style='width:640px;height:400px'></div>";

/** Runs in the page: draws the chart and reads back each node's rect, each arc's ends, and where each label hangs. */
const draw = ([renderer, data]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.ArcDiagram()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .nodes(data.nodes)
      .links(data.links)
      .shape("Rect")
      .shapeConfig({Rect: {width: d => d.w, height: d => d.h}});
    viz.render(() => {
      const rects = {};
      const arcs = [];
      const walk = n => {
        const key = String(n.key);
        if (n.type === "rect" && key.startsWith("arc-node-"))
          rects[n.datum.id] = {
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
          };
        if (
          n.type === "path" &&
          key.startsWith("arc-link-") &&
          !key.endsWith("::hit")
        )
          arcs.push({
            d: n.d,
            source: n.datum.source.id,
            target: n.datum.target.id,
          });
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const drawn = document.querySelectorAll("#viz rect, #viz canvas").length;
      const labels = viz.ctx.arcCtx.labels.map(l => l.y);
      resolve({rects, arcs, labels, drawn});
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`ArcDiagram ${renderer}: Rect nodes draw at their width and height, apart, with arcs and labels clear of them`, async () => {
    const {rects, arcs, labels, drawn} = await render(box, draw, [
      renderer,
      {nodes, links},
    ]);
    assert.ok(drawn > 0);
    for (const {id, w, h} of nodes) {
      const r = rects[id];
      assert.ok(r, `a rect for ${id}`);
      assert.strictEqual(r.width, w, `${id} width`);
      assert.strictEqual(r.height, h, `${id} height`);
    }
    // Along the line, each box ends before the next begins.
    const order = Object.values(rects).sort((a, b) => a.x - b.x);
    order
      .slice(1)
      .forEach((r, i) =>
        assert.ok(r.x > order[i].x + order[i].width, `box ${i + 1} overlaps`),
      );
    // Every arc starts and ends on the top edge of its nodes' boxes.
    const center = r => r.y + r.height / 2;
    for (const arc of arcs) {
      const m = arc.d.match(/^M([\d.-]+),([\d.-]+).*?([\d.-]+),([\d.-]+)$/);
      assert.ok(m, arc.d);
      const [, , y1, , y2] = m.map(Number);
      const s = rects[arc.source];
      const t = rects[arc.target];
      assert.ok(Math.abs(y1 - s.y) < 1, `${arc.source}: ${y1} vs ${s.y}`);
      assert.ok(Math.abs(y2 - t.y) < 1, `${arc.target}: ${y2} vs ${t.y}`);
      assert.ok(Math.abs(center(s) - center(t)) < 0.01, "one line");
    }
    // The labels hang below the tallest box.
    const bottom = Math.max(...Object.values(rects).map(r => r.y + r.height));
    assert.strictEqual(labels.length, nodes.length);
    for (const y of labels) assert.ok(y > bottom, `label at ${y}`);
  });
}
