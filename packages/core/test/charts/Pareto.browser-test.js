/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Pareto in real Chromium: bars sorted largest first, the cumulative-share
    line on a 0–100% secondary axis, the dashed 80% line, horizontal bars, a
    threshold bucket drawn last, small multiples, tooltips, and the Canvas
    backend.
*/

const defects = [
  {cause: "Scratches", count: 30},
  {cause: "Cracks", count: 50},
  {cause: "Dents", count: 15},
  {cause: "Smudges", count: 5},
];

/** Renders a Pareto into #viz, reads its scene, and optionally hovers a bar. */
const probe = ([data, config, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Pareto()
      .data(data)
      .groupBy("cause")
      .x("cause")
      .y("count")
      .duration(0)
      .detectVisible(false)
      .config(config)
      .select("#viz");
    viz.render(() => {
      const host = document.querySelector("#viz");
      const svg = host.querySelector("svg.d3plus-render-svg");
      const nodes = sceneNodes(viz._chartScene || []);
      // A rect's center, and its bottom; a circle's center.
      const at = n => ({
        key: n.key,
        x: (n.transform?.x ?? 0) + (n.x ?? 0) + (n.width ?? 0) / 2,
        y: (n.transform?.y ?? 0) + (n.y ?? 0) + (n.height ?? 0),
        width: n.width,
        height: n.height,
      });
      const bars = nodes
        .filter(n => n.shapeType === "Bar" && !`${n.key}`.endsWith("::hit"))
        .map(at);
      const points = nodes
        .filter(n => /Cumulative Share_/.test(`${n.key}`))
        .map(n => ({
          ...at(n),
          category: `${n.key}`.split("Cumulative Share_")[1],
        }));
      const lines = nodes.filter(n => `${n.key}`.endsWith("Cumulative Share"));
      const reference = nodes
        .filter(n => /annotation-back-\d+-line$/.test(`${n.key}`))
        .map(n => ({points: n.points, dash: n.paint.strokeDasharray}));
      const referenceLabels = nodes
        .filter(n => /annotation-back-\d+-label$/.test(`${n.key}`))
        .map(n => n.lines.map(l => l.text).join(" "));
      const texts = svg
        ? Array.from(svg.querySelectorAll("text")).map(t => t.textContent)
        : [];
      const nan = nodes.filter(n =>
        JSON.stringify({d: n.d, t: n.transform, p: n.points}).includes("null"),
      ).length;
      const out = {
        canvas: !!host.querySelector("canvas.d3plus-render-canvas"),
        bars,
        points,
        lineKeys: lines.map(n => n.key),
        lineStroke: lines[0]?.paint.stroke,
        reference,
        referenceLabels,
        texts,
        nan,
      };
      if (!hover || !svg) return resolve(out);
      const target = svg.querySelector(`[data-key$='${hover}']`);
      const b = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: (b.left + b.right) / 2,
          clientY: (b.top + b.bottom) / 2,
          bubbles: true,
        }),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          out.tooltip = tip
            ? {
                title:
                  tip.querySelector(".d3plus-tooltip-title")?.textContent ?? "",
                rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
                  Array.from(tr.querySelectorAll("td")).map(
                    td => td.textContent,
                  ),
                ),
              }
            : null;
          resolve(out);
        }, 50),
      );
    });
  });

const body =
  '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
const order = (list, axis) =>
  list
    .slice()
    .sort((a, b) => a[axis] - b[axis])
    .map(d => d.category ?? d.key);

it("Pareto sorts its bars largest first and draws the running share on y2", async function () {
  const out = await render(body, probe, [defects, {}]);
  assert.strictEqual(out.nan, 0, "no unplottable coordinates");
  assert.deepStrictEqual(
    order(out.bars, "x"),
    ["Cracks_Cracks", "Scratches_Scratches", "Dents_Dents", "Smudges_Smudges"],
    "bars run largest to smallest",
  );
  assert.deepStrictEqual(out.lineKeys, ["Cumulative Share"], "one line");
  assert.strictEqual(out.lineStroke, "#495057", "drawn in the text color");
  assert.deepStrictEqual(order(out.points, "x"), [
    "Cracks",
    "Scratches",
    "Dents",
    "Smudges",
  ]);
  // The line's points sit over their bars, at their running share of a 0–100% axis.
  const base = out.bars[0].y;
  const top = out.points.find(p => p.category === "Smudges").y;
  const shares = {Cracks: 0.5, Scratches: 0.8, Dents: 0.95, Smudges: 1};
  out.points.forEach(p => {
    const bar = out.bars.find(b => b.key === `${p.category}_${p.category}`);
    assert.ok(near(p.x, bar.x), `${p.category} point over its bar`);
    assert.ok(
      near(p.y, base - shares[p.category] * (base - top)),
      `${p.category} at ${shares[p.category] * 100}%`,
    );
  });
  assert.ok(
    out.texts.includes("Cumulative Share"),
    "the share axis is titled after the line",
  );
  assert.ok(out.texts.includes("100%") && out.texts.includes("0%"));
});

