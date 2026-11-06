import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Trend line labels in a real browser, on both renderers: each fit gets a
    label along its line (its path sits just above the fitted stretch), the
    text reads left to right even on a reversed axis, SVG draws it in a
    <textPath>, and Canvas paints it without errors.
*/

const draw = ({renderer, config, reversed, log}) =>
  new Promise(resolve => {
    const data = [];
    for (const [id, a, b] of [
      ["Alpha", 2, 5],
      ["Beta", -1, 70],
    ])
      for (let x = 1; x <= 20; x++)
        data.push({
          id,
          k: `${id}${x}`,
          x,
          y: log ? Math.exp(0.15 * x) * (id === "Beta" ? 3 : 1) : a * x + b,
        });
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy(["id", "k"])
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Circle: {label: false}})
      .trendLine(log ? "exponential" : "linear")
      .trendLineConfig(config)
      .select("#viz");
    if (reversed) viz.xDomain([20, 0]);
    if (log) viz.yConfig({scale: "log"});
    viz.render(() => {
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      const labels = nodes.filter(
        n => n.type === "text" && `${n.key}`.startsWith("trend-label-"),
      );
      const points = d =>
        [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
      // The fitted line in pixels, from the same scales the marks use.
      const fits = viz._trendFits.map(f => ({
        id: f.id,
        line: f.samples
          .filter(s => !s.projected)
          .map(s => [viz._xFunc(s.x), viz._yFunc(s.y)]),
      }));
      resolve({
        labels: labels.map(n => ({
          key: n.key,
          text: n.lines[0].text,
          interactive: n.interactive,
          points: points(n.path.d),
        })),
        fits,
        textPaths: document.querySelectorAll("#viz textPath").length,
        canvas: !!document.querySelector("#viz canvas"),
      });
    });
  });

/** The distance from a point to a polyline. */
const distance = ([px, py], line) => {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const dx = bx - ax,
      dy = by - ay;
    const t = Math.max(
      0,
      Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)),
    );
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
};

const page = '<div id="viz" style="width:700px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`trend labels follow their lines (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      config: {label: true},
    });
    assert.deepStrictEqual(out.labels.map(l => l.text).sort(), [
      "Alpha",
      "Beta",
    ]);
    for (const label of out.labels) {
      assert.strictEqual(label.interactive, false);
      const fit = out.fits.find(f => label.key === `trend-label-${f.id}`);
      for (const p of label.points)
        assert.ok(
          Math.abs(distance(p, fit.line) - 3) < 1,
          `${label.key} sits 3px off its line (${distance(p, fit.line)})`,
        );
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], "reads left to right");
    }
    if (renderer === "svg") assert.strictEqual(out.textPaths, 2);
    else assert.ok(out.canvas);
  });

  it(`trend labels stay upright on a reversed axis, and curve on a log fit (${renderer})`, async () => {
    const reversed = await render(page, draw, {
      renderer,
      reversed: true,
      config: {label: "equation"},
    });
    assert.strictEqual(reversed.labels.length, 2);
    for (const label of reversed.labels) {
      assert.ok(label.text.includes("R²"), label.text);
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], "reads left to right");
    }
    const log = await render(page, draw, {
      renderer,
      log: true,
      config: {label: true},
    });
    for (const label of log.labels) {
      const fit = log.fits.find(f => label.key === `trend-label-${f.id}`);
      for (const p of label.points)
        assert.ok(Math.abs(distance(p, fit.line) - 3) < 1.5);
    }
  });
}

/** Two nearly coincident series and the scene boxes of their trend labels. */
const coincident = ({renderer, label, lineLabels}) =>
  new Promise(resolve => {
    const data = [];
    for (const [id, b] of [
      ["Alpha", 5],
      ["Gamma", 5.6],
    ])
      for (let x = 1; x <= 20; x++)
        data.push({id, k: `${id}${x}`, x, y: 2 * x + b + (x % 2) * 0.2});
    const viz = new window.d3plus[lineLabels ? "LinePlot" : "Plot"]()
      .data(data)
      .groupBy(lineLabels ? "id" : ["id", "k"])
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Circle: {label: false}})
      .trendLine(true)
      .trendLineConfig({label})
      .select("#viz");
    if (lineLabels) viz.lineLabels(lineLabels);
    viz.render(() => {
      const texts = [];
      const walk = (n, ox, oy) => {
        const x = ox + (n.transform?.x ?? 0),
          y = oy + (n.transform?.y ?? 0);
        const lineLabel = n.datum?.data?.shape === "Line";
        if (n.type === "text" && (n.path || lineLabel)) texts.push({n, ox, oy});
        (n.children || []).forEach(c => walk(c, x, y));
      };
      walk(viz.toScene().root, 0, 0);
      resolve(
        texts.map(({n, ox, oy}) => ({
          key: n.key,
          text: n.lines[0].text,
          // Each line's glyph box, turned with its node.
          boxes: window.d3plus
            .textLineBoxes([n])
            .map(b => ({...b, x: b.x + ox, y: b.y + oy})),
          end: n.path
            ? Math.max(
                ...[...n.path.d.matchAll(/[ML](-?[\d.]+),/g)].map(m => +m[1]),
              )
            : null,
        })),
      );
    });
  });

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
        Math.max(...pa) <= Math.min(...pb) ||
        Math.max(...pb) <= Math.min(...pa)
      )
        return false;
    }
  return true;
};

/** Asserts no two labels overlap (or, with `only`, none with a label it picks). */
const noOverlaps = (labels, only = () => true) => {
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++)
      if (only(labels[i]) || only(labels[j]))
        for (const a of labels[i].boxes)
          for (const b of labels[j].boxes)
            assert.ok(
              !overlap(a, b),
              `${labels[i].key} overlaps ${labels[j].key}`,
            );
};

for (const renderer of ["svg", "canvas"]) {
  it(`trend labels on nearly coincident fits don't overlap (${renderer})`, async () => {
    const equations = await render(page, coincident, {
      renderer,
      label: "equation",
    });
    assert.ok(equations.length >= 1, "at least one label");
    noOverlaps(equations);
    // Short names fit side by side: the second slides back from the end.
    const names = await render(page, coincident, {renderer, label: true});
    assert.strictEqual(names.length, 2, "both get a label");
    noOverlaps(names);
    const [first, second] = names;
    assert.ok(
      second.end < first.end - 20,
      `the second slides back (${second.end} vs ${first.end})`,
    );
  });

  it(`trend labels clear the line labels (${renderer})`, async () => {
    for (const lineLabels of ["along", true]) {
      const labels = await render(page, coincident, {
        renderer,
        label: true,
        lineLabels,
      });
      const trend = labels.filter(l => `${l.key}`.startsWith("trend-label-"));
      assert.ok(
        trend.length >= 1,
        `trend labels with lineLabels ${lineLabels}`,
      );
      assert.ok(labels.length > trend.length, "and line labels");
      noOverlaps(labels, l => trend.includes(l));
    }
  });
}
