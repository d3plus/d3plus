import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    A Plot no taller than `yCutoff` hides its y axis and labels only the two
    ends of its x domain: the start flush with the plot area's left edge, the
    end flush with its right edge, formatted and styled like the axis's own
    tick labels. The plot ends above the labels by the axis's label padding,
    so no shape ever touches them.
*/

after(async () => {
  await closeBrowser();
});

/**
    Renders each chart (built in the page by `src`, a `lib => chart` function
    source) into its own container and reports the plot area, the end labels
    (scene + DOM boxes), the x axis's own text, and every data shape's box.
*/
const renderCharts = (charts, size = {width: 420, height: 150}) =>
  render(
    "",
    ({charts, size}) => {
      const walk = (node, fn, path = []) => {
        fn(node, path);
        (node.children || []).forEach(c => walk(c, fn, path.concat(node.key)));
      };
      const box = r => ({
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      });
      const one = ({src, width = size.width, height = size.height}) =>
        new Promise((resolve, reject) => {
          const el = document.createElement("div");
          el.style.cssText = `width:${width}px;height:${height}px`;
          document.body.appendChild(el);
          const viz = new Function("lib", `return (${src})(lib);`)(
            window.d3plus,
          )
            .select(el)
            .legend(false)
            .duration(0);
          viz.render(() => {
            try {
              const scene = viz._paintedScene.root;
              const endLabels = [],
                axisText = [];
              walk(scene, (n, path) => {
                if (n.type !== "text") return;
                if (path.includes("plot-x-end-labels"))
                  endLabels.push({
                    text: n.lines.map(l => l.text).join(" "),
                    key: n.key,
                    x: n.transform.x,
                    y: n.transform.y,
                    width: n.width,
                    height: n.height,
                    anchor: n.font.anchor,
                    size: n.font.size,
                    fill: n.paint.fill,
                    interactionGroup: n.interactionGroup,
                  });
                else if (path.includes("plot-x-axis"))
                  axisText.push(n.lines.map(l => l.text).join(" "));
              });
              const root = el
                .querySelector("svg, canvas")
                .getBoundingClientRect();
              const ct = viz._chartTransform,
                area = viz._plotArea;
              const plot = {
                left: root.left + ct.x + area.x,
                right: root.left + ct.x + area.x + area.width,
                top: root.top + ct.y + area.y,
                bottom: root.top + ct.y + area.y + area.height,
              };
              const labelBoxes = [
                ...el.querySelectorAll("g[data-key='plot-x-end-labels'] text"),
              ].map(t => ({
                text: t.textContent,
                ...box(t.getBoundingClientRect()),
              }));
              const shapeBoxes = [
                ...el.querySelectorAll(
                  "g[data-key='plot-zoom-content'] :is(path, rect, circle)",
                ),
              ]
                .filter(s => !s.closest("g[data-key$='-grid']"))
                .map(s => box(s.getBoundingClientRect()))
                .filter(b => b.width || b.height);
              const nan = [...el.querySelectorAll("*")].filter(n =>
                [...n.attributes].some(a => a.value.includes("NaN")),
              ).length;
              resolve({
                area,
                ct,
                plot,
                endLabels,
                axisText,
                labelBoxes,
                shapeBoxes,
                nan,
                root: box(root),
                canvas: Boolean(el.querySelector("canvas")),
                domain: viz._xAxis
                  ._getDomain()
                  .map(d => (d instanceof Date ? +d : d)),
                formatted: viz._xAxis
                  ._getDomain()
                  .map(d =>
                    viz._xAxis._labelFormat(d instanceof Date ? +d : d),
                  ),
                axisPadding: viz._xAxis.shapeConfig().labelConfig.padding,
                boxes: viz._plotZoomBase
                  ? viz._plotZoomBase.layout.xEndLabels
                  : undefined,
              });
            } catch (e) {
              reject(e);
            }
          });
        });
      return (async () => {
        const out = [];
        for (const chart of charts) out.push(await one(chart));
        return out;
      })();
    },
    {charts, size},
  );

const LINE = `lib => {
  const data = [];
  for (let x = 0; x <= 30; x += 3) data.push({id: "a", x, y: (x * 7) % 13 + 2});
  return new lib.LinePlot().data(data).groupBy("id").x("x").y("y");
}`;

const BARS = `lib => new lib.BarChart()
  .data([2018, 2019, 2020, 2021, 2022, 2023].map((year, i) => ({id: "a", year, value: [4, 7, 5, 9, 6, 8][i]})))
  .groupBy("id").x("year").y("value")`;