it("Pareto marks 80% with a dashed, labeled reference line on the share axis", async function () {
  const out = await render(body, probe, [defects, {}]);
  assert.strictEqual(out.reference.length, 1);
  const [line] = out.reference;
  assert.deepStrictEqual(line.dash, [4, 4], "dashed");
  const base = out.bars[0].y;
  const top = out.points.find(p => p.category === "Smudges").y;
  assert.ok(near(line.points[0][1], base - 0.8 * (base - top)), "at 80%");
  const scratches = out.points.find(p => p.category === "Scratches");
  assert.ok(near(line.points[0][1], scratches.y), "where the line reaches 80%");
  assert.deepStrictEqual(out.referenceLabels, ["80%"]);

  const moved = await render(body, probe, [
    defects,
    {paretoThreshold: 0.5, paretoThresholdConfig: {label: "Half"}},
  ]);
  const cracks = moved.points.find(p => p.category === "Cracks");
  assert.ok(near(moved.reference[0].points[0][1], cracks.y), "moves to 50%");
  assert.deepStrictEqual(moved.referenceLabels, ["Half"]);

  const off = await render(body, probe, [defects, {paretoThreshold: false}]);
  assert.strictEqual(
    off.reference.length,
    0,
    "paretoThreshold(false) hides it",
  );
});

/** Renders a Pareto and reads its bars' and reference label's boxes, in chart space. */
const boxes = ([data, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Pareto()
      .data(data)
      .groupBy("cause")
      .x("cause")
      .y("count")
      .duration(0)
      .detectVisible(false)
      .config(config)
      .select("#viz");
    viz.render(() => {
      const bars = [];
      const labels = [];
      const walk = (node, ox, oy) => {
        const x = ox + (node.transform?.x || 0),
          y = oy + (node.transform?.y || 0);
        const key = `${node.key}`;
        if (node.shapeType === "Bar" && !key.endsWith("::hit"))
          bars.push({
            x0: x + node.x,
            x1: x + node.x + node.width,
            y0: y + node.y,
            y1: y + node.y + node.height,
          });
        if (/annotation-back-\d+-label$/.test(key)) {
          const width = Math.max(...node.lines.map(l => l.width));
          const left = node.font.anchor === "end" ? x - width : x;
          labels.push({
            x0: left,
            x1: left + width,
            y0: y,
            y1: y + node.lines.length * node.font.size,
          });
        }
        (node.children || []).forEach(c => walk(c, x, y));
      };
      viz._chartScene.forEach(n => walk(n, 0, 0));
      resolve({
        bars,
        labels,
        canvas: !!document.querySelector("#viz canvas"),
      });
    });
  });

const overlap = (a, b) =>
  a.x0 < b.x1 - 0.5 &&
  b.x0 < a.x1 - 0.5 &&
  a.y0 < b.y1 - 0.5 &&
  b.y0 < a.y1 - 0.5;

for (const renderer of ["svg", "canvas"])
  for (const horizontal of [false, true])
    it(`Pareto (${renderer}, ${horizontal ? "horizontal" : "upright"}): the 80% label sits clear of the bars`, async function () {
      const config = horizontal
        ? {discrete: "y", x: "count", y: "cause", renderer}
        : {renderer};
      const out = await render(body, boxes, [defects, config]);
      assert.strictEqual(out.canvas, renderer === "canvas");
      assert.strictEqual(out.labels.length, 1);
      assert.ok(
        out.bars.every(b => !overlap(b, out.labels[0])),
        `label ${JSON.stringify(out.labels[0])} clear of ${JSON.stringify(out.bars)}`,
      );
    });

