import {it} from "vitest";
import {pathTextBoxes, samplePath} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `lineLabels: "along"` in a real browser, on both renderers: each series'
    name follows its own curved line, labels never overlap, text reads left
    to right on a reversed axis, and the plot keeps no room past the lines
    for end labels.
*/

const draw = ({renderer, lineLabels, reversed}) =>
  new Promise(resolve => {
    const names = ["United States", "Brazil", "Germany", "India"];
    const data = [];
    names.forEach((id, k) => {
      for (let year = 2000; year <= 2024; year++) {
        const t = year - 2000;
        data.push({
          id,
          year,
          value: 30 + k * 18 + 8 * Math.sin(t / (3 + k) + k) + t * (k - 1.5),
        });
      }
    });
    const viz = new window.d3plus.LinePlot()
      .data(data)
      .groupBy("id")
      .x("year")
      .y("value")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Line: {curve: "monotoneX"}})
      .lineLabels(lineLabels)
      .select("#viz");
    if (reversed) viz.xDomain([2024, 2000]);
    viz.render(() => {
      const nodes = [];
      const walk = (n, ox, oy) => {
        const x = ox + (n.transform?.x ?? 0),
          y = oy + (n.transform?.y ?? 0);
        nodes.push({n, x, y});
        (n.children || []).forEach(c => walk(c, x, y));
      };
      walk(viz.toScene().root, 0, 0);
      const labels = nodes.filter(
        ({n}) => n.type === "text" && `${n.key}`.includes("line-label-along"),
      );
      const lines = nodes.filter(
        ({n}) =>
          n.type === "path" &&
          n.shapeType === "Line" &&
          !`${n.key}`.endsWith("::hit"),
      );
      resolve({
        labels: labels.map(({n, x, y}) => ({
          key: n.key,
          text: n.lines[0].text,
          interactive: n.interactive,
          points: samplePath(n.path.d).points.map(([px, py]) => [
            px + x,
            py + y,
          ]),
          boxes: pathTextBoxes(n).map(b => ({...b, x: b.x + x, y: b.y + y})),
        })),
        lines: lines.map(({n, x, y}) => ({
          key: n.key,
          points: samplePath(n.d).points.map(([px, py]) => [px + x, py + y]),
        })),
        xRangeEnd: Math.max(...viz._xAxis._getRange()),
        width: viz.schema.width,
        textPaths: document.querySelectorAll("#viz textPath").length,
      });
    });
  });

const near = ([px, py], points) =>
  Math.min(...points.map(([x, y]) => Math.hypot(px - x, py - y)));

/** Whether two turned boxes overlap (separating axis test). */
const overlap = (a, b) => {
  const corners = r => {
    const rad = (r.angle * Math.PI) / 180;
    const c = Math.cos(rad),
      s = Math.sin(rad);
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => [
      r.x + (u * r.width * c) / 2 - (v * r.height * s) / 2,
      r.y + (u * r.width * s) / 2 + (v * r.height * c) / 2,
    ]);
  };
  const ca = corners(a),
    cb = corners(b);
  for (const poly of [ca, cb])
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % 4];
      const axis = [y2 - y1, x1 - x2];
      const proj = pts => pts.map(([x, y]) => x * axis[0] + y * axis[1]);
      const pa = proj(ca),
        pb = proj(cb);
      if (
        Math.max(...pa) < Math.min(...pb) ||
        Math.max(...pb) < Math.min(...pa)
      )
        return false;
    }
  return true;
};

const page = '<div id="viz" style="width:800px;height:420px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`along labels follow their curved lines without overlapping (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, lineLabels: "along"});
    assert.ok(out.labels.length >= 3, `${out.labels.length} labels`);
    for (const label of out.labels) {
      assert.strictEqual(label.interactive, false);
      const line = out.lines.find(
        l => label.key === `line-label-along-${l.key}`,
      );
      assert.ok(line, `${label.key} has its line`);
      for (const p of label.points)
        assert.ok(
          near(p, line.points) < 5,
          `${label.text} follows its line (${near(p, line.points)})`,
        );
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], "reads left to right");
    }
    for (let i = 0; i < out.labels.length; i++)
      for (let j = i + 1; j < out.labels.length; j++)
        for (const a of out.labels[i].boxes)
          for (const b of out.labels[j].boxes)
            assert.ok(
              !overlap(a, b),
              `${out.labels[i].text} and ${out.labels[j].text} overlap`,
            );
    if (renderer === "svg")
      assert.strictEqual(out.textPaths, out.labels.length);
  });

  it(`along labels read upright on a reversed axis and need no side room (${renderer})`, async () => {
    const reversed = await render(page, draw, {
      renderer,
      lineLabels: "along",
      reversed: true,
    });
    assert.ok(reversed.labels.length >= 3);
    for (const label of reversed.labels) {
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], `${label.text} reads left to right`);
    }
    const along = await render(page, draw, {renderer, lineLabels: "along"});
    const end = await render(page, draw, {renderer, lineLabels: true});
    const none = await render(page, draw, {renderer, lineLabels: false});
    assert.strictEqual(along.xRangeEnd, none.xRangeEnd, "no room claimed");
    assert.ok(end.xRangeEnd < along.xRangeEnd, "end labels claim room");
  });
}
