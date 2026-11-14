import {it} from "vitest";
import {color} from "d3-color";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    CyclePlot in a real browser, on both renderers: one touching panel per
    season in season order, titled in the chart's locale, a shared y axis
    labeled on the left, a mean line in each panel (one per series, in its
    color), seasons read in UTC with `xConfig.utc`, a timeline that starts
    on every period, and tooltips showing each point's date and its mean.
*/

/** Monthly rows for 2021–2023, for each series in `series`. */
const monthly = (series = [undefined]) =>
  series.flatMap((name, s) =>
    [2021, 2022, 2023].flatMap(year =>
      Array.from({length: 12}, (_, m) => ({
        ...(name ? {name} : {}),
        date: `${year}-${String(m + 1).padStart(2, "0")}-15`,
        value: 100 + m * 10 + (year - 2021) * 5 + s * 100,
      })),
    ),
  );

/** Daily rows for four weeks from Monday Jan 1 2024, two series. */
const daily = ["A", "B"].flatMap((name, s) =>
  Array.from({length: 28}, (_, k) => ({
    name,
    date: `2024-01-${String(k + 1).padStart(2, "0")}`,
    value: 50 + (k % 7) * 10 + s * 100,
  })),
);

/** What a CyclePlot drew: its panels' titles, plot areas, mean lines, data lines, and y domains. */
const extract = viz => {
  const panels = viz._facetPanels || [];
  const nodes = sceneNodes(viz._chartScene || []);
  return {
    titles: panels.map(p => {
      const title = nodes.find(n => n.key === `${p.key}/title`);
      return title ? title.lines.map(l => l.text).join(" ") : "";
    }),
    values: panels.map(p => p.value),
    plots: panels.map(p => {
      const a = p.state._plotArea,
        t = p.chartTransform || {};
      return {left: (t.x || 0) + a.x, width: a.width};
    }),
    means: panels.map(p =>
      sceneNodes(p.scene)
        .filter(n => /annotation-back-\d+-line$/.test(`${n.key}`))
        .map(n => ({
          y: n.points ? n.points[0][1] : n.y,
          stroke: n.paint?.stroke,
        })),
    ),
    lines: panels.map(p =>
      sceneNodes(p.scene)
        .filter(
          n =>
            n.shapeType === "Line" &&
            n.type === "path" &&
            n.datum?.__d3plus__ &&
            !`${n.key}`.endsWith("::hit"),
        )
        .map(n => ({id: `${n.datum.id}`, stroke: n.paint.stroke})),
    ),
    yDomains: panels.map(p =>
      JSON.stringify(p.state._plotAxisDomains?.y ?? null),
    ),
    rows: panels.map(p => (p.state._plotArea ? p.scene.length : 0)),
    nan: nodes.filter(n =>
      JSON.stringify({d: n.d, t: n.transform, p: n.points}).includes("null"),
    ).length,
  };
};

/** Hovers the middle of the `index`th panel's plot and reads the tooltip. */
const hover = index => viz =>
  new Promise(resolve => {
    const host = document.querySelector("#viz");
    const surface = host.querySelector(
      "svg.d3plus-render-svg, canvas.d3plus-render-canvas",
    );
    const r = surface.getBoundingClientRect();
    const p = viz._facetPanels[index];
    const a = p.state._plotArea,
      t = p.chartTransform;
    const clientX = r.left + t.x + a.x + a.width / 2,
      clientY = r.top + t.y + a.y + a.height / 2;
    const target =
      host.querySelector('[data-key$="plot-hover-surface"]') || surface;
    target.dispatchEvent(
      new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
    );
    requestAnimationFrame(() =>
      setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        resolve(
          tip
            ? {
                title:
                  tip.querySelector(".d3plus-tooltip-title")?.textContent ?? "",
                head: Array.from(
                  tip.querySelectorAll("thead td, thead th"),
                ).map(td => td.textContent.trim()),
                rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
                  Array.from(tr.querySelectorAll("td")).map(td =>
                    td.textContent.trim(),
                  ),
                ),
              }
            : null,
        );
      }, 60),
    );
  });

const src = config => `(lib, data) => new lib.CyclePlot()
  .data(data)
  .detectVisible(false)
  .x("date")
  .y("value")
  .config(${JSON.stringify(config)})`;

const html = '<div id="viz" style="width:900px;height:420px"></div>';
const hex = c => color(c)?.formatHex();

