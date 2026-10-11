import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Histogram bins exactly the rows each panel draws: a facet panel bins only
    its own rows, and a time-filtered chart bins only the selected period's
    rows, while the timeline still lists every period.
*/

let out;

before(async function () {
  this.timeout(60000);
  out = await render("", () => {
    const unwrap = d => {
      while (d && d.__d3plus__ && d.data) d = d.data;
      return d;
    };
    // Each drawn bar as `x0-x1:count:y`.
    const bars = scene => {
      const list = [];
      const walk = nodes => (nodes || []).forEach(n => {
        if (n.type === "group") walk(n.children);
        else if (n.shapeType === "Bar" && n.datum && !String(n.key).endsWith("::hit")) {
          const b = unwrap(n.datum);
          list.push(`${b.x0}-${b.x1}:${b.count}:${+b.y.toFixed(4)}`);
        }
      });
      walk(scene);
      return list;
    };
    const report = viz => ({
      panels: viz._facetPanels
        ? Object.fromEntries(viz._facetPanels.map(p => [p.key, bars(p.scene)]))
        : {chart: bars(viz._chartScene)},
      ticks: (viz._timelineClass.ticks() || []).map(d => d.getFullYear()),
    });
    // Renders, then applies each update and re-renders, reporting every draw.
    const draw = (setup, ...updates) =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const viz = new window.d3plus.Histogram().select(el).duration(0).width(800).height(500);
        setup(viz);
        const reports = [];
        const step = () => {
          reports.push(report(viz));
          const next = updates.shift();
          if (!next) return resolve(reports);
          next(viz);
          viz.render(step);
        };
        viz.render(step);
      });

    // A: [0,10)→4, [10,20)→1. B: [20,30)→3, [30,40)→1.
    const facetRows = [
      ...[1, 2, 3, 4, 12].map(v => ({f: "A", v})),
      ...[25, 26, 27, 35].map(v => ({f: "B", v})),
    ];
    // 2020: [0,10)→3 (all A). 2021: A [10,20)→2, B [20,30)→1.
    const timeRows = [
      ...[1, 2, 3].map(v => ({year: 2020, f: "A", v})),
      ...[15, 16].map(v => ({year: 2021, f: "A", v})),
      {year: 2021, f: "B", v: 25},
    ];
    const independent = {scales: "independent"};
    return (async () => ({
      shared: await draw(viz => viz.data(facetRows).value("v").binWidth(10).facet("f")),
      independent: await draw(viz =>
        viz.data(facetRows).value("v").binWidth(10).facet("f").facetConfig(independent)),
      relative: await draw(viz =>
        viz.data(facetRows).value("v").binWidth(10).binNormalize("relative").facet("f").facetConfig(independent)),
      time: await draw(
        viz => viz.data(timeRows).value("v").binWidth(10).time("year"),
        viz => viz.timeFilter(d => d.year === 2020),
        viz => viz.timeFilter(d => d.year >= 2020 && d.year <= 2021),
      ),
      facetTime: await draw(
        viz => viz.data(timeRows).value("v").binWidth(10).time("year").facet("f").facetConfig(independent),
        viz => viz.timeFilter(d => d.year === 2020),
      ),
    }))();
  });
});

after(async () => {
  await closeBrowser();
});

it("Histogram bins each facet panel on its own rows", () => {
  assert.deepStrictEqual(out.shared[0].panels, {
    "facet-A": ["0-10:4:4", "10-20:1:1", "20-30:0:0", "30-40:0:0"],
    "facet-B": ["0-10:0:0", "10-20:0:0", "20-30:3:3", "30-40:1:1"],
  }, "shared scales: panels bin their own rows along shared edges");
  assert.deepStrictEqual(out.independent[0].panels, {
    "facet-A": ["0-10:4:4", "10-20:1:1"],
    "facet-B": ["20-30:3:3", "30-40:1:1"],
  }, "independent scales: panels bin their own rows along their own edges");
  assert.deepStrictEqual(out.relative[0].panels, {
    "facet-A": ["0-10:4:0.8", "10-20:1:0.2"],
    "facet-B": ["20-30:3:0.75", "30-40:1:0.25"],
  }, "each panel normalizes against its own rows");
});

it("Histogram bins only the selected time period", () => {
  const [latest, year2020, range] = out.time;
  assert.deepStrictEqual(latest.panels.chart, ["10-20:2:2", "20-30:1:1"], "defaults to the latest period");
  assert.deepStrictEqual(latest.ticks, [2020, 2021], "the timeline lists every period");
  assert.deepStrictEqual(year2020.panels.chart, ["0-10:3:3"], "a selected period bins only its rows");
  assert.deepStrictEqual(year2020.ticks, [2020, 2021], "the timeline still lists every period");
  assert.deepStrictEqual(range.panels.chart, ["0-10:3:3", "10-20:2:2", "20-30:1:1"], "a range bins every period in it");
});

it("Histogram bins each facet panel's rows in the selected time period", () => {
  const [latest, year2020] = out.facetTime;
  assert.deepStrictEqual(latest.panels, {"facet-A": ["10-20:2:2"], "facet-B": ["20-30:1:1"]});
  assert.deepStrictEqual(year2020.panels, {"facet-A": ["0-10:3:3"], "facet-B": []},
    "a panel with no rows in the period stays in the grid, empty");
});
