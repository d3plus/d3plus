import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {withPage} from "~test/browser/page.js";

const box = `<div id='dash' style='width:900px;height:600px'></div>`;

/**
    Builds a Dashboard in #dash (a Treemap spanning two rows beside a BarChart
    over a LinePlot), waits for every chart to draw, then runs `body`.
*/
const dashboardSetup = (renderer, body) => `return (async () => {
  const d3plus = window.d3plus;
  const data = [];
  [["Americas", ["Brazil", "Chile"]], ["Europe", ["France", "Germany"]]].forEach(([region, countries], ri) =>
    countries.forEach((country, ci) => {
      for (let year = 2020; year <= 2024; year++)
        data.push({region, country, year, revenue: 10 + ri * 5 + ci * 30 + (year - 2020) * 2});
    }));
  const latest = data.filter(d => d.year === 2024);
  const treemap = new d3plus.Treemap().data(latest).groupBy(["region", "country"]).sum("revenue");
  const bars = new d3plus.BarChart().data(latest).groupBy("country").color("region")
    .x("country").y("revenue").legend(false);
  const lines = new d3plus.LinePlot().data(data).groupBy("country").color("region")
    .x("year").y("revenue").yConfig({tickFormat: d => "$" + d + " million"}).legend(false);
  const dashboard = new d3plus.Dashboard()
    .select("#dash").renderer("${renderer}").duration(0)
    .chartConfig({duration: 0})
    .title("Revenue overview")
    .layoutConfig({columns: [1, 1]})
    .charts([{chart: treemap, rowSpan: 2}, bars, lines]);
  await new Promise(r => dashboard.render(r));
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const cells = () => Array.from(document.querySelectorAll("#dash .d3plus-dashboard-chart"))
    .map(el => ({x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight}));
  const plotLeft = (chart, i) => cells()[i].x + chart._plotArea.x + chart._chartTransform.x;
  const plotRight = (chart, i) => plotLeft(chart, i) + chart._plotArea.width;
  ${body}
})()`;

const run = (renderer, body) =>
  render(box, new Function(dashboardSetup(renderer, body)));

for (const renderer of ["svg", "canvas"]) {
  it(`Dashboard ${renderer}: draws each chart in its cell, under one title`, async () => {
    const result = await run(
      renderer,
      `return {
        cells: dashboard._dashboard.children.map(c => c.cell),
        surfaces: Array.from(document.querySelectorAll("#dash .d3plus-dashboard-chart"))
          .map(el => el.querySelector("${renderer}") ? 1 : 0),
        title: dashboard.toSVGString().includes("Revenue overview"),
        drawn: [treemap, bars, lines].map(c => c._chartScene.length > 0),
        sizes: [treemap, bars, lines].map(c => [c.width(), c.height()]),
        renderers: [treemap, bars, lines].map(c => c.renderer()),
        linked: [treemap, bars, lines].map(c => c.link()),
        group: dashboard.link(),
      };`,
    );
    const [tree, bar, line] = result.cells;
    assert.deepStrictEqual(result.surfaces, [1, 1, 1]);
    assert.deepStrictEqual(result.drawn, [true, true, true]);
    assert.ok(result.title, "the dashboard draws the title");
    assert.ok(
      Math.abs(tree.width - bar.width) <= 1,
      `two equal columns (${tree.width}, ${bar.width})`,
    );
    assert.strictEqual(bar.x - tree.x - tree.width, 4, "4px apart");
    assert.ok(tree.y > 20, "below the title");
    assert.ok(
      Math.abs(tree.height - (line.y + line.height - bar.y)) <= 1,
      "the treemap spans both rows",
    );
    assert.ok(
      Math.abs(line.y - (bar.y + bar.height) - 4) < 0.01,
      "rows are padded apart",
    );
    assert.deepStrictEqual(result.renderers, [renderer, renderer, renderer]);
    assert.ok(result.group.startsWith("d3plus-dashboard-"));
    assert.deepStrictEqual(result.linked, [
      result.group,
      result.group,
      result.group,
    ]);
    result.sizes.forEach(([w, h], i) => {
      const cell = result.cells[i];
      assert.ok(
        w <= cell.width + 1 && h <= cell.height + 1,
        "charts draw at their box's size",
      );
    });
  });
}