for (const renderer of ["svg", "canvas"]) {
  it(`CyclePlot ${renderer} — a touching panel per month, each with its mean`, async () => {
    const out = await probeChart(src({}), extract, {
      data: monthly(),
      renderer,
      html,
    });
    assert.deepStrictEqual(out.values, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.deepStrictEqual(out.titles, [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
    for (let i = 1; i < out.plots.length; i++) {
      const prev = out.plots[i - 1];
      assert.ok(
        Math.abs(prev.left + prev.width - out.plots[i].left) < 0.5,
        `panel ${i} touches the one before it`,
      );
      assert.ok(
        Math.abs(prev.width - out.plots[i].width) < 0.5,
        "every plot is as wide",
      );
    }
    assert.strictEqual(new Set(out.yDomains).size, 1, "one shared y domain");
    assert.ok(
      out.means.every(m => m.length === 1),
      "a mean line per panel",
    );
    // Means rise 10 a month, so each panel's line sits higher (smaller y).
    for (let i = 1; i < out.means.length; i++)
      assert.ok(out.means[i][0].y < out.means[i - 1][0].y);
    assert.ok(
      out.lines.every(l => l.length === 1),
      "a line per panel",
    );
    const strokes = new Set(out.lines.map(l => hex(l[0].stroke)));
    assert.strictEqual(strokes.size, 1, "one color");
    assert.notStrictEqual([...strokes][0], "#808080");
    assert.strictEqual(out.nan, 0);
  });

  it(`CyclePlot ${renderer} — weekdays from the locale's first, a mean per series`, async () => {
    const config = {groupBy: "name", period: "weekday", locale: "de-DE"};
    const out = await probeChart(src(config), extract, {
      data: daily,
      renderer,
      html,
    });
    assert.deepStrictEqual(out.values, [1, 2, 3, 4, 5, 6, 0], "Monday first");
    assert.strictEqual(out.titles[0], "Mo");
    assert.strictEqual(out.titles[6], "So");
    for (let i = 0; i < out.means.length; i++) {
      assert.strictEqual(out.means[i].length, 2, "a mean per series");
      // A line's stroke is its series color, darkened.
      const series = out.lines[i].map(l => hex(l.stroke)).sort();
      assert.deepStrictEqual(
        out.means[i].map(m => color(m.stroke).darker(0.25).formatHex()).sort(),
        series,
        "in each series' color",
      );
    }
    const us = await probeChart(src({...config, locale: "en-US"}), extract, {
      data: daily,
      renderer,
      html,
    });
    assert.deepStrictEqual(us.values, [0, 1, 2, 3, 4, 5, 6], "Sunday first");
    assert.strictEqual(us.titles[0], "Sun");
  });

  it(`CyclePlot ${renderer} — period: "quarter" merges months, mean: false`, async () => {
    const out = await probeChart(
      src({period: "quarter", mean: false}),
      extract,
      {data: monthly(), renderer, html},
    );
    assert.deepStrictEqual(out.titles, ["Q1", "Q2", "Q3", "Q4"]);
    assert.ok(
      out.means.every(m => m.length === 0),
      "no mean lines",
    );
  });

  it(`CyclePlot ${renderer} — xConfig.utc reads each season in UTC`, async () => {
    // Midnight UTC on the first of each month: west of UTC these fall on the
    // last day of the month before, in local time.
    const data = [2022, 2023].flatMap(year =>
      [0, 1, 2].map(m => ({
        date: new Date(Date.UTC(year, m, 1)).toISOString(),
        value: m + 1,
      })),
    );
    const utc = await probeChart(src({xConfig: {utc: true}}), extract, {
      data,
      renderer,
      html,
    });
    assert.deepStrictEqual(utc.titles, ["Jan", "Feb", "Mar"]);
    const local = await probeChart(src({}), extract, {data, renderer, html});
    const months = [
      ...new Set(data.map(d => new Date(d.date).getMonth())),
    ].sort((a, b) => a - b);
    assert.deepStrictEqual(local.values, months, "local months by default");
  });

  it(`CyclePlot ${renderer} — a timeline starts on every period`, async () => {
    const data = monthly().map(d => ({...d, year: d.date.slice(0, 4)}));
    const out = await probeChart(
      `${src({time: "year"})}`,
      viz => ({
        ...extract(viz),
        drawn: viz._filteredData.length,
        timeline: !!viz._timelineSelection,
      }),
      {data, renderer, html},
    );
    assert.strictEqual(out.drawn, 36, "every year's rows");
    assert.ok(out.timeline);
    assert.strictEqual(out.titles.length, 12);
  });

  it(`CyclePlot ${renderer} — tooltips show the point's date and its mean`, async () => {
    const single = await probeChart(src({}), hover(6), {
      data: monthly(),
      renderer,
      html,
    });
    assert.strictEqual(single.title, "Jul 2022");
    assert.deepStrictEqual(single.rows, [
      ["value", "165"],
      ["Mean", "165"],
    ]);
    const two = await probeChart(
      src({groupBy: "name", tooltipShared: false}),
      viz => {
        // Hover series B's July 2022 point.
        const p = viz._facetPanels[6];
        const row =
          p.state._plotArea &&
          viz._filteredData.find(
            d => d.name === "B" && d.date === "2022-07-15",
          );
        viz._tooltipClass.data([row]);
        const title = viz.schema.tooltipConfig.title(row, 0);
        const rows = viz.schema.tooltipConfig.tbody(row, 0);
        return {title, rows, x: viz._tooltipAxisLabel("x", row, 0)};
      },
      {data: monthly(["A", "B"]), renderer, html},
    );
    assert.strictEqual(two.title, "B");
    const shared = await probeChart(src({groupBy: "name"}), hover(6), {
      data: monthly(["A", "B"]),
      renderer,
      html,
    });
    assert.deepStrictEqual(
      shared.head,
      ["date", "Jul 2022"],
      "the shared tooltip names the hovered date",
    );
    assert.strictEqual(two.x, "Jul 2022");
    assert.deepStrictEqual(two.rows, [["Mean", "265"]]);
  });
}
