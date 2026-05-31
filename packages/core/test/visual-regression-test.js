import assert from "assert";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {closeBrowser, render} from "./playwright.js";

/**
    Visual-regression safety net. Each chart renders in real Chromium (via
    the shared `render` helper) and we extract a structural fingerprint —
    every rendered shape's rounded bounding box (relative to the chart SVG)
    plus fill/stroke, in document order, alongside text content and per-tag
    counts. The fingerprint is compared against a committed JSON baseline.

    This snapshots the *rendered geometry*, not pixels: pixel diffs are
    fragile across machines/fonts and store binary blobs, whereas rounded
    bounding boxes catch real layout/emit regressions and diff cleanly in
    git. It is the tripwire that makes the pipeline-purity refactors safe —
    if shape geometry shifts, a baseline mismatch fails loudly.

    Baselines are environment-generated (Chromium layout + the host's
    default fonts). Regenerate intended changes with:

      UPDATE_SNAPSHOTS=1 npx mocha test/visual-regression-test.js
*/

const here = path.dirname(fileURLToPath(import.meta.url));
const snapDir = path.join(here, "snapshots", "visual");
const UPDATE = ["1", "true"].includes(process.env.UPDATE_SNAPSHOTS || "");

after(async () => {
  await closeBrowser();
});