const near = (a, b, tol = 1, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

/** Every data shape ends above every end label. */
const assertNoOverlap = (r, msg) => {
  assert.ok(r.shapeBoxes.length, `${msg}: shapes rendered`);
  const top = Math.min(...r.labelBoxes.map(b => b.top));
  for (const s of r.shapeBoxes)
    assert.ok(
      s.bottom <= top,
      `${msg}: shape bottom ${s.bottom} clears label top ${top}`,
    );
};

it("a short LinePlot labels only its x domain ends, flush with the plot area's edges", async function () {
  this.timeout(60000);
  const [r] = await renderCharts([{src: LINE}]);
  assert.deepStrictEqual(
    r.endLabels.map(l => l.text),
    ["0", "30"],
  );
  assert.deepStrictEqual(
    r.axisText,
    [],
    "the x axis draws no labels of its own",
  );
  const [start, end] = r.labelBoxes;
  near(start.left, r.plot.left, 1, "start label left edge");
  near(end.right, r.plot.right, 1, "end label right edge");
  assert.strictEqual(r.endLabels[0].anchor, "start");
  assert.strictEqual(r.endLabels[1].anchor, "end");
  assert.strictEqual(
    r.endLabels[0].interactionGroup,
    "axis",
    "the labels are axis chrome, not data marks",
  );
  assert.ok(start.bottom <= r.root.bottom, "the labels stay inside the chart");
  assert.strictEqual(r.nan, 0);
});

it("a short LinePlot's line starting bottom-left never touches the end labels", async function () {
  this.timeout(60000);
  const [r] = await renderCharts([{src: LINE}]);
  assertNoOverlap(r, "LinePlot");
  // The line's lowest point (x = 0) sits on the plot's bottom edge.
  near(
    Math.max(...r.shapeBoxes.map(b => b.bottom)),
    r.plot.bottom,
    2,
    "line reaches the plot bottom",
  );
});

it("the end labels sit the axis's label padding below the plot", async function () {
  this.timeout(60000);
  const pad = p =>
    `lib => (${LINE})(lib).xConfig({shapeConfig: {labelConfig: {padding: ${p}}}})`;
  const [base, wide] = await renderCharts([{src: LINE}, {src: pad(15)}]);
  assert.strictEqual(base.axisPadding, 5, "the axis's default label padding");
  // The label boxes start exactly `padding` below the plot's bottom edge.
  for (const [r, p] of [
    [base, 5],
    [wide, 15],
  ])
    for (const b of r.boxes)
      assert.strictEqual(
        b.y,
        r.area.y + r.area.height + p,
        `box top with padding ${p}`,
      );
  const gap = r => r.labelBoxes[0].top - r.plot.bottom;
  near(gap(base), 5, 1, "default rendered gap");
  near(
    gap(wide) - gap(base),
    10,
    0.5,
    "the rendered gap follows labelConfig.padding",
  );
  assert.ok(
    wide.area.height < base.area.height,
    "more padding claims more height",
  );
  near(
    base.area.height - wide.area.height,
    10,
    0,
    "the plot gives up exactly the extra padding",
  );
  assertNoOverlap(wide, "wide padding");
});

it("the plot claims the end labels' measured text height", async function () {
  this.timeout(60000);
  const big = `lib => (${LINE})(lib).xConfig({shapeConfig: {labelConfig: {fontSize: 20}}})`;
  const [base, large] = await renderCharts([{src: LINE}, {src: big}]);
  // 12px and 20px labels measure ceil(1.4 × fontSize) tall: 17 and 28.
  near(
    base.area.height - large.area.height,
    11,
    0,
    "the plot shrinks by the text-height difference",
  );
  assert.strictEqual(large.endLabels[0].size, 20);
  assertNoOverlap(large, "20px labels");
  for (const b of large.labelBoxes)
    assert.ok(
      b.bottom <= large.root.bottom + 0.5,
      "20px labels stay inside the chart",
    );
});

it("a short BarChart's end labels sit flush with the plot edges, not the bar centers", async function () {
  this.timeout(60000);
  const [r] = await renderCharts([{src: BARS}]);
  assert.deepStrictEqual(
    r.endLabels.map(l => l.text),
    ["2018", "2023"],
  );
  const [start, end] = r.labelBoxes;
  near(start.left, r.plot.left, 1, "start label left edge");
  near(end.right, r.plot.right, 1, "end label right edge");
  const bars = r.shapeBoxes.filter(b => b.width > 20);
  assert.ok(
    start.left < Math.min(...bars.map(b => b.left)),
    "the start label starts left of the first bar",
  );
  assertNoOverlap(r, "BarChart");
});

it("end labels use the axis's own format for numbers, years, and time", async function () {
  this.timeout(60000);
  const years = `lib => {
    const data = [];
    for (let year = 2010; year <= 2024; year++) data.push({id: "a", year, v: 5 + Math.round(4 * Math.sin(year))});
    return new lib.LinePlot().data(data).groupBy("id").x("year").y("v");
  }`;
  const dates = `lib => {
    const data = [];
    for (let m = 0; m < 12; m++) data.push({id: "a", date: new Date(2024, m, 1), v: m % 5});
    return new lib.LinePlot().data(data).groupBy("id").x("date").y("v").xConfig({scale: "time"});
  }`;
  const big = `lib => new lib.Plot()
    .data([{id: "a", x: 1200, y: 1}, {id: "b", x: 700000, y: 2}, {id: "c", x: 2500000, y: 3}])
    .groupBy("id").x("x").y("y")`;
  const [y, d, n] = await renderCharts([
    {src: years},
    {src: dates},
    {src: big},
  ]);
  assert.deepStrictEqual(
    y.endLabels.map(l => l.text),
    ["2010", "2024"],
  );
  assert.deepStrictEqual(
    d.endLabels.map(l => l.text),
    d.formatted.slice(0, 1).concat(d.formatted.slice(-1)),
  );
  assert.ok(
    d.endLabels.every(l => !/^\d{6,}$/.test(l.text)),
    `time labels are dates, not timestamps: ${d.endLabels.map(l => l.text)}`,
  );
  assert.deepStrictEqual(
    n.endLabels.map(l => l.text),
    n.formatted,
  );
  assert.ok(
    /^[\d.]+M$/.test(n.endLabels[1].text),
    `large numbers abbreviate like the axis: ${n.endLabels[1].text}`,
  );
});

it("a single value gets one end label, centered on the plot", async function () {
  this.timeout(60000);
  const single = `lib => new lib.BarChart().data([{id: "a", year: 2020, v: 3}]).groupBy("id").x("year").y("v")`;
  const [r] = await renderCharts([{src: single}]);
  assert.deepStrictEqual(
    r.endLabels.map(l => l.text),
    ["2020"],
  );
  assert.strictEqual(r.endLabels[0].anchor, "middle");
  const [b] = r.labelBoxes;
  near(
    (b.left + b.right) / 2,
    (r.plot.left + r.plot.right) / 2,
    1,
    "label center",
  );
});

it("long end labels truncate with an ellipsis instead of colliding", async function () {
  this.timeout(60000);
  const long = `lib => new lib.BarChart().data([
    {id: "a", cat: "A very long category name that goes on and on", v: 3},
    {id: "a", cat: "Another extremely long category label here too", v: 5},
  ]).groupBy("id").x("cat").y("v")`;
  const [r] = await renderCharts([{src: long, width: 300}]);
  assert.strictEqual(r.endLabels.length, 2);
  assert.ok(
    r.endLabels.every(l => l.text.endsWith("...")),
    `truncated: ${r.endLabels.map(l => l.text)}`,
  );
  const [start, end] = r.labelBoxes;
  assert.ok(start.right < end.left, "the labels don't overlap");
  near(start.left, r.plot.left, 1, "start label left edge");
  near(end.right, r.plot.right, 1, "end label right edge");
});

it("end labels respect the user's xConfig tickFormat, ticks, and label font", async function () {
  this.timeout(60000);
  const format = `lib => (${LINE})(lib).xConfig({tickFormat: d => "$" + d})`;
  const ticks = `lib => (${LINE})(lib).xConfig({ticks: [0, 15, 30]})`;
  const styled = `lib => (${LINE})(lib).xConfig({shapeConfig: {labelConfig: {fontColor: "rgb(255, 0, 0)"}}})`;
  const [f, t, s] = await renderCharts([
    {src: format},
    {src: ticks},
    {src: styled},
  ]);
  assert.deepStrictEqual(
    f.endLabels.map(l => l.text),
    ["$0", "$30"],
  );
  assert.deepStrictEqual(
    t.endLabels.map(l => l.text),
    ["0", "30"],
  );
  assert.ok(
    s.endLabels.every(l => l.fill === "rgb(255, 0, 0)"),
    "labelConfig.fontColor colors the labels",
  );
});

it("labels chosen with xConfig.labels are drawn by the axis instead of the end labels", async function () {
  this.timeout(60000);
  const labels = `lib => (${LINE})(lib).xConfig({labels: [0, 30]})`;
  const [r] = await renderCharts([{src: labels}]);
  assert.deepStrictEqual(r.endLabels, []);
  assert.deepStrictEqual(r.axisText, ["0", "30"]);
});

it("end labels work with an x2 axis and on a horizontal BarChart", async function () {
  this.timeout(60000);
  const x2 = `lib => {
    const data = [];
    for (let x = 0; x <= 30; x += 3) data.push({id: "a", x, x2: x * 10, y: (x * 7) % 13 + 2});
    return new lib.LinePlot().data(data).groupBy("id").x("x").x2("x2").y("y");
  }`;
  const horizontal = `lib => new lib.BarChart()
    .data([{id: "a", v: 3}, {id: "b", v: 7}, {id: "c", v: 5}])
    .groupBy("id").discrete("y").x("v").y("id")`;
  const [a, h] = await renderCharts([{src: x2}, {src: horizontal}]);
  assert.deepStrictEqual(
    a.endLabels.map(l => l.text),
    ["0", "30"],
  );
  assertNoOverlap(a, "x2");
  assert.deepStrictEqual(
    h.endLabels.map(l => l.text),
    ["0", "7"],
  );
  near(h.labelBoxes[0].left, h.plot.left, 1, "horizontal start label");
  near(h.labelBoxes[1].right, h.plot.right, 1, "horizontal end label");
  assertNoOverlap(h, "horizontal BarChart");
});

it("a chart too narrow for its x axis draws no end labels", async function () {
  this.timeout(60000);
  const [r] = await renderCharts([{src: LINE, width: 140}]);
  assert.deepStrictEqual(r.endLabels, []);
  assert.deepStrictEqual(r.axisText, []);
});

it("the y cutoff boundary: 150px labels the ends, 151px draws both axes", async function () {
  this.timeout(60000);
  const [at, above] = await renderCharts([
    {src: LINE, height: 150},
    {src: LINE, height: 151},
  ]);
  assert.deepStrictEqual(
    at.endLabels.map(l => l.text),
    ["0", "30"],
  );
  assertNoOverlap(at, "150px");
  assert.deepStrictEqual(above.endLabels, []);
  assert.ok(
    above.axisText.length > 2,
    "the x axis labels its ticks above the cutoff",
  );
});

it("very short charts drop the end labels rather than crush the plot", async function () {
  this.timeout(60000);
  const charts = [20, 40, 60, 80].map(height => ({src: LINE, height}));
  const results = await renderCharts(charts);
  for (const r of results) {
    assert.strictEqual(r.nan, 0, "no NaN attributes");
    if (r.endLabels.length) assertNoOverlap(r, `${r.root.height}px`);
  }
  assert.deepStrictEqual(results[0].endLabels, [], "20px: no room for labels");
  assert.deepStrictEqual(results[1].endLabels, [], "40px: no room for labels");
  assert.deepStrictEqual(
    results[3].endLabels.map(l => l.text),
    ["0", "30"],
    "80px: labels fit",
  );
});

it("Canvas paints the same end labels, flush with the plot edges", async function () {
  this.timeout(60000);
  const canvas = `lib => (${LINE})(lib).renderer("canvas")`;
  const [svg, cnv] = await renderCharts([{src: LINE}, {src: canvas}]);
  assert.ok(cnv.canvas, "rendered to a canvas");
  assert.deepStrictEqual(cnv.endLabels, svg.endLabels);
  const [start, end] = cnv.endLabels;
  near(start.x, cnv.area.x, 0.01, "start label box at the plot's left edge");
  assert.strictEqual(start.anchor, "start");
  near(
    end.x + end.width,
    cnv.area.x + cnv.area.width,
    0.01,
    "end label box at the plot's right edge",
  );
  assert.strictEqual(end.anchor, "end");
  assert.ok(
    start.y > cnv.area.y + cnv.area.height,
    "the labels sit below the plot",
  );
});

it("a short chart that grows past the cutoff gets its x axis labels back", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:420px;height:150px'></div>",
    ({src}) =>
      new Promise(resolve => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus)
          .select("#viz")
          .legend(false)
          .duration(0);
        const read = () => {
          const texts = [];
          let bar;
          const walk = (n, path) => {
            if (
              n.type === "text" &&
              path.some(k => /plot-x-(axis|end-labels)/.test(k))
            )
              texts.push(n.lines.map(l => l.text).join(" "));
            if (n.key === "bar" && path.includes("plot-x-axis"))
              bar = n.paint.stroke;
            (n.children || []).forEach(c => walk(c, path.concat(n.key)));
          };
          walk(viz._paintedScene.root, []);
          return {texts, bar};
        };
        viz.render(() => {
          const short = read();
          viz.height(300).render(() => resolve({short, tall: read()}));
        });
      }),
    {src: LINE},
  );
  assert.deepStrictEqual(out.short.texts, ["0", "30"]);
  assert.strictEqual(
    out.short.bar,
    undefined,
    "the short chart draws no x axis line",
  );
  assert.ok(out.tall.texts.length > 2, `tall labels: ${out.tall.texts}`);
  assert.ok(
    out.tall.bar && out.tall.bar !== "transparent",
    "the tall chart draws its x axis line",
  );
});