it("Dashboard: lines up the plot areas of charts stacked in a column", async () => {
  const result = await run(
    "svg",
    `return {
      lefts: [plotLeft(bars, 1), plotLeft(lines, 2)],
      rights: [plotRight(bars, 1), plotRight(lines, 2)],
      shifted: dashboard._dashboard.children.map(c => c.inset.left),
    };`,
  );
  assert.ok(
    Math.abs(result.lefts[0] - result.lefts[1]) <= 1,
    `left edges line up (${result.lefts})`,
  );
  assert.ok(
    Math.abs(result.rights[0] - result.rights[1]) <= 1,
    `right edges line up (${result.rights})`,
  );
  assert.ok(result.shifted[1] > 0, "the bar chart's narrower axis moves in");
  assert.strictEqual(result.shifted[0], 0, "the treemap stays put");
});

it("Dashboard: layoutConfig.align false leaves each chart its whole cell", async () => {
  const result = await run(
    "svg",
    `dashboard.layoutConfig({align: false});
    await new Promise(r => dashboard.render(r));
    return {
      insets: dashboard._dashboard.children.map(c => c.inset.left + c.inset.right),
      lefts: [plotLeft(bars, 1), plotLeft(lines, 2)],
    };`,
  );
  assert.deepStrictEqual(result.insets, [0, 0, 0]);
  assert.ok(
    Math.abs(result.lefts[0] - result.lefts[1]) > 5,
    `unaligned axes differ (${result.lefts})`,
  );
});

it("Dashboard: hovering a chart highlights the same rows in the others", async () => {
  const result = await run(
    "svg",
    `treemap.hover(d => d.country === "Chile");
    await frame();
    const out = {
      bars: ["Brazil", "Chile"].map(country => bars._hover({country}, 0)),
      lines: ["Brazil", "Chile"].map(country => lines._hover({country}, 0)),
    };
    treemap.hover(false);
    return out;`,
  );
  assert.deepStrictEqual(result.bars, [false, true]);
  assert.deepStrictEqual(result.lines, [false, true]);
});

it("Dashboard: link(false) leaves its charts unlinked; a chart's own link is kept", async () => {
  const result = await run(
    "svg",
    `bars.link("mine");
    dashboard.link(false);
    await new Promise(r => dashboard.render(r));
    return [treemap.link(), bars.link(), lines.link()];`,
  );
  assert.deepStrictEqual(result, [false, "mine", false]);
});

it("Dashboard: charts given by class name, with relative column widths", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const data = [
          {id: "a", x: 1, y: 3},
          {id: "a", x: 2, y: 5},
          {id: "b", x: 1, y: 2},
          {id: "b", x: 2, y: 4},
        ];
        const dashboard = new window.d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .layoutConfig({columns: [2, 1], padding: 0})
          .charts([
            {chart: "LinePlot", config: {data, x: "x", y: "y"}},
            {chart: window.d3plus.Pie, config: {data, value: "y"}},
          ]);
        dashboard.render(() => {
          const charts = dashboard._dashboard.children.map(c => c.chart);
          resolve({
            names: charts.map(c => c.constructor.name),
            widths: Array.from(
              document.querySelectorAll("#dash .d3plus-dashboard-chart"),
            ).map(el => el.offsetWidth),
            owned: dashboard._dashboard.children.map(c => c.owned),
          });
        });
      }),
  );
  assert.deepStrictEqual(result.names, ["LinePlot", "Pie"]);
  assert.deepStrictEqual(result.owned, [true, true]);
  assert.ok(
    Math.abs(result.widths[0] - 2 * result.widths[1]) <= 2,
    `two thirds and one third (${result.widths})`,
  );
});