it("Pareto's tooltips show the value, its share, and the running share", async function () {
  const out = await render(body, probe, [defects, {}, "Scratches_Scratches"]);
  assert.deepStrictEqual(out.tooltip, {
    title: "Scratches",
    rows: [
      ["count", "30"],
      ["Share", "30%"],
      ["Cumulative Share", "80%"],
    ],
  });
});

it("Pareto lays horizontal bars out top-down, with the line on x2", async function () {
  const out = await render(body, probe, [
    defects,
    {discrete: "y", x: "count", y: "cause"},
  ]);
  assert.strictEqual(out.nan, 0);
  assert.deepStrictEqual(
    order(out.points, "y"),
    ["Cracks", "Scratches", "Dents", "Smudges"],
    "largest at the top",
  );
  const xs = order(out.points, "x");
  assert.deepStrictEqual(
    xs,
    ["Cracks", "Scratches", "Dents", "Smudges"],
    "the running share grows to the right",
  );
  const [line] = out.reference;
  assert.ok(near(line.points[0][0], line.points[1][0]), "a vertical line");
  const scratches = out.points.find(p => p.category === "Scratches");
  assert.ok(near(line.points[0][0], scratches.x), "at 80% across the top");
});

it("Pareto draws a threshold bucket as the last bar, however large", async function () {
  const rows = [
    {cause: "Cracks", count: 60},
    {cause: "Scratches", count: 12},
    ...["C", "D", "E", "F"].map(cause => ({cause, count: 7})),
  ];
  const out = await render(body, probe, [
    rows,
    {threshold: 0.1, thresholdName: "Other"},
  ]);
  assert.strictEqual(out.bars.length, 3, "four small causes fold into one");
  const [first, second, last] = out.bars.slice().sort((a, b) => a.x - b.x);
  assert.ok(first.height > last.height && last.height > second.height);
  assert.ok(out.texts.includes("Other < 10%"), "labeled by thresholdName");
  const points = out.points.slice().sort((a, b) => a.x - b.x);
  assert.ok(near(points[2].x, last.x), "and closes the line");
  assert.ok(near(points[2].y, Math.min(...points.map(p => p.y))), "at 100%");
});

it("Pareto sorts stacked series by their category's total", async function () {
  const rows = defects.flatMap(d => [
    {...d, shift: "Day", count: d.count * 0.75},
    {...d, shift: "Night", count: d.count * 0.25},
  ]);
  const out = await render(body, probe, [
    rows,
    {groupBy: "shift", stacked: true},
  ]);
  assert.strictEqual(out.nan, 0);
  assert.strictEqual(out.bars.length, 8, "a segment per shift and cause");
  assert.deepStrictEqual(order(out.points, "x"), [
    "Cracks",
    "Scratches",
    "Dents",
    "Smudges",
  ]);
  const cracks = out.bars.filter(b => /_Cracks$/.test(b.key));
  assert.ok(
    cracks.every(b =>
      near(b.x, out.points.find(p => p.category === "Cracks").x),
    ),
    "the stack sits under its point",
  );
  assert.ok(out.texts.includes("Day"), "the legend lists the series");
});

it("Pareto draws one line per small-multiples panel", async function () {
  const rows = ["North", "South"].flatMap((region, r) =>
    defects.map((d, i) => ({
      ...d,
      region,
      count: r ? [5, 10, 40, 20][i] : d.count,
    })),
  );
  const out = await render(body, probe, [rows, {facet: "region"}]);
  assert.strictEqual(out.nan, 0);
  assert.strictEqual(out.lineKeys.length, 2, "a line per panel");
  assert.strictEqual(out.points.length, 8);
  assert.strictEqual(out.reference.length, 2, "an 80% line per panel");
});

it("Pareto's shared-scale panels share one category order", async function () {
  const rows = ["North", "South"].flatMap((region, r) =>
    defects.map((d, i) => ({
      ...d,
      region,
      count: r ? [5, 10, 80, 20][i] : d.count,
    })),
  );
  const out = await render(body, probe, [
    rows,
    {facet: "region", facetConfig: {scales: "shared"}},
  ]);
  assert.strictEqual(out.nan, 0);
  ["North", "South"].forEach(region => {
    const points = out.points.filter(p => p.key.startsWith(`facet-${region}`));
    const byX = points.slice().sort((a, b) => a.x - b.x);
    assert.deepStrictEqual(
      byX.map(p => p.category),
      ["Dents", "Cracks", "Scratches", "Smudges"],
      `${region} follows the pooled order`,
    );
    byX
      .slice(1)
      .forEach((p, i) =>
        assert.ok(p.y <= byX[i].y + 0.5, `${region}'s line only climbs`),
      );
  });
});