it("zooming a short chart relabels the ends with the zoomed domain", async function () {
  this.timeout(60000);
  // A Plot's numeric x axis is linear (a LinePlot's is a point scale), so a zoom rescales it.
  const linear = `lib => {
    const data = [];
    for (let x = 0; x <= 30; x += 3) data.push({id: "a" + x, x, y: (x * 7) % 13 + 2});
    return new lib.Plot().data(data).groupBy("id").x("x").y("y");
  }`;
  const out = await render(
    "<div id='viz' style='width:420px;height:150px'></div>",
    ({src}) =>
      new Promise(resolve => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus)
          .select("#viz")
          .legend(false)
          .duration(0);
        const labels = nodes => {
          const found = [];
          const walk = n => {
            if (n.key === "plot-x-end-labels")
              n.children.forEach(t =>
                found.push({
                  text: t.lines.map(l => l.text).join(" "),
                  x: t.transform.x,
                  width: t.width,
                }),
              );
            (n.children || []).forEach(walk);
          };
          nodes.forEach(walk);
          return found;
        };
        viz.render(() => {
          const before = labels(viz._chartScene);
          viz._zoomRescale({k: 2, x: -100, y: 0});
          resolve({
            before,
            after: labels(viz._chartScene),
            area: viz._plotArea,
          });
        });
      }),
    {src: linear},
  );
  // The axis rounds its domain outward, as it does on a taller chart.
  assert.deepStrictEqual(
    out.before.map(l => l.text),
    ["-2", "32"],
  );
  assert.strictEqual(out.after.length, 2);
  const [a, b] = out.after.map(l => +l.text);
  assert.ok(
    a > -2 && b < 32 && a < b,
    `zoomed ends: ${out.after.map(l => l.text)}`,
  );
  near(out.after[0].x, out.area.x, 0.01, "zoomed start label stays flush left");
  near(
    out.after[1].x + out.after[1].width,
    out.area.x + out.area.width,
    0.01,
    "zoomed end label stays flush right",
  );
});

