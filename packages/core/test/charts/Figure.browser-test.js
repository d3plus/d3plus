import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {withPage} from "~test/browser/page.js";

const box = `<div id='fig' style='width:900px;height:600px'></div>`;

/**
    Builds a Figure in #fig (a Treemap spanning two rows beside a BarChart
    over a LinePlot), waits for every chart to draw, then runs `body`.
*/
const figureSetup = (renderer, body) => `return (async () => {
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
  const figure = new d3plus.Figure()
    .select("#fig").renderer("${renderer}").duration(0)
    .chartConfig({duration: 0})
    .title("Revenue overview")
    .layoutConfig({columns: [1, 1]})
    .charts([{chart: treemap, rowSpan: 2}, bars, lines]);
  await new Promise(r => figure.render(r));
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const cells = () => Array.from(document.querySelectorAll("#fig .d3plus-figure-chart"))
    .map(el => ({x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight}));
  const plotLeft = (chart, i) => cells()[i].x + chart._plotArea.x + chart._chartTransform.x;
  const plotRight = (chart, i) => plotLeft(chart, i) + chart._plotArea.width;
  ${body}
})()`;

const run = (renderer, body) =>
  render(box, new Function(figureSetup(renderer, body)));

for (const renderer of ["svg", "canvas"]) {
  it(`Figure ${renderer}: draws each chart in its cell, under one title`, async () => {
    const result = await run(
      renderer,
      `return {
        cells: cells(),
        surfaces: Array.from(document.querySelectorAll("#fig .d3plus-figure-chart"))
          .map(el => el.querySelector("${renderer}") ? 1 : 0),
        title: figure.toSVGString().includes("Revenue overview"),
        drawn: [treemap, bars, lines].map(c => c._chartScene.length > 0),
        sizes: [treemap, bars, lines].map(c => [c.width(), c.height()]),
        renderers: [treemap, bars, lines].map(c => c.renderer()),
        linked: [treemap, bars, lines].map(c => c.link()),
        group: figure.link(),
      };`,
    );
    const [tree, bar, line] = result.cells;
    assert.deepStrictEqual(result.surfaces, [1, 1, 1]);
    assert.deepStrictEqual(result.drawn, [true, true, true]);
    assert.ok(result.title, "the figure draws the title");
    assert.ok(
      Math.abs(tree.width - 442) <= 2,
      `half the width less padding (${tree.width})`,
    );
    assert.ok(tree.y > 20, "below the title");
    assert.ok(
      Math.abs(tree.height - (line.y + line.height - bar.y)) <= 1,
      "the treemap spans both rows",
    );
    assert.ok(line.y >= bar.y + bar.height + 15, "rows are padded apart");
    assert.deepStrictEqual(result.renderers, [renderer, renderer, renderer]);
    assert.ok(result.group.startsWith("d3plus-figure-"));
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

it("Figure: lines up the plot areas of charts stacked in a column", async () => {
  const result = await run(
    "svg",
    `return {
      lefts: [plotLeft(bars, 1), plotLeft(lines, 2)],
      rights: [plotRight(bars, 1), plotRight(lines, 2)],
      shifted: figure._figure.children.map(c => c.inset.left),
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

it("Figure: layoutConfig.align false leaves each chart its whole cell", async () => {
  const result = await run(
    "svg",
    `figure.layoutConfig({align: false});
    await new Promise(r => figure.render(r));
    return {
      insets: figure._figure.children.map(c => c.inset.left + c.inset.right),
      lefts: [plotLeft(bars, 1), plotLeft(lines, 2)],
    };`,
  );
  assert.deepStrictEqual(result.insets, [0, 0, 0]);
  assert.ok(
    Math.abs(result.lefts[0] - result.lefts[1]) > 5,
    `unaligned axes differ (${result.lefts})`,
  );
});

it("Figure: hovering a chart highlights the same rows in the others", async () => {
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

it("Figure: link(false) leaves its charts unlinked; a chart's own link is kept", async () => {
  const result = await run(
    "svg",
    `bars.link("mine");
    figure.link(false);
    await new Promise(r => figure.render(r));
    return [treemap.link(), bars.link(), lines.link()];`,
  );
  assert.deepStrictEqual(result, [false, "mine", false]);
});

it("Figure: charts given by class name, with relative column widths", async () => {
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
        const figure = new window.d3plus.Figure()
          .select("#fig")
          .duration(0)
          .layoutConfig({columns: [2, 1], padding: 0})
          .charts([
            {chart: "LinePlot", config: {data, x: "x", y: "y"}},
            {chart: window.d3plus.Pie, config: {data, value: "y"}},
          ]);
        figure.render(() => {
          const charts = figure._figure.children.map(c => c.chart);
          resolve({
            names: charts.map(c => c.constructor.name),
            widths: Array.from(
              document.querySelectorAll("#fig .d3plus-figure-chart"),
            ).map(el => el.offsetWidth),
            owned: figure._figure.children.map(c => c.owned),
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
  it(`Figure ${renderer}: toSVGString holds the title and every chart`, async () => {
    const result = await run(
      renderer,
      `const markup = figure.toSVGString();
      const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
      return {
        root: doc.documentElement.localName,
        width: doc.documentElement.getAttribute("width"),
        charts: [0, 1, 2].map(i => doc.querySelectorAll('[data-key="figure-chart-' + i + '"] rect, [data-key="figure-chart-' + i + '"] path').length > 0),
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

it("Figure: resizing redraws every chart at its new size", async () => {
  const result = await run(
    "svg",
    `const before = cells().map(c => c.width);
    figure.width(600);
    await new Promise(r => figure.render(r));
    return {before, after: cells().map(c => c.width), widths: [treemap, bars, lines].map(c => c.width())};`,
  );
  assert.ok(result.after[0] < result.before[0] - 100);
  assert.ok(Math.abs(result.widths[0] - result.after[0]) <= 1);
});

it("Figure: dropping a chart from charts tears it down; destroy tears down every chart", async () => {
  const result = await run(
    "svg",
    `figure.charts([{chart: treemap}, bars]);
    await new Promise(r => figure.render(r));
    const afterDrop = {
      cells: cells().length,
      lineDestroyed: (lines._destroyCount ?? 0) > 0,
      lineDom: !!lines._select.node().isConnected,
    };
    figure.destroy();
    return {
      afterDrop,
      host: document.querySelectorAll("#fig .d3plus-figure-charts").length,
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

it("Figure: a nested figure's charts join the outer figure's link group", async () => {
  const result = await render(
    box,
    () =>
      new Promise(resolve => {
        const d3plus = window.d3plus;
        const data = [
          {id: "a", value: 3},
          {id: "b", value: 5},
        ];
        const inner = new d3plus.Figure().charts([
          {chart: "Pie", config: {data, value: "value"}},
          {chart: "Treemap", config: {data, sum: "value"}},
        ]);
        const outer = new d3plus.Figure()
          .select("#fig")
          .duration(0)
          .charts([{chart: "Pie", config: {data, value: "value"}}, inner]);
        outer.render(() => {
          resolve({
            outer: outer.link(),
            inner: inner._figure.children.map(c => c.chart.link()),
            nested: document.querySelectorAll(
              "#fig .d3plus-figure-chart .d3plus-figure-chart",
            ).length,
            markup:
              (
                outer.toSVGString().match(/figure-chart-1\/figure-chart-1/g) ||
                []
              ).length > 0,
          });
        });
      }),
  );
  assert.deepStrictEqual(result.inner, [result.outer, result.outer]);
  assert.strictEqual(result.nested, 2);
  assert.ok(result.markup, "the saved markup holds the nested figure's charts");
});

it("Figure: hovering a bar with the pointer shows its tooltip and dims the treemap's other tiles", async () => {
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
          window.figure = new d3plus.Figure()
            .select("#fig")
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
          window.figure.render(resolve);
        }),
    );
    const point = await page.evaluate(() => {
      const bars = window.figure._figure.children[1];
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
      const [treemap] = window.figure._figure.children.map(c => c.chart);
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

it("Figure: each chart is a Tab stop in reading order, and its keyboard focus reaches the others", async () => {
  const result = await run(
    "svg",
    `const hosts = Array.from(document.querySelectorAll("#fig .d3plus-keyboard-nav"));
    const owners = hosts.map(h => figure._figure.children.findIndex(c => c.node.contains(h)));
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

it("Figure: the download button saves the whole figure, on either renderer", async () => {
  for (const renderer of ["svg", "canvas"]) {
    const result = await run(
      renderer,
      `const svg = d3plus.svgForSave(figure, "#fff");
      return {
        background: !!svg.querySelector(".d3plus-save-background"),
        charts: [0, 1, 2].filter(i => svg.querySelector('[data-key="figure-chart-' + i + '"]')).length,
        chartSave: [treemap, bars, lines].map(c => c.saveControl()),
      };`,
    );
    assert.ok(result.background, renderer);
    assert.strictEqual(result.charts, 3, renderer);
    assert.deepStrictEqual(
      result.chartSave,
      [false, false, false],
      "the charts leave saving to the figure",
    );
  }
});

it("Figure: a responsive breakpoint can restack the charts", async () => {
  const result = await run(
    "svg",
    `figure.responsive([{maxWidth: 600, config: {layoutConfig: {columns: 1}}}]);
    figure.width(500).height(900);
    await new Promise(r => figure.render(r));
    const columnStarts = () => figure._figure.children.map(c => c.cell.x);
    const narrow = columnStarts();
    figure.width(900).height(600);
    await new Promise(r => figure.render(r));
    return {narrow, wide: columnStarts()};`,
  );
  assert.deepStrictEqual(
    new Set(result.narrow).size,
    1,
    "one column under 600px",
  );
  assert.strictEqual(new Set(result.wide).size, 2, "two above it");
});