// Each entry: [name, builderSrc]. The builder returns an UN-rendered,
// UN-selected viz; the in-page routine adds `.duration(0).select(...)` and
// renders it, so geometry is final (no mid-transition values).
const charts = [
  ["bar-chart", `lib => new lib.BarChart()
    .groupBy("group")
    .data([
      {group: "Alpha", x: "Q1", y: 35}, {group: "Alpha", x: "Q2", y: 50},
      {group: "Alpha", x: "Q3", y: 25}, {group: "Alpha", x: "Q4", y: 40},
      {group: "Beta",  x: "Q1", y: 20}, {group: "Beta",  x: "Q2", y: 30},
      {group: "Beta",  x: "Q3", y: 45}, {group: "Beta",  x: "Q4", y: 35},
    ]).x("x").y("y")`],
  ["line-plot", `lib => new lib.LinePlot()
    .groupBy("group")
    .data([
      {group: "S1", x: 1, y: 10}, {group: "S1", x: 2, y: 22}, {group: "S1", x: 3, y: 15},
      {group: "S1", x: 4, y: 28}, {group: "S1", x: 5, y: 35},
      {group: "S2", x: 1, y: 25}, {group: "S2", x: 2, y: 18}, {group: "S2", x: 3, y: 32},
      {group: "S2", x: 4, y: 26}, {group: "S2", x: 5, y: 38},
    ]).x("x").y("y")`],
  ["stacked-area", `lib => new lib.StackedArea()
    .groupBy("group")
    .data([
      {group: "A", x: 1, y: 10}, {group: "A", x: 2, y: 20}, {group: "A", x: 3, y: 15},
      {group: "A", x: 4, y: 25}, {group: "A", x: 5, y: 30},
      {group: "B", x: 1, y: 5},  {group: "B", x: 2, y: 12}, {group: "B", x: 3, y: 18},
      {group: "B", x: 4, y: 14}, {group: "B", x: 5, y: 20},
    ]).x("x").y("y")`],
  ["box-whisker", `lib => new lib.BoxWhisker()
    .groupBy("group")
    .data([
      {group: "A", x: "A", y: 10}, {group: "A", x: "A", y: 15}, {group: "A", x: "A", y: 20},
      {group: "A", x: "A", y: 25}, {group: "A", x: "A", y: 30}, {group: "A", x: "A", y: 35},
      {group: "B", x: "B", y: 12}, {group: "B", x: "B", y: 18}, {group: "B", x: "B", y: 24},
      {group: "B", x: "B", y: 28}, {group: "B", x: "B", y: 38}, {group: "B", x: "B", y: 45},
    ]).x("x").y("y")`],
  ["pie", `lib => new lib.Pie().data([
      {id: "Alpha", value: 30}, {id: "Beta", value: 22}, {id: "Gamma", value: 18},
      {id: "Delta", value: 15}, {id: "Epsilon", value: 10}, {id: "Zeta", value: 5},
    ])`],
  ["donut", `lib => new lib.Donut().data([
      {id: "Alpha", value: 30}, {id: "Beta", value: 22}, {id: "Gamma", value: 18},
      {id: "Delta", value: 15}, {id: "Epsilon", value: 10}, {id: "Zeta", value: 5},
    ])`],
  ["treemap", `lib => new lib.Treemap()
    .groupBy(["group", "id"])
    .data([
      {group: "Tech", id: "Alpha", value: 30}, {group: "Tech", id: "Beta", value: 25},
      {group: "Tech", id: "Gamma", value: 18}, {group: "Tech", id: "Delta", value: 12},
      {group: "Health", id: "Epsilon", value: 22}, {group: "Health", id: "Zeta", value: 16},
      {group: "Health", id: "Eta", value: 10}, {group: "Energy", id: "Theta", value: 14},
      {group: "Energy", id: "Iota", value: 8},
    ]).sum("value")`],
  ["pack", `lib => new lib.Pack()
    .groupBy(["group", "id"])
    .data([
      {group: "A", id: "1", value: 10}, {group: "A", id: "2", value: 20},
      {group: "A", id: "3", value: 15}, {group: "A", id: "4", value: 25},
      {group: "B", id: "5", value: 8},  {group: "B", id: "6", value: 18},
      {group: "B", id: "7", value: 12}, {group: "B", id: "8", value: 22},
    ]).sum("value")`],
  ["matrix", `lib => new lib.Matrix().data([
      {row: "R1", column: "C1", value: 10}, {row: "R1", column: "C2", value: 25},
      {row: "R1", column: "C3", value: 15}, {row: "R2", column: "C1", value: 30},
      {row: "R2", column: "C2", value: 20}, {row: "R2", column: "C3", value: 5},
      {row: "R3", column: "C1", value: 18}, {row: "R3", column: "C2", value: 12},
      {row: "R3", column: "C3", value: 28},
    ])`],
  ["tree", `lib => new lib.Tree()
    .groupBy(["parent", "id"])
    .data([
      {parent: "Group 1", id: "alpha"},
      {parent: "Group 1", id: "beta"},
      {parent: "Group 1", id: "gamma"},
      {parent: "Group 2", id: "delta"},
      {parent: "Group 2", id: "eta"},
    ])`],
  ["radar", `lib => new lib.Radar()
    .groupBy("id")
    .metric("axis")
    .value("number")
    .data([
      {id: "alpha", axis: "Central",    number: 170.992},
      {id: "alpha", axis: "Kirkdale",   number: 40},
      {id: "alpha", axis: "Kensington", number: 240},
      {id: "alpha", axis: "Everton",    number: 90},
      {id: "alpha", axis: "Picton",     number: 160},
      {id: "alpha", axis: "Riverside",  number: 30},
      {id: "beta",  axis: "Central",    number: 320},
      {id: "beta",  axis: "Kirkdale",   number: 97.5},
      {id: "beta",  axis: "Kensington", number: 40},
      {id: "beta",  axis: "Everton",    number: 110},
      {id: "beta",  axis: "Picton",     number: 40},
      {id: "beta",  axis: "Riverside",  number: 110},
    ])`],
  ["bump-chart", `lib => new lib.BumpChart()
    .groupBy("fruit")
    .discrete("x")
    .x("year")
    .y("rank")
    .data([
      {fruit: "apple",  year: 1, rank: 1}, {fruit: "apple",  year: 2, rank: 2}, {fruit: "apple",  year: 3, rank: 1},
      {fruit: "banana", year: 1, rank: 2}, {fruit: "banana", year: 2, rank: 4}, {fruit: "banana", year: 3, rank: 3},
      {fruit: "cherry", year: 1, rank: 4}, {fruit: "cherry", year: 2, rank: 3}, {fruit: "cherry", year: 3, rank: 2},
      {fruit: "orange", year: 1, rank: 3}, {fruit: "orange", year: 2, rank: 1}, {fruit: "orange", year: 3, rank: 4},
    ])`],
  ["sankey", `lib => new lib.Sankey()
    .links([
      {source: "alpha", target: "beta"},
      {source: "alpha", target: "gamma"},
      {source: "beta",  target: "delta"},
      {source: "beta",  target: "epsilon"},
      {source: "zeta",  target: "gamma"},
      {source: "theta", target: "gamma"},
      {source: "eta",   target: "gamma"},
    ])`],
  ["rings", `lib => new lib.Rings()
    .center("alpha")
    .links([
      {source: "alpha", target: "beta"},
      {source: "alpha", target: "gamma"},
      {source: "beta",  target: "delta"},
      {source: "beta",  target: "epsilon"},
      {source: "zeta",  target: "gamma"},
      {source: "theta", target: "gamma"},
      {source: "eta",   target: "gamma"},
    ])`],
  // Inline topojson (two squares) keeps the map fully offline — no remote
  // topojson/tile fetches — so the fingerprint stays deterministic in CI.
  ["geomap", `lib => new lib.Geomap()
    .groupBy("geo")
    .colorScale("value")
    .tiles(false)
    .ocean("transparent")
    .topojson({
      type: "Topology",
      objects: {geo: {type: "GeometryCollection", geometries: [
        {type: "Polygon", id: "a", arcs: [[0]]},
        {type: "Polygon", id: "b", arcs: [[1]]},
      ]}},
      arcs: [
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
        [[20, 0], [20, 10], [30, 10], [30, 0], [20, 0]],
      ],
    })
    .data([
      {geo: "a", value: 10},
      {geo: "b", value: 20},
    ])`],
];

