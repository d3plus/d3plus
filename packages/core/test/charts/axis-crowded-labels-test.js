import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A point (discrete) axis with more labels than fit side by side used to
    drop every label: each was wrapped into the gap between ticks, came back
    empty once a single word ("2012") was wider than that gap, and so never
    collided with its neighbor to be thinned or rotated. Driven in real
    Chromium for text measurement.
*/

const probe = ([kind, first, last, width]) =>
  new Promise(resolve => {
    const data = [];
    ["A", "B"].forEach((id, s) => {
      for (let year = first; year <= last; year++) data.push({id, year, value: 10 + s * 5 + (year - first)});
    });
    document.querySelector("#viz").style.width = `${width}px`;
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .x("year")
      .y("value")
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const years = new Set(Array.from({length: last - first + 1}, (_, i) => `${first + i}`));
      const labels = Array.from(document.querySelectorAll("#viz text"))
        .filter(t => years.has(t.textContent))
        .map(t => {
          const b = t.getBoundingClientRect();
          return {text: t.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom};
        });
      resolve({labels, rotated: !!viz._xAxis._labelRotation});
    });
  });

const run = (kind, first, last, width = 600) =>
  render('<div id="viz" style="height:400px"></div>', probe, [kind, first, last, width]);

/** Whether any two label boxes overlap. */
const overlaps = labels => labels.some((a, i) => labels.slice(i + 1).some(b =>
  a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));

after(closeBrowser);

it("crowded point axis — keeps labels instead of dropping them all", async () => {
  for (const [first, last] of [[2012, 2029], [2000, 2029], [1950, 2029]]) {
    const r = await run("LinePlot", first, last);
    assert.ok(r.labels.length >= 2, `${last - first + 1} years: shows labels (${r.labels.length})`);
    assert.ok(!overlaps(r.labels), `${last - first + 1} years: labels don't overlap`);
  }
});

it("crowded point axis — bar charts too", async () => {
  const r = await run("BarChart", 2000, 2029);
  assert.ok(r.labels.length >= 2, `shows labels (${r.labels.length})`);
  assert.ok(!overlaps(r.labels), "labels don't overlap");
});

it("roomy point axis — every label still shows", async () => {
  const r = await run("LinePlot", 2012, 2020);
  assert.strictEqual(r.labels.length, 9);
  assert.strictEqual(r.rotated, false, "no rotation needed");
});

it("crowded point axis — a vertical axis thins labels instead of dropping them all", async () => {
  const r = await render('<div id="viz" style="width:500px;height:300px"></div>', () =>
    new Promise(resolve => {
      const data = [];
      for (let year = 2000; year <= 2029; year++) data.push({id: "A", year: `${year}`, value: year - 1990});
      const viz = new window.d3plus.BarChart()
        .data(data).groupBy("id").discrete("y").y("year").x("value").duration(0).select("#viz");
      viz.render(() => resolve(Array.from(document.querySelectorAll("#viz [data-key='plot-y-axis'] text")).map(t => {
        const b = t.getBoundingClientRect();
        return {text: t.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom};
      })));
    }));
  assert.ok(r.length >= 2 && r.length < 30, `shows some labels (${r.length})`);
  assert.ok(!overlaps(r), "labels don't overlap");
});