for (const renderer of ["svg", "canvas"]) {
  it(`Dashboard ${renderer}: toSVGString holds the title and every chart`, async () => {
    const result = await run(
      renderer,
      `const markup = dashboard.toSVGString();
      const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
      return {
        root: doc.documentElement.localName,
        width: doc.documentElement.getAttribute("width"),
        charts: [0, 1, 2].map(i => doc.querySelectorAll('[data-key="dashboard-chart-' + i + '"] rect, [data-key="dashboard-chart-' + i + '"] path').length > 0),
        title: markup.includes("Revenue overview"),
        countries: ["Brazil", "France"].every(c => markup.includes(c)),
      };`,
    );
    assert.strictEqual(result.root, "svg");
    assert.ok(result.width.startsWith("900"));
    assert.deepStrictEqual(result.charts, [true, true, true]);
    assert.ok(result.title);
    assert.ok(result.countries);
  });
}

it("Dashboard: resizing redraws every chart at its new size", async () => {
  const result = await run(
    "svg",
    `const before = cells().map(c => c.width);
    dashboard.width(600);
    await new Promise(r => dashboard.render(r));
    return {before, after: cells().map(c => c.width), widths: [treemap, bars, lines].map(c => c.width())};`,
  );
  assert.ok(result.after[0] < result.before[0] - 100);
  assert.ok(Math.abs(result.widths[0] - result.after[0]) <= 1);
});

it("Dashboard: dropping a chart from charts tears it down; destroy tears down every chart", async () => {
  const result = await run(
    "svg",
    `dashboard.charts([{chart: treemap}, bars]);
    await new Promise(r => dashboard.render(r));
    const afterDrop = {
      cells: cells().length,
      lineDestroyed: (lines._destroyCount ?? 0) > 0,
      lineDom: !!lines._select.node().isConnected,
    };
    dashboard.destroy();
    return {
      afterDrop,
      host: document.querySelectorAll("#dash .d3plus-dashboard-charts").length,
      destroyed: [treemap, bars].map(c => (c._destroyCount ?? 0) > 0),
    };`,
  );
  assert.deepStrictEqual(result.afterDrop, {
    cells: 2,
    lineDestroyed: true,
    lineDom: false,
  });
  assert.strictEqual(result.host, 0);
  assert.deepStrictEqual(result.destroyed, [true, true]);
});

it("Dashboard: a nested dashboard's charts join the outer dashboard's link group", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const d3plus = window.d3plus;
        const data = [
          {id: "a", value: 3},
          {id: "b", value: 5},
        ];
        const inner = new d3plus.Dashboard().charts([
          {chart: "Pie", config: {data, value: "value"}},
          {chart: "Treemap", config: {data, sum: "value"}},
        ]);
        const outer = new d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .charts([{chart: "Pie", config: {data, value: "value"}}, inner]);
        outer.render(() => {
          resolve({
            legends: [outer, inner].map(
              d => d._legendClass?.data()?.length ?? 0,
            ),
            outer: outer.link(),
            inner: inner._dashboard.children.map(c => c.chart.link()),
            nested: document.querySelectorAll(
              "#dash .d3plus-dashboard-chart .d3plus-dashboard-chart",
            ).length,
            markup:
              (
                outer
                  .toSVGString()
                  .match(/dashboard-chart-1\/dashboard-chart-1/g) || []
              ).length > 0,
          });
        });
      }),
  );
  assert.deepStrictEqual(result.inner, [result.outer, result.outer]);
  assert.strictEqual(result.nested, 2);
  assert.deepStrictEqual(
    result.legends,
    [2, 2],
    "each dashboard draws its own legend",
  );
  assert.ok(
    result.markup,
    "the saved markup holds the nested dashboard's charts",
  );
});

