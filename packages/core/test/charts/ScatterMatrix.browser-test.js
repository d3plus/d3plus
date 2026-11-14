import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    ScatterMatrix in a real browser, on both renderers: an n × n grid with a
    scatter plot in every off-diagonal panel and a histogram on the
    diagonal, panels lined up by row and column (each column sharing its x
    domain, each row its y), axis titles only along the left and bottom
    edges, hover linking an observation (or a bin's observations) across
    every panel, tooltips listing every dimension, and legend clicks
    recounting the histograms.
*/

/** Two groups of observations over three dimensions; `big` runs to the hundreds, so its labels are wider. */
const data = Array.from({length: 24}, (_, k) => ({
  group: k % 2 ? "odd" : "even",
  small: (k % 6) + 1 + (k % 2) * 0.5,
  big: 100 + ((k * 37) % 250),
  mid: 10 + ((k * 7) % 13),
}));

/** The keys of the panel's nodes that draw marks, by shape. */
const extract = viz => {
  const panels = viz._facetPanels || [];
  const titles = panel =>
    sceneNodes(panel.scene)
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" "));
  return {
    cells: panels.map(p => [p.cell.row, p.cell.column]),
    shapes: panels.map(p => {
      const nodes = sceneNodes(p.scene).filter(
        n => n.datum && !`${n.key}`.endsWith("::hit"),
      );
      return {
        bins: nodes.filter(n => n.shapeType === "MatrixBin").length,
        points: nodes.filter(n => n.shapeType === "Circle").length,
      };
    }),
    plots: panels.map(p => {
      const a = p.state._plotArea,
        t = p.chartTransform || {};
      return {
        left: (t.x || 0) + a.x,
        top: (t.y || 0) + a.y,
        width: a.width,
        height: a.height,
      };
    }),
    domains: panels.map(p => ({
      x: JSON.stringify(p.state._plotAxisDomains?.x ?? null),
      y: JSON.stringify(p.state._plotAxisDomains?.y ?? null),
    })),
    texts: panels.map(titles),
    legend: viz._legendClass.data().length,
    nan: sceneNodes(viz._chartScene || []).filter(n =>
      JSON.stringify({d: n.d, t: n.transform, p: n.points}).includes("null"),
    ).length,
  };
};

const src = config => `(lib, data) => new lib.ScatterMatrix()
  .data(data)
  .detectVisible(false)
  .config(${JSON.stringify(config)})`;

const dims = ["small", "big", "mid"];
const html = '<div id="viz" style="width:720px;height:640px"></div>';
const near = (a, b) => Math.abs(a - b) < 0.75;

