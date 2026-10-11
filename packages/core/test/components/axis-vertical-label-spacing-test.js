import assert from "assert";
import {labelExtent} from "../../es/src/components/Axis/axisLayoutLabels.js";
import {render, closeBrowser} from "../playwright.js";

/**
    A vertical category axis used to hide every other label once its rows sat
    closer than a line height plus twice the label padding, though the labels
    had room: the overlap pass counted the padding twice (once inside the
    measured height, once as the gap). Labels are now spaced by their glyphs
    plus one padding, as on a horizontal axis. Driven in real Chromium for
    text measurement.
*/

const countries = [
  "Brazil", "Canada", "China", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Mexico", "Nigeria", "Russia", "South Africa", "United Kingdom", "United States",
];

const probe = ([names, height, renderer]) =>
  new Promise(resolve => {
    const el = document.querySelector("#viz");
    el.style.height = `${height}px`;
    const data = names.map((id, i) => ({group: "A", id, value: 10 + i * 3}));
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("group")
      .discrete("y")
      .y("id")
      .x("value")
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      // a Line tick shape lists each tick twice (both ends of its mark)
      const shown = [...new Set(viz._yAxis._tickShape._data.filter(d => d.text).map(d => d.text))];
      const boxes = Array.from(document.querySelectorAll("#viz [data-key='plot-y-axis'] text")).map(t => {
        const b = t.getBoundingClientRect();
        return {text: t.textContent, top: b.top, bottom: b.bottom};
      });
      resolve({shown, boxes});
    });
  });

const run = (n, height, renderer = "svg") =>
  render('<div id="viz" style="width:600px"></div>', probe, [countries.slice(0, n), height, renderer]);

/** Whether any two vertically stacked label boxes overlap. */
const overlaps = boxes => boxes.some((a, i) => boxes.slice(i + 1).some(b =>
  a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));

after(closeBrowser);

it("labelExtent — text along the axis spans its width", () => {
  const datum = {fP: 5, fS: 12, height: 22, lineHeight: 16.8, lines: ["Brazil"], rotate: false, width: 36};
  assert.strictEqual(labelExtent(datum, true), 36);
  assert.strictEqual(labelExtent({...datum, rotate: true}, false), 36);
});

it("labelExtent — text across the axis spans its glyphs, without padding or outer leading", () => {
  const datum = {fP: 5, fS: 12, height: 22, lineHeight: 16.8, lines: ["Brazil"], rotate: false, width: 36};
  assert.strictEqual(labelExtent(datum, false), 12);
  assert.strictEqual(labelExtent({...datum, rotate: true}, true), 12);
  const twoLines = {...datum, height: 39, lines: ["South", "Africa"]};
  assert.strictEqual(labelExtent(twoLines, false), 16.8 + 12);
});

it("labelExtent — a label with no lines takes no space", () => {
  assert.strictEqual(labelExtent({fP: 5, fS: 12, height: 0, lineHeight: 16.8, lines: [], width: 0}, false), 0);
});

it("vertical category axis — labels with room all show", async () => {
  for (const renderer of ["svg", "canvas"]) {
    for (const [n, height] of [[12, 400], [15, 400], [12, 300]]) {
      const r = await run(n, height, renderer);
      assert.strictEqual(r.shown.length, n, `${renderer} ${n} rows at ${height}px: ${r.shown.join(", ")}`);
      if (renderer === "svg") assert.ok(!overlaps(r.boxes), `${n} rows at ${height}px: labels don't overlap`);
    }
  }
});

it("vertical category axis — crowded labels still thin without overlapping", async () => {
  const r = await run(15, 220);
  assert.ok(r.shown.length >= 2 && r.shown.length < 15, `thins the labels (${r.shown.length})`);
  assert.ok(!overlaps(r.boxes), "labels don't overlap");
});
