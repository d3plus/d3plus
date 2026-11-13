import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot's category bands clear a secondary axis across from the primary
    one by the same padding they keep from the primary axis: horizontal bars
    under an x2 axis on top, and upright bars beside a y2 axis on the right,
    on both renderers.
*/

const rows = [
  {id: "A", v: 30},
  {id: "B", v: 20},
  {id: "C", v: 10},
  {id: "L", cat: "A", s: 0.2},
  {id: "L", cat: "B", s: 0.6},
  {id: "L", cat: "C", s: 1},
];

/** Renders a BarChart with a secondary axis and reads its bars and axis lines in chart space. */
const probe = ([horizontal, renderer]) =>
  new Promise(resolve => {
    const category = d => d.cat || d.id;
    const viz = new window.d3plus.BarChart()
      .data(rows)
      .groupBy("id")
      .shape(d => (d.s !== undefined ? "Line" : "Bar"))
      .renderer(renderer)
      .duration(0)
      .detectVisible(false)
      .select("#viz");
    if (horizontal) viz.discrete("y").y(category).x("v").x2("s");
    else viz.x(category).y("v").y2("s");
    viz.render(() => {
      const bars = [];
      const lines = {};
      const walk = (node, ox, oy, axis) => {
        const x = ox + (node.transform?.x || 0),
          y = oy + (node.transform?.y || 0);
        const key = `${node.key}`;
        const own = /^plot-(x|x2|y|y2)-axis$/.exec(key);
        const name = own ? own[1] : axis;
        if (node.shapeType === "Bar" && !key.endsWith("::hit"))
          bars.push({
            x0: x + node.x,
            x1: x + node.x + node.width,
            y0: y + node.y,
            y1: y + node.y + node.height,
          });
        if (name && key === "bar" && node.points)
          lines[name] = node.points.map(([px, py]) => [px + x, py + y]);
        (node.children || []).forEach(c => walk(c, x, y, name));
      };
      viz._chartScene.forEach(n => walk(n, 0, 0, undefined));
      resolve({
        canvas: !!document.querySelector("#viz canvas"),
        bars,
        lines,
      });
    });
  });

const body = '<div id="viz" style="width:600px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`BarChart (${renderer}): horizontal bands clear an x2 axis as they clear the x axis`, async function () {
    const out = await render(body, probe, [true, renderer]);
    assert.strictEqual(out.canvas, renderer === "canvas");
    const top = Math.min(...out.bars.map(b => b.y0));
    const bottom = Math.max(...out.bars.map(b => b.y1));
    const x2Line = out.lines.x2[0][1];
    const xLine = out.lines.x[0][1];
    const above = top - x2Line,
      below = xLine - bottom;
    assert.ok(above > 0, `the top band sits below the x2 axis (${above})`);
    assert.ok(
      Math.abs(above - below) < 1,
      `the same padding on both sides (${above} vs ${below})`,
    );
  });

  it(`BarChart (${renderer}): upright bands clear a y2 axis as they clear the y axis`, async function () {
    const out = await render(body, probe, [false, renderer]);
    const left = Math.min(...out.bars.map(b => b.x0));
    const right = Math.max(...out.bars.map(b => b.x1));
    const before = left - out.lines.y[0][0],
      after = out.lines.y2[0][0] - right;
    assert.ok(after > 0, `the last band stops before the y2 axis (${after})`);
    assert.ok(
      Math.abs(before - after) < 1,
      `the same padding on both sides (${before} vs ${after})`,
    );
  });
}