// Runs in-page: build + render the chart, then walk the rendered SVG and
// return a structural fingerprint. Self-contained — no closure over the
// test module (page.evaluate serializes this function).
const fingerprintFn = builderSrc =>
  new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-new-func
      const build = new Function("lib", `return (${builderSrc})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const svg = document.querySelector("#viz svg");
          if (!svg) return reject(new Error("no chart svg rendered"));
          const svgBox = svg.getBoundingClientRect();
          const r = n => Math.round(n);
          const shapeTags = new Set([
            "rect", "circle", "ellipse", "line", "path", "polygon", "polyline", "image",
          ]);
          const counts = {};
          const shapes = [];
          const texts = [];
          for (const el of svg.querySelectorAll("*")) {
            const tag = el.tagName.toLowerCase();
            // Skip definition-only geometry (clip paths, gradients, patterns).
            if (el.closest("defs") || el.closest("clipPath")) continue;
            if (tag === "text") {
              counts.text = (counts.text || 0) + 1;
              const content = (el.textContent || "").trim();
              if (content) {
                texts.push({
                  s: content,
                  a: el.getAttribute("text-anchor") || "",
                });
              }
              continue;
            }
            if (!shapeTags.has(tag)) continue;
            const b = el.getBoundingClientRect();
            // Zero-area defs/markers occasionally slip through; keep them so
            // their disappearance is still caught, but normalize NaN.
            counts[tag] = (counts[tag] || 0) + 1;
            shapes.push({
              t: tag,
              x: r(b.left - svgBox.left),
              y: r(b.top - svgBox.top),
              w: r(b.width),
              h: r(b.height),
              f: el.getAttribute("fill") || "",
              s: el.getAttribute("stroke") || "",
            });
          }
          resolve({counts, shapes, texts});
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

const body =
  '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';

function compare(name, actual) {
  const file = path.join(snapDir, `${name}.json`);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATE) {
    fs.mkdirSync(snapDir, {recursive: true});
    fs.writeFileSync(file, serialized);
    return;
  }
  assert.ok(
    fs.existsSync(file),
    `no baseline for "${name}" — generate with UPDATE_SNAPSHOTS=1`,
  );
  const expected = fs.readFileSync(file, "utf8");
  assert.strictEqual(
    serialized,
    expected,
    `visual snapshot mismatch for "${name}". If intended, regenerate with UPDATE_SNAPSHOTS=1.`,
  );
}

for (const [name, builderSrc] of charts) {
  it(`visual snapshot: ${name}`, async function () {
    this.timeout(60000);
    const fp = await render(body, fingerprintFn, builderSrc);
    assert.ok(fp.shapes.length > 0, `${name} rendered at least one shape`);
    compare(name, fp);
  });
}