it("Dashboard: hovering a bar with the pointer shows its tooltip and dims the treemap's other tiles", async () => {
  const result = await withPage(box, async page => {
    await page.evaluate(
      () =>
        new Promise(resolve => {
          const d3plus = window.d3plus;
          const data = [
            {country: "Brazil", value: 10},
            {country: "Chile", value: 20},
            {country: "France", value: 30},
          ];
          window.dashboard = new d3plus.Dashboard()
            .select("#dash")
            .duration(0)
            .chartConfig({duration: 0})
            .layoutConfig({columns: 2})
            .charts([
              new d3plus.Treemap().data(data).groupBy("country").sum("value"),
              new d3plus.BarChart()
                .data(data)
                .groupBy("country")
                .x("country")
                .y("value"),
            ]);
          window.dashboard.render(resolve);
        }),
    );
    const point = await page.evaluate(() => {
      const bars = window.dashboard._dashboard.children[1];
      const rect = bars.node.querySelector("svg").getBoundingClientRect();
      let at = null;
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.type === "rect" && !at && n.datum?.data?.country === "France")
          at = [nx + n.x + n.width / 2, ny + n.y + n.height / 2];
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(bars.chart._paintedScene.root, 0, 0);
      return [rect.left + at[0], rect.top + at[1]];
    });
    await page.mouse.move(point[0] - 40, point[1] - 40);
    await page.mouse.move(point[0], point[1], {steps: 4});
    await page.waitForTimeout(150);
    return page.evaluate(() => {
      const [treemap] = window.dashboard._dashboard.children.map(c => c.chart);
      return {
        tooltip: document.querySelector(".d3plus-tooltip")?.textContent ?? "",
        hovered: ["Brazil", "France"].map(country =>
          treemap._hover ? treemap._hover({country}, 0) : null,
        ),
      };
    });
  });
  assert.ok(result.tooltip.includes("France"), JSON.stringify(result));
  assert.deepStrictEqual(result.hovered, [false, true]);
});

it("Dashboard: each chart is a Tab stop in reading order, and its keyboard focus reaches the others", async () => {
  const result = await run(
    "svg",
    `const hosts = Array.from(document.querySelectorAll("#dash .d3plus-keyboard-nav"));
    const owners = hosts.map(h => dashboard._dashboard.children.findIndex(c => c.node.contains(h)));
    const host = hosts[owners.indexOf(1)];
    host.focus();
    host.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}));
    await frame();
    const hovered = ["Brazil", "Chile", "France", "Germany"].filter(
      country => treemap._hover && treemap._hover({country}, 0),
    );
    return {owners, tabIndex: hosts.map(h => h.tabIndex), hovered};`,
  );
  assert.deepStrictEqual(result.owners, [0, 1, 2]);
  assert.deepStrictEqual(result.tabIndex, [0, 0, 0]);
  assert.strictEqual(result.hovered.length, 1, JSON.stringify(result.hovered));
});

it("Dashboard: the download button saves the whole dashboard, on either renderer", async () => {
  for (const renderer of ["svg", "canvas"]) {
    const result = await run(
      renderer,
      `const svg = d3plus.svgForSave(dashboard, "#fff");
      return {
        background: !!svg.querySelector(".d3plus-save-background"),
        charts: [0, 1, 2].filter(i => svg.querySelector('[data-key="dashboard-chart-' + i + '"]')).length,
        chartSave: [treemap, bars, lines].map(c =>
          [c.saveControl(), c.tableView(), c.search(), c.zoomControls()].some(Boolean),
        ),
      };`,
    );
    assert.ok(result.background, renderer);
    assert.strictEqual(result.charts, 3, renderer);
    assert.deepStrictEqual(
      result.chartSave,
      [false, false, false],
      "the charts leave their buttons to the dashboard",
    );
  }
});

it("Dashboard: a responsive breakpoint can restack the charts", async () => {
  const result = await run(
    "svg",
    `dashboard.responsive([{maxWidth: 600, config: {layoutConfig: {columns: 1}}}]);
    dashboard.width(500).height(900);
    await new Promise(r => dashboard.render(r));
    const columnStarts = () => dashboard._dashboard.children.map(c => c.cell.x);
    const narrow = columnStarts();
    dashboard.width(900).height(600);
    await new Promise(r => dashboard.render(r));
    return {narrow, wide: columnStarts()};`,
  );
  assert.deepStrictEqual(
    new Set(result.narrow).size,
    1,
    "one column under 600px",
  );
  assert.strictEqual(new Set(result.wide).size, 2, "two above it");
});