it("measureEndLabels formats and measures an axis's ends with its label config", async function () {
  this.timeout(60000);
  const out = await render("", () => {
    const {AxisBottom, measureEndLabels} = window.d3plus;
    const axis = new AxisBottom()
      .domain([0, 2500])
      .width(400)
      .height(100)
      .shapeConfig({labelConfig: {fontSize: 10, padding: 7}});
    axis.measure();
    const plain = measureEndLabels(axis);
    axis.tickFormat(d => `#${d}`).measure();
    const custom = measureEndLabels(axis);
    const empty = measureEndLabels(
      new AxisBottom()
        .domain([0, 1])
        .tickFormat(() => "")
        .measure(),
    );
    return {plain, custom, empty};
  });
  assert.deepStrictEqual(
    out.plain.labels.map(l => l.text),
    ["0", "2.5k"],
  );
  assert.strictEqual(out.plain.padding, 7);
  assert.strictEqual(out.plain.height, 14, "ceil(1.4 × 10px)");
  assert.ok(out.plain.labels.every(l => l.width > 0));
  assert.ok(out.plain.labels[1].width > out.plain.labels[0].width);
  assert.deepStrictEqual(
    out.custom.labels.map(l => l.text),
    ["#0", "#2500"],
  );
  assert.strictEqual(
    out.empty.height,
    0,
    "labels with no text claim no height",
  );
});