/** Renders a Pareto, hovers one of its bars, and reads each mark's fill and opacity. */
const paint = ([data, config, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Pareto()
      .data(data)
      .groupBy("cause")
      .x("cause")
      .y("count")
      .duration(0)
      .detectVisible(false)
      .config(config)
      .select("#viz");
    viz.render(() => {
      const read = () =>
        window.d3plus
          ? sceneNodes(viz.toScene().root || [])
              .filter(
                n =>
                  (n.shapeType === "Bar" ||
                    `${n.key}`.includes("Cumulative Share")) &&
                  !`${n.key}`.endsWith("::hit"),
              )
              .map(n => ({
                key: `${n.key}`,
                fill: n.paint.fill,
                opacity: n.paint.opacity ?? 1,
              }))
          : [];
      const legend = !!document.querySelector("[data-key='viz-legend'] text");
      const before = read();
      if (!hover) return resolve({before, legend});
      viz.hover(d => (d.data || d).cause === hover);
      requestAnimationFrame(() =>
        setTimeout(() => resolve({before, legend, after: read()}), 30),
      );
    });
  });

it("Pareto colors every bar alike, unless series split a category or color is set", async function () {
  const one = await render(body, paint, [defects, {}]);
  const fills = new Set(
    one.before.filter(n => !n.key.includes("Cumulative")).map(n => n.fill),
  );
  assert.deepStrictEqual([...fills], ["#4c6ef5"], "the palette's first color");
  assert.strictEqual(one.legend, false, "no legend of one color");
  const own = await render(body, paint, [defects, {color: "cause"}]);
  assert.strictEqual(
    new Set(
      own.before.filter(n => !n.key.includes("Cumulative")).map(n => n.fill),
    ).size,
    4,
    "a user color colors by its key",
  );
  const rows = defects.flatMap(d => [
    {...d, shift: "Day", count: d.count / 2},
    {...d, shift: "Night", count: d.count / 2},
  ]);
  const series = await render(body, paint, [
    rows,
    {groupBy: "shift", stacked: true},
  ]);
  assert.strictEqual(
    new Set(
      series.before.filter(n => !n.key.includes("Cumulative")).map(n => n.fill),
    ).size,
    2,
    "series inside a category color by series",
  );
  assert.strictEqual(series.legend, true);
});

it("Pareto keeps its line bright while a bar is hovered", async function () {
  const out = await render(body, paint, [defects, {}, "Scratches"]);
  const opacity = key => out.after.find(n => n.key === key).opacity;
  assert.strictEqual(opacity("Scratches_Scratches"), 1, "the hovered bar");
  assert.ok(opacity("Cracks_Cracks") < 1, "other bars dim");
  assert.strictEqual(opacity("Cumulative Share"), 1, "the line stays bright");
  assert.strictEqual(
    opacity("Cumulative Share_Scratches"),
    1,
    "with the hovered category's point",
  );
  assert.ok(
    opacity("Cumulative Share_Cracks") < 1,
    "which stands out from the other points",
  );
});

it("Pareto renders on Canvas", async function () {
  const out = await render(body, probe, [defects, {renderer: "canvas"}]);
  assert.strictEqual(out.canvas, true);
  assert.strictEqual(out.bars.length, 4);
  assert.deepStrictEqual(out.lineKeys, ["Cumulative Share"]);
  assert.strictEqual(out.points.length, 4);
  assert.deepStrictEqual(out.referenceLabels, ["80%"]);
});

it("Pareto's line points show their category's total and running share", async function () {
  const out = await render(body, probe, [
    defects,
    {},
    "Cumulative Share_Cracks",
  ]);
  assert.deepStrictEqual(out.tooltip, {
    title: "Cracks",
    rows: [
      ["count", "50"],
      ["Share", "50%"],
      ["Cumulative Share", "50%"],
    ],
  });
});
