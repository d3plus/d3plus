import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    #438: a BarChart's `xConfig.labelRotation` angle slants the category
    labels below the plot, each meeting its bar's tick with the end of its
    text nearest the axis (its end at -45, its start at 30), on both
    backends.
*/

const names = [
  "Agriculture, Forestry and Fishing",
  "Mining and Quarrying",
  "Manufacturing",
  "Electricity and Gas Supply",
  "Water Supply and Sewerage",
  "Construction",
  "Wholesale and Retail Trade",
  "Transportation and Storage",
];

const probe = ([names, renderer, rotation]) =>
  new Promise(resolve => {
    const data = names.map((id, i) => ({id, value: 20 + ((i * 37) % 90)}));
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("id")
      .x("id")
      .y("value")
      .legend(false)
      .shapeConfig({Bar: {label: false}})
      .xConfig({labelRotation: rotation})
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const axis = viz._xAxis;
      const out = [];
      const walk = (nodes, o) =>
        nodes.forEach(n => {
          const t = n.transform || {};
          const next = {x: o.x + (t.x || 0), y: o.y + (t.y || 0)};
          if (n.type === "text" && names.includes(n.lines?.[0]?.text))
            out.push({
              text: n.lines[0].text,
              rotate: t.rotate || 0,
              anchor: t.rotateAnchor,
              x: next.x,
              y: next.y,
              width: n.width,
              tick: axis._getPosition(n.lines[0].text),
            });
          if (n.children) walk(n.children, next);
        });
      const root = viz._sceneRenderer._scene.root;
      const xAxis = [];
      const find = nodes =>
        nodes.forEach(n => {
          if (n.key === "plot-x-axis") xAxis.push(n);
          else if (n.children) find(n.children);
        });
      find(root.children);
      const t = xAxis[0].transform || {};
      walk(xAxis[0].children, {x: t.x || 0, y: t.y || 0});
      const svg = document.querySelector("#viz svg");
      resolve({
        labels: out,
        plotBottom: viz._plotArea.y + viz._plotArea.height,
        labelSpace: axis._labelSpace,
        rotated: axis._labelRotation,
        domRotations:
          renderer === "svg"
            ? Array.from(svg.querySelectorAll("text"))
                .filter(t => names.includes(t.textContent))
                .map(t => t.getAttribute("transform") || "")
            : null,
      });
    });
  });

const run = (renderer, rotation) =>
  render(
    '<div id="viz" style="width:700px;height:420px;font-family:sans-serif"></div>',
    probe,
    [names, renderer, rotation],
  );

for (const [renderer, angle] of [
  ["svg", -45],
  ["canvas", -45],
  ["svg", 30],
  ["canvas", 30],
]) {
  it(`[${renderer}] xConfig labelRotation ${angle} slants the labels from their ticks`, async () => {
    const r = await run(renderer, angle);
    assert.strictEqual(r.rotated, true);
    assert.ok(r.labels.length >= 4, `labels drawn: ${r.labels.length}`);
    const t = (angle * Math.PI) / 180;
    // The box rotates about its center: where the end of its text nearest
    // the axis lands (its right end rising, its left end falling).
    const ends = r.labels.map(label => {
      const [ax, ay] = label.anchor;
      const half = ((angle < 0 ? 1 : -1) * label.width) / 2;
      return {
        x: label.x + ax + half * Math.cos(t),
        y: label.y + ay + half * Math.sin(t),
      };
    });
    r.labels.forEach((label, i) => {
      assert.strictEqual(label.rotate, angle, label.text);
      assert.ok(
        Math.abs(ends[i].x - label.tick) < 5,
        `${label.text} meets its tick (${ends[i].x} vs ${label.tick})`,
      );
      assert.ok(ends[i].y > r.plotBottom, `${label.text} hangs below the plot`);
    });
    const ys = ends.map(e => e.y);
    assert.ok(
      Math.max(...ys) - Math.min(...ys) < 1,
      `every label ends the same distance below the axis: ${ys}`,
    );
    if (r.domRotations)
      assert.ok(
        r.domRotations.every(d => d.includes(`rotate(${angle},`)),
        `svg text rotates ${angle}: ${r.domRotations[0]}`,
      );
  });
}

/** The rotated corners of every category label a horizontal BarChart paints. */
const verticalProbe = ([names, renderer, rotation]) =>
  new Promise(resolve => {
    const data = names.map((id, i) => ({id, value: 20 + ((i * 37) % 90)}));
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("id")
      .discrete("y")
      .y("id")
      .x("value")
      .legend(false)
      .shapeConfig({Bar: {label: false}})
      .yConfig({labelRotation: rotation})
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const labels = [];
      const walk = (nodes, o) =>
        nodes.forEach(n => {
          const t = n.transform || {};
          const at = {x: o.x + (t.x || 0), y: o.y + (t.y || 0)};
          if (n.type === "text" && names.includes(n.lines?.[0]?.text)) {
            const [ax, ay] = t.rotateAnchor || [0, 0];
            const r = ((t.rotate || 0) * Math.PI) / 180;
            const corners = [
              [0, 0],
              [n.width, 0],
              [n.width, n.height],
              [0, n.height],
            ].map(([px, py]) => ({
              x: at.x + ax + (px - ax) * Math.cos(r) - (py - ay) * Math.sin(r),
              y: at.y + ay + (px - ax) * Math.sin(r) + (py - ay) * Math.cos(r),
            }));
            labels.push({text: n.lines[0].text, rotate: t.rotate, corners});
          }
          if (n.children) walk(n.children, at);
        });
      walk(viz._sceneRenderer._scene.root.children, {x: 0, y: 0});
      resolve({labels, height: viz.schema.height});
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a horizontal BarChart's slanted y labels stay inside the chart`, async () => {
    const r = await render(
      '<div id="viz" style="width:700px;height:420px;font-family:sans-serif"></div>',
      verticalProbe,
      [names, renderer, -30],
    );
    assert.strictEqual(r.labels.length, names.length);
    assert.ok(r.labels.every(l => l.rotate === -30));
    const lowest = Math.max(...r.labels.flatMap(l => l.corners.map(c => c.y)));
    // The box's bottom edge holds its padding (5px), past the glyphs.
    assert.ok(
      lowest <= r.height + 5,
      `the lowest label ends inside the chart (${lowest} <= ${r.height})`,
    );
  });
}