it("placeEndLabels positions a rendered axis's ends flush with the plot edges", async function () {
  this.timeout(60000);
  const out = await render("", () => {
    const {AxisBottom, placeEndLabels} = window.d3plus;
    const axis = new AxisBottom()
      .renderMode("compute")
      .select(null)
      .domain([10, 90])
      .width(400)
      .height(100)
      .render();
    return placeEndLabels(axis, [20, 380], 60);
  });
  assert.deepStrictEqual(
    out.map(b => [b.text, b.textAnchor, b.y, b.height]),
    [
      ["10", "start", 65, 17],
      ["90", "end", 65, 17],
    ],
  );
  assert.strictEqual(out[0].x, 20);
  assert.strictEqual(out[1].x + out[1].width, 380);
});

it("alignAxisLine moves a bottom axis's line and gridlines to the given y", async function () {
  this.timeout(60000);
  const out = await render("", () => {
    const {AxisBottom, alignAxisLine} = window.d3plus;
    const axis = new AxisBottom()
      .align("end")
      .renderMode("compute")
      .select(null)
      .domain([0, 10])
      .width(400)
      .height(200)
      .range([10, 390]);
    alignAxisLine(axis, 120);
    axis.render();
    const scene = axis.toScene();
    const bar = scene.children.find(n => n.key === "bar");
    const grid = scene.children.filter(
      n => typeof n.key === "string" && n.key.startsWith("grid-"),
    );
    return {bar: bar.points, grid: grid.map(g => g.points)};
  });
  assert.deepStrictEqual(
    out.bar.map(p => p[1]),
    [120, 120],
  );
  assert.ok(out.grid.length);
  for (const [a, b] of out.grid)
    assert.deepStrictEqual(
      [Math.max(a[1], b[1]), Math.min(a[1], b[1])],
      [120, 0],
    );
});