it("Dashboard: draws one legend for its charts, and a click on it hides the entry in every chart", async () => {
  const result = await run(
    "svg",
    `const entries = () => (dashboard._legendClass?.data() ?? []).map(d => d.region);
    const before = {
      entries: entries(),
      own: [treemap, bars, lines].map(c => c._legendClass?.data()?.length ?? 0),
      member: dashboard._linkGroup === dashboard.link(),
    };
    const counts = [treemap, bars, lines].map(() => 0);
    [treemap, bars, lines].forEach((c, i) => {
      const render = c.render.bind(c);
      c.render = (...args) => (counts[i]++, render(...args));
    });
    const europe = dashboard._legendClass.data().find(d => d.region === "Europe");
    dashboard.schema.on["click.legend"](europe, 0, undefined, {shiftKey: false});
    await new Promise(r => setTimeout(r, 300));
    return {
      before,
      counts,
      bars: bars._filteredData.map(d => d.country).sort(),
      lines: Array.from(new Set(lines._filteredData.map(d => d.country))).sort(),
    };`,
  );
  assert.deepStrictEqual(result.before.entries.sort(), ["Americas", "Europe"]);
  assert.deepStrictEqual(
    result.before.own,
    [0, 0, 0],
    "the charts' own legends are hidden",
  );
  assert.ok(result.before.member, "the dashboard joins the charts' link group");
  assert.deepStrictEqual(result.bars, ["Brazil", "Chile"]);
  assert.deepStrictEqual(result.lines, ["Brazil", "Chile"]);
  assert.deepStrictEqual(result.counts, [1, 1, 1], "each chart redraws once");
});

it("Dashboard: legend(false) gives the charts their legends back; legendChart picks the charts", async () => {
  const result = await run(
    "svg",
    `dashboard.legend(false);
    await new Promise(r => dashboard.render(r));
    const off = {
      dashboard: dashboard._legendClass?.data()?.length ?? 0,
      treemap: treemap._legendClass.data().length,
      bars: bars.legend()(),
    };
    dashboard.config({legend: RESET_LEGEND, legendChart: 2});
    await new Promise(r => dashboard.render(r));
    return {
      off,
      picked:
        dashboard._dashboard.legend.sources.length === 1 &&
        dashboard._dashboard.legend.sources[0].chart === lines,
      entries: dashboard._legendClass.data().length,
      treemap: treemap._legendClass?.data()?.length ?? 0,
    };`.replace("RESET_LEGEND", "d3plus.RESET"),
  );
  assert.strictEqual(result.off.dashboard, 0);
  assert.ok(result.off.treemap > 0, "the treemap shows its own legend again");
  assert.strictEqual(
    result.off.bars,
    false,
    "the bar chart's own legend(false) is kept",
  );
  assert.ok(result.picked, "legendChart names the line plot");
  assert.ok(result.entries > 0, "whose entries the dashboard draws");
  assert.strictEqual(result.treemap, 0);
});

it("Dashboard: a chart whose config sets legend keeps its own", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const data = [
          {id: "a", value: 3},
          {id: "b", value: 5},
        ];
        const dashboard = new window.d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .charts([
            {chart: "Pie", config: {data, value: "value", legend: true}},
            {chart: "Treemap", config: {data, sum: "value"}},
          ]);
        dashboard.render(() => {
          const [pie, treemap] = dashboard._dashboard.children.map(
            c => c.chart,
          );
          resolve({
            pie: pie._legendClass.data().length,
            treemap: treemap._legendClass?.data()?.length ?? 0,
            source:
              dashboard._dashboard.legend.sources.length === 1 &&
              dashboard._dashboard.legend.sources[0].chart === treemap,
          });
        });
      }),
  );
  assert.deepStrictEqual(result, {pie: 2, treemap: 0, source: true});
});

it("Dashboard: shareX and shareY give overlapping charts one domain, labeled on the outer edge", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const d3plus = window.d3plus;
        const rows = (lo, hi) =>
          [lo, (lo + hi) / 2, hi].map((x, i) => ({id: `p${i}`, x, y: x * 2}));
        const scatter = (data, extra = {}) => ({
          chart: "Scatter",
          config: {data, x: "x", y: "y", ...extra},
        });
        const dashboard = new d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .chartConfig({duration: 0})
          .layoutConfig({columns: 2, shareX: true, shareY: true})
          .charts([
            {...scatter(rows(0, 10)), columnSpan: 2},
            scatter(rows(5, 40)),
            scatter(rows(20, 30), {xDomain: [-10, 100]}),
          ]);
        dashboard.render(() => {
          const charts = dashboard._dashboard.children.map(c => c.chart);
          resolve({
            x: charts.map(c => c._plotAxisDomains.x.map(Number)),
            y: charts.map(c => c._plotAxisDomains.y.map(Number)),
            xLabels: charts.map(c => c._xConfig.title !== false),
            yLabels: charts.map(c => c._yConfig.title !== false),
          });
        });
      }),
  );
  // The wide chart overlaps both charts below it, so all three share x: the
  // domain the third chart sets.
  assert.deepStrictEqual(result.x[0], [-10, 100]);
  assert.deepStrictEqual(result.x[1], [-10, 100]);
  assert.deepStrictEqual(result.x[2], [-10, 100]);
  assert.deepStrictEqual(result.xLabels, [false, true, true]);
  // The bottom row shares y; the wide chart is alone in its row.
  assert.deepStrictEqual(result.y[1], result.y[2]);
  assert.deepStrictEqual(result.yLabels, [true, true, false]);
});