for (const renderer of ["svg", "canvas"]) {
  it(`ScatterMatrix ${renderer} — scatter plots off the diagonal, histograms on it`, async () => {
    const out = await probeChart(
      src({dimensions: dims, groupBy: "group"}),
      extract,
      {data, renderer, html},
    );
    assert.strictEqual(out.cells.length, 9);
    out.cells.forEach(([row, column], k) => {
      assert.deepStrictEqual([row, column], [Math.floor(k / 3), k % 3]);
      const {bins, points} = out.shapes[k];
      if (row === column) {
        assert.ok(bins > 0, `panel ${k} draws a histogram`);
        assert.strictEqual(points, 0);
      } else {
        assert.strictEqual(points, data.length, `panel ${k} draws every row`);
        assert.strictEqual(bins, 0);
      }
    });
    assert.strictEqual(out.legend, 2, "a legend entry per group");
    assert.strictEqual(out.nan, 0);
  });

  it(`ScatterMatrix ${renderer} — rows and columns share their scales and line up`, async () => {
    const out = await probeChart(src({dimensions: dims}), extract, {
      data,
      renderer,
      html,
    });
    for (let k = 0; k < 9; k++) {
      const row = Math.floor(k / 3),
        column = k % 3;
      // The panel atop its column, and the one starting its row.
      const sameColumn = column,
        sameRow = row * 3;
      assert.ok(near(out.plots[k].left, out.plots[sameColumn].left));
      assert.ok(near(out.plots[k].width, out.plots[sameColumn].width));
      assert.ok(near(out.plots[k].top, out.plots[sameRow].top));
      assert.ok(near(out.plots[k].height, out.plots[sameRow].height));
      assert.strictEqual(out.domains[k].x, out.domains[sameColumn].x);
      assert.strictEqual(out.domains[k].y, out.domains[sameRow].y);
    }
    // Only the left column titles its y axis, and the bottom row its x axis.
    const has = (k, text) => out.texts[k].includes(text);
    assert.ok(has(0, "small") && has(3, "big") && has(6, "mid"));
    assert.ok(has(6, "small") && has(7, "big") && has(8, "mid"));
    assert.ok(!has(4, "big") && !has(1, "small"));
    assert.strictEqual(out.legend, 0, "no groups, no legend");
  });

  it(`ScatterMatrix ${renderer} — hovering links an observation, and a bar its bin, across panels`, async () => {
    const out = await probeChart(
      src({dimensions: dims, groupBy: "group"}),
      viz => {
        const panels = viz._facetPanels;
        const datums = panels.flatMap(p =>
          sceneNodes(p.scene)
            .filter(n => n.datum && !`${n.key}`.endsWith("::hit"))
            .map(n => ({datum: n.datum, shape: n.shapeType})),
        );
        const lit = () =>
          datums.filter((d, i) => viz.hover()(d.datum, i)).map(d => d.shape);
        const point = datums.find(d => d.shape === "Circle").datum;
        viz.schema.on["mousemove.shape"](point, 0, point, new MouseEvent("x"));
        const byPoint = lit();
        const bar = datums.find(d => d.shape === "MatrixBin").datum;
        viz.schema.on["mousemove.shape"](bar, 0, bar, new MouseEvent("x"));
        const byBar = lit();
        return {byPoint, byBar};
      },
      {data, renderer, html},
    );
    assert.deepStrictEqual(
      out.byPoint,
      Array(6).fill("Circle"),
      "the observation in every off-diagonal panel",
    );
    assert.strictEqual(out.byBar.filter(s => s === "MatrixBin").length, 1);
    assert.ok(out.byBar.filter(s => s === "Circle").length >= 6);
  });

  it(`ScatterMatrix ${renderer} — tooltips list every dimension, or a bin's count`, async () => {
    const out = await probeChart(
      src({dimensions: dims, groupBy: "group"}),
      viz => {
        const tip = viz.schema.tooltipConfig;
        const nodes = viz._facetPanels.flatMap(p => sceneNodes(p.scene));
        const point = nodes.find(n => n.shapeType === "Circle" && n.datum);
        const bar = nodes.find(n => n.shapeType === "MatrixBin" && n.datum);
        return {
          point: [tip.title(point.datum, 0), tip.tbody(point.datum, 0)],
          bar: [tip.title(bar.datum, 0), tip.tbody(bar.datum, 0)],
        };
      },
      {data, renderer, html},
    );
    assert.ok(["even", "odd"].includes(out.point[0]));
    assert.deepStrictEqual(
      out.point[1].map(r => r[0]),
      dims,
    );
    assert.match(out.bar[0], /^small: [\d.]+ – [\d.]+$/);
    assert.ok(["even", "odd"].includes(out.bar[1][0][0]));
  });

  it(`ScatterMatrix ${renderer} — a hidden group leaves the histograms`, async () => {
    const out = await probeChart(
      src({dimensions: dims, groupBy: "group"}),
      viz =>
        new Promise(resolve => {
          const groups = () =>
            new Set(
              viz._facetPanels.flatMap(p =>
                sceneNodes(p.scene)
                  .filter(n => n.shapeType === "MatrixBin" && n.datum)
                  .map(n => (n.datum.data || n.datum).group),
              ),
            );
          const before = [...groups()];
          viz._hidden = data
            .map((d, k) => (d.group === "odd" ? `Row ${k + 1}` : null))
            .filter(Boolean);
          viz.render(() => resolve({before, after: [...groups()]}));
        }),
      {data, renderer, html},
    );
    assert.deepStrictEqual(out.before.sort(), ["even", "odd"]);
    assert.deepStrictEqual(out.after, ["even"]);
  });
}