it("emitEndLabels draws the boxes with the axis's label config", async function () {
  this.timeout(60000);
  const out = await render("", () => {
    const {AxisBottom, emitEndLabels} = window.d3plus;
    const axis = new AxisBottom().shapeConfig({
      labelConfig: {fontColor: "rgb(0, 128, 0)", fontSize: 14, fontWeight: 700},
    });
    const group = emitEndLabels(axis, [
      {
        value: 0,
        text: "0",
        x: 10,
        y: 50,
        width: 100,
        height: 20,
        textAnchor: "start",
      },
      {
        value: 9,
        text: "9",
        x: 290,
        y: 50,
        width: 100,
        height: 20,
        textAnchor: "end",
      },
    ]);
    const lone = emitEndLabels(axis, [
      {
        value: 1,
        text: "1",
        x: 10,
        y: 50,
        width: 380,
        height: 20,
        textAnchor: "middle",
      },
    ]);
    return {
      none: emitEndLabels(axis, []),
      key: group.key,
      texts: group.children.map(t => ({
        key: t.key,
        text: t.lines[0].text,
        x: t.transform.x,
        anchor: t.font.anchor,
        fill: t.paint.fill,
        size: t.font.size,
        weight: t.font.weight,
        datum: t.datum,
      })),
      lone: lone.children.map(t => [t.key, t.font.anchor]),
    };
  });
  assert.strictEqual(out.none, null);
  assert.strictEqual(out.key, "plot-x-end-labels");
  assert.deepStrictEqual(
    out.texts.map(t => [t.key, t.text, t.x, t.anchor]),
    [
      ["start", "0", 10, "start"],
      ["end", "9", 290, "end"],
    ],
  );
  assert.ok(
    out.texts.every(
      t => t.fill === "rgb(0, 128, 0)" && t.size === 14 && t.weight === 700,
    ),
  );
  assert.deepStrictEqual(
    out.texts[1].datum.data,
    {id: 9, text: "9"},
    "accessors see the value and its text",
  );
  assert.deepStrictEqual(out.lone, [["middle", "middle"]]);
});

it("Axis keeps the label formatter its last layout resolved", async function () {
  this.timeout(60000);
  const out = await render("", () => {
    const {AxisBottom} = window.d3plus;
    const axis = new AxisBottom().domain([0, 5000]).measure();
    const scaleDefault = axis._labelFormat(5000);
    axis.tickFormat(d => `v${d}`).measure();
    return {scaleDefault, custom: axis._labelFormat(5)};
  });
  assert.strictEqual(out.scaleDefault, "5k");
  assert.strictEqual(out.custom, "v5");
});