it("Dashboard: the legend takes the style its charts set, the earlier chart's first", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const data = [
          {id: "a", value: 3},
          {id: "b", value: 5},
        ];
        const dashboard = new window.d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .legendConfig({padding: 7})
          .charts([
            {
              chart: "Pie",
              config: {
                data,
                value: "value",
                legendConfig: {shapeConfig: {width: 21}},
              },
            },
            {
              chart: "Treemap",
              config: {
                data,
                sum: "value",
                legendConfig: {shapeConfig: {width: 9, height: 13}},
              },
            },
          ]);
        dashboard.render(() => {
          const c = dashboard.legendConfig();
          resolve({
            width: c.shapeConfig.width,
            height: c.shapeConfig.height,
            padding: c.padding,
          });
        });
      }),
  );
  assert.deepStrictEqual(result, {width: 21, height: 13, padding: 7});
});

it("Dashboard: passes its theme, locale, and renderer down; a chart's own config wins", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const data = [
          {id: "a", value: 3},
          {id: "b", value: 5},
        ];
        const dashboard = new window.d3plus.Dashboard()
          .select("#dash")
          .duration(0)
          .theme("dark")
          .locale("es-ES")
          .renderer("canvas")
          .charts([
            {chart: "Pie", config: {data, value: "value"}},
            {chart: "Treemap", config: {data, sum: "value", theme: "light"}},
          ]);
        dashboard.render(() => {
          resolve(
            dashboard._dashboard.children.map(c => [
              c.chart.theme(),
              c.chart.locale(),
              c.chart.renderer(),
            ]),
          );
        });
      }),
  );
  assert.deepStrictEqual(result, [
    ["dark", "es-ES", "canvas"],
    ["light", "es-ES", "canvas"],
  ]);
});

for (const renderer of ["svg", "canvas"]) {
  it(`Dashboard ${renderer}: a chart colored by a colorScale is left out of the legend and keeps its colorScale`, async () => {
    const result = await render(
      box,
      kind =>
        new Promise(resolve => {
          const data = [
            {id: "a", group: "G1", value: 3},
            {id: "b", group: "G2", value: 5},
            {id: "c", group: "G2", value: 8},
          ];
          const dashboard = new window.d3plus.Dashboard()
            .select("#dash")
            .duration(0)
            .renderer(kind)
            .charts([
              {
                chart: "Treemap",
                config: {
                  data,
                  groupBy: "id",
                  sum: "value",
                  colorScale: "value",
                },
              },
              {chart: "Pie", config: {data, groupBy: "group", value: "value"}},
            ]);
          dashboard.render(() => {
            const [treemap] = dashboard._dashboard.children.map(c => c.chart);
            resolve({
              sources: dashboard._dashboard.legend.sources.map(
                c => c.chart.constructor.name,
              ),
              entries: (dashboard._legendClass?.data() ?? [])
                .map(d => d.group)
                .sort(),
              colorScale: treemap._colorScaleClass?.data()?.length > 0,
              renderer: treemap.renderer(),
            });
          });
        }),
      renderer,
    );
    assert.deepStrictEqual(result.sources, ["Pie"]);
    assert.deepStrictEqual(result.entries, ["G1", "G2"]);
    assert.ok(result.colorScale, "the treemap still draws its colorScale");
    assert.strictEqual(result.renderer, renderer);
  });
}
