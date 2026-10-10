import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Histogram's `filter` selects raw observation rows before they are binned,
    so it can test the value and any other field of a row, and it composes
    with groupBy, facet panels, and the time filter.
*/

let out;

before(async function () {
  this.timeout(60000);
  out = await render("", () => {
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    // Each drawn bar as `x0-x1:count`, prefixed with its series when grouped.
    const bars = (scene, grouped) => {
      const list = [];
      const walk = nodes => (nodes || []).forEach(n => {
        if (n.type === "group") walk(n.children);
        else if (n.shapeType === "Bar" && n.datum && !String(n.key).endsWith("::hit")) {
          const b = unwrap(n.datum);
          list.push(`${grouped ? `${b.g}:` : ""}${b.x0}-${b.x1}:${b.count}`);
        }
      });
      walk(scene);
      return list;
    };
    const draw = (setup, grouped) =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const seen = [];
        const viz = new window.d3plus.Histogram().select(el).duration(0).width(800).height(500);
        setup(viz, seen);
        viz.render(() => resolve({
          panels: viz._facetPanels
            ? Object.fromEntries(viz._facetPanels.map(p => [p.key, bars(p.scene, grouped)]))
            : {chart: bars(viz._chartScene, grouped)},
          ticks: viz._timelineClass ? (viz._timelineClass.ticks() || []).map(d => d.getFullYear()) : [],
          binned: seen.some(d => "count" in d),
        }));
      });
    // Records every row the filter is called with.
    const recording = (seen, fn) => (d, i) => {
      seen.push(d);
      return fn(d, i);
    };

    const rows = [
      ...[1, 2, 3, 4, 12].map((v, i) => ({f: "A", g: i % 2 ? "x" : "y", v})),
      ...[25, 26, 27, 35].map((v, i) => ({f: "B", g: i % 2 ? "x" : "y", v})),
    ];
    const timeRows = [
      ...[1, 2, 13].map(v => ({year: 2020, f: "A", v})),
      ...[15, 16, 4].map(v => ({year: 2021, f: "A", v})),
      ...[25, 6].map(v => ({year: 2021, f: "B", v})),
    ];
    return (async () => ({
      value: await draw((viz, seen) =>
        viz.data(rows).value("v").binWidth(10).filter(recording(seen, d => d.v > 10))),
      field: await draw((viz, seen) =>
        viz.data(rows).value("v").binWidth(10).filter(recording(seen, d => d.f === "B"))),
      grouped: await draw((viz, seen) =>
        viz.data(rows).value("v").binWidth(10).groupBy("g").filter(recording(seen, d => d.v < 30)), true),
      facet: await draw((viz, seen) =>
        viz.data(rows).value("v").binWidth(10).facet("f").facetConfig({scales: "independent"})
          .filter(recording(seen, d => d.v > 2))),
      facetDropped: await draw((viz, seen) =>
        viz.data(rows).value("v").binWidth(10).facet("f").filter(recording(seen, d => d.f === "A"))),
      time: await draw((viz, seen) =>
        viz.data(timeRows).value("v").binWidth(10).time("year").filter(recording(seen, d => d.v > 5))),
      facetTime: await draw((viz, seen) =>
        viz.data(timeRows).value("v").binWidth(10).time("year").timeFilter(d => d.year === 2020)
          .facet("f").facetConfig({scales: "independent"}).filter(recording(seen, d => d.v > 5))),
    }))();
  });
});

after(async () => {
  await closeBrowser();
});

it("Histogram filter selects raw rows by their value before binning", () => {
  assert.deepStrictEqual(out.value.panels.chart, ["10-20:1", "20-30:3", "30-40:1"]);
  assert.strictEqual(out.value.binned, false, "the filter only sees raw rows");
});

it("Histogram filter selects raw rows by any field before binning", () => {
  assert.deepStrictEqual(out.field.panels.chart, ["20-30:3", "30-40:1"]);
  assert.strictEqual(out.field.binned, false, "the filter only sees raw rows");
});

it("Histogram filter composes with groupBy", () => {
  assert.deepStrictEqual(out.grouped.panels.chart.slice().sort(), [
    "x:0-10:2", "x:10-20:0", "x:20-30:1",
    "y:0-10:2", "y:10-20:1", "y:20-30:2",
  ]);
  assert.strictEqual(out.grouped.binned, false, "the filter only sees raw rows");
});

it("Histogram filter composes with facet panels", () => {
  assert.deepStrictEqual(out.facet.panels, {
    "facet-A": ["0-10:2", "10-20:1"],
    "facet-B": ["20-30:3", "30-40:1"],
  });
  assert.deepStrictEqual(out.facetDropped.panels, {"facet-A": ["0-10:4", "10-20:1"]},
    "a facet value with every row filtered out has no panel");
  assert.strictEqual(out.facet.binned || out.facetDropped.binned, false, "the filter only sees raw rows");
});

it("Histogram filter composes with the time filter", () => {
  assert.deepStrictEqual(out.time.panels.chart, ["0-10:1", "10-20:2", "20-30:1"],
    "the latest period's rows that pass the filter");
  assert.deepStrictEqual(out.time.ticks, [2020, 2021]);
  assert.deepStrictEqual(out.facetTime.panels, {"facet-A": ["10-20:1"], "facet-B": []});
  assert.strictEqual(out.time.binned || out.facetTime.binned, false, "the filter only sees raw rows");
});
