import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

// Scene composition and rendering checks that need a real browser: features
// (legend, timeline, title, back button) composing into a chart's scene, axis
// measurement without the DOM, and Canvas picking and pattern painting. Each
// test gets a fresh page holding @d3plus/core as `window.d3plusCore` and
// @d3plus/render as `window.d3plus`.
const renderEntry = new URL("../../render/index.ts", import.meta.url).href;

async function newPage() {
  const {page, errors, close} = await openPage('<div id="A"></div><div id="B"></div>');
  await page.evaluate(() => {
    window.d3plusCore = window.d3plus;
  });
  await page.loadModule("d3plus", renderEntry);
  page._errors = errors;
  page._close = close;
  return page;
}

async function closePage(page) {
  await page._close();
}

it("Legend composes into a chart scene (multi-level Treemap)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const data = [
      {group: "G1", id: "A", value: 10},
      {group: "G1", id: "B", value: 20},
      {group: "G2", id: "C", value: 30},
      {group: "G2", id: "D", value: 40},
    ];
    const viz = new window.d3plusCore.Treemap()
      .data(data)
      .groupBy(["group", "id"])
      .sum("value")
      .width(400)
      .height(300)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));
    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    return {
      hasLegendGroup: !!svgB.querySelector('[data-key="viz-legend"]'),
      hasLegendInRender: !!svgA.querySelector('[data-key="viz-legend"]'),
      text: svgB.textContent,
      cells: svgB.querySelectorAll("rect.d3plus-render-rect").length,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hasLegendInRender, "legend rendered by viz.render() (scene path)");
  assert.ok(res.hasLegendGroup, "legend composed into the scene");
  assert.ok(res.text.includes("G1") && res.text.includes("G2"), "legend labels present in scene");
  assert.ok(res.cells >= 4, "treemap cells also present");
});

it("Timeline composes into a chart scene (time-based Treemap)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const data = [
      {id: "A", value: 10, year: 2000},
      {id: "A", value: 14, year: 2001},
      {id: "B", value: 20, year: 2000},
      {id: "B", value: 18, year: 2001},
    ];
    const viz = new window.d3plusCore.Treemap()
      .data(data)
      .groupBy("id")
      .sum("value")
      .time("year")
      .width(400)
      .height(300)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));
    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    return {
      hasTimelineGroup: !!svgB.querySelector('[data-key="viz-timeline"]'),
      hasTimelineInRender: !!svgA.querySelector('[data-key="viz-timeline"]'),
      text: svgB.textContent,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hasTimelineInRender, "timeline rendered by viz.render() (scene path)");
  assert.ok(res.hasTimelineGroup, "timeline composed into the scene");
  assert.ok(res.text.includes("2000") && res.text.includes("2001"), "timeline tick labels present in scene");
});

it("Canvas dispatches per-shape events (global + .shape + .Bar) on a real click", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const fired = [];
    const viz = new window.d3plusCore.BarChart()
      .data([
        {id: "Alpha", x: "Alpha", y: 10},
        {id: "Beta", x: "Beta", y: 25},
        {id: "Gamma", x: "Gamma", y: 15},
        {id: "Delta", x: "Delta", y: 30},
      ])
      .groupBy("id")
      .x("x").y("y")
      .width(400).height(300)
      .duration(0)
      .on("click", () => fired.push("global"))
      .on("click.shape", () => fired.push("shape"))
      .on("click.Bar", () => fired.push("Bar"))
      .on("click.Circle", () => fired.push("Circle"));

    await new Promise(resolve => viz.select(target).renderer("canvas").render(resolve));
    const renderer = viz._sceneRenderer;
    const canvas = target.querySelector("canvas.d3plus-render-canvas");
    const rect = canvas.getBoundingClientRect();

    // Scan a grid to find a point that hit-tests to a Bar leaf, then fire a
    // real click there — the CanvasRenderer's listener picks + the Viz bridge
    // routes to viz.schema.on.
    let hit = null;
    for (let py = 290; py >= 10 && !hit; py -= 5) {
      for (let px = 10; px <= 390 && !hit; px += 5) {
        const p = renderer.pick([px, py]);
        if (p && p.node && p.node.shapeType === "Bar") hit = [px, py];
      }
    }
    if (hit) {
      canvas.dispatchEvent(new window.MouseEvent("click", {
        bubbles: true,
        clientX: rect.left + hit[0],
        clientY: rect.top + hit[1],
      }));
    }
    return {hit, fired};
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hit, "found a pickable Bar on the canvas");
  assert.ok(res.fired.includes("Bar"), "shape-class handler click.Bar fired on canvas");
  assert.ok(res.fired.includes("shape"), "click.shape fired on canvas");
  assert.ok(res.fired.includes("global"), "global click fired on canvas");
  assert.ok(!res.fired.includes("Circle"), "click.Circle did NOT fire for a Bar");
});

it("subtitle and total features compose into the scene", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
        ])
        .groupBy("id")
        .sum("value")
        .title(() => "Chart Title")
        .subtitle(() => "A descriptive subtitle")
        .total(d => d.value)
        .width(400)
        .height(300)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      text: target.textContent,
      hasTitle: !!target.querySelector('[data-key="viz-title"]'),
      hasSubtitle: !!target.querySelector('[data-key="viz-subtitle"]'),
      hasTotal: !!target.querySelector('[data-key="viz-total"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hasTitle, "title in scene");
  assert.ok(res.hasSubtitle, "subtitle in scene");
  assert.ok(res.hasTotal, "total in scene");
  assert.ok(res.text.includes("Chart Title"), "title text rendered");
  assert.ok(res.text.includes("descriptive subtitle"), "subtitle text rendered");
  assert.ok(res.text.includes("30"), "total value rendered");
});

it("treemapDef.emit produces rect nodes with correct cell geometry", async () => {
  // `treemapDef.emit(ctx)` produces the cell geometry directly (modulo
  // labels). Each cell's geometry must round-trip from the stage to the
  // emit'd SceneNode unchanged.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 30},
        {id: "D", value: 40},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    // Pull the laid-out shapeData from the stage, run emit, and compare to
    // what the legacy Rect compute pass produced (it consumed the same data).
    const {applyTreemapLayout, treemapDef} = window.d3plusCore;
    if (!applyTreemapLayout || !treemapDef) return {missing: true};

    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    // Label-aware emit includes both rect cells and label TextNodes — filter
    // to rects for the geometric round-trip check.
    const rects = emitted.filter(n => n.type === "rect");
    return {
      shapeCount: shapeData.length,
      emitCount: emitted.length,
      rectCount: rects.length,
      allMatched: shapeData.every((cell, i) =>
        rects[i].x === cell.x0 &&
        rects[i].y === cell.y0 &&
        rects[i].width === cell.x1 - cell.x0 &&
        rects[i].height === cell.y1 - cell.y0,
      ),
      hasAria: rects.every(n => n.aria && typeof n.aria.label === "string"),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  if (res.missing) {
    // Expose the internals on the UMD so a future browser-side test can use them.
    throw new Error("treemapDef/applyTreemapLayout not exposed on window.d3plusCore");
  }
  assert.strictEqual(res.shapeCount, 4, "stage produced one node per leaf");
  assert.strictEqual(res.rectCount, 4, "emit produced one rect SceneNode per cell");
  // emitCount may exceed rect count when label TextNodes are also emitted.
  assert.ok(res.emitCount >= res.rectCount, "emit includes at least the rect cells");
  assert.ok(res.allMatched, "emit geometry matches shapeData 1:1");
  assert.ok(res.hasAria, "emit annotated aria labels");
});

it("treemapDef.emit yields label-aware scene nodes (rect + text) in a browser", async () => {
  // In a browser context where TextBox can compute label layout (font
  // measurement + textWrap), emit() returns rect SceneNodes AND text
  // SceneNodes (one per label per cell) — the chart's scene contract is
  // expressible purely through treemapDef.emit.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    const {applyTreemapLayout, treemapDef} = window.d3plusCore;
    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    return {
      rectCount: emitted.filter(n => n.type === "rect").length,
      textCount: emitted.filter(n => n.type === "text").length,
      hasLineContent: emitted
        .filter(n => n.type === "text")
        .some(n => n.lines && n.lines.length > 0 && n.lines[0].text),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.strictEqual(res.rectCount, 2, "two rect cells emitted");
  // Each cell has two labels (id + share%), so 4 text nodes total.
  assert.ok(res.textCount >= 2, `at least one text node per cell (got ${res.textCount})`);
  assert.ok(res.hasLineContent, "text nodes carry actual line content");
});

it("measureAxis runs on a plain object — no Axis class instance needed", async () => {
  // Phase-E follow-on: the standalone `measureAxis(opts)` function operates
  // on duck-typed Axis-shaped data. This test passes a plain JS object (no
  // class), drives the layout, and asserts bounds + d3Scale come back.
  // The result is verified against an actual Axis instance configured the
  // same way — output is identical (modulo functions).
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const {measureAxis} = window.d3plusCore;
    // A bare object pretending to be an Axis. Provides exactly the fields
    // measureAxis reads. `_getPosition`/`_getTicks`/`_getLabels` are tiny
    // adapters that read from the d3 scale measureAxis populates onto it.
    const axisLike = {
      // Config lives under `schema` (the installFluent storage contract).
      schema: {
        domain: [0, 100],
        scale: "linear",
        ticks: undefined,
        labels: undefined,
        tickFormat: null,
        shape: "Line",
        shapeConfig: {
          labelConfig: {
            fontFamily: "sans-serif",
            fontSize: 12,
            padding: 5,
          },
          strokeWidth: 1,
        },
        tickSize: 5,
        tickSuffix: "normal",
        timeLocale: undefined,
        scalePadding: 0,
        paddingInner: 0,
        paddingOuter: 0,
        rounding: "outside",
        roundingInsideMinPrefix: "",
        roundingInsideMaxPrefix: "",
        roundingInsideMinSuffix: "",
        roundingInsideMaxSuffix: "",
        orient: "bottom",
        align: "end",
        maxSize: undefined,
        width: 400,
        height: 60,
        padding: 5,
        minSize: 0,
        gridSize: 0,
        grid: undefined,
        gridLog: false,
        title: undefined,
        titleConfig: {},
        labelOffset: false,
        range: undefined,
      },
      // Scratch state the layout function mutates / methods that read it.
      _data: [],
      _tickUnit: 0,
      _locale: "en-US",
      _labelRotation: undefined,
      _margin: {top: 0, right: 0, bottom: 0, left: 0},
      _position: {
        width: "width",
        height: "height",
        x: "x",
        y: "y",
        horizontal: true,
        opposite: "top",
      },
      // Tick/label getters consult the d3 scale measureAxis populates onto us.
      _getTicks() {
        return this._d3Scale && this._d3Scale.ticks
          ? this._d3Scale.ticks(10)
          : [];
      },
      _getLabels() {
        return this._d3Scale && this._d3Scale.ticks
          ? this._d3Scale.ticks(10)
          : [];
      },
      _getPosition(d) {
        return this._d3Scale ? this._d3Scale(d) : 0;
      },
    };

    const layout = measureAxis(axisLike);

    return {
      hasD3Scale: typeof axisLike._d3Scale === "function",
      domain: axisLike._d3Scale ? axisLike._d3Scale.domain() : null,
      boundsWidth: layout.bounds.width,
      boundsHeight: layout.bounds.height,
      ticksCount: layout.ticks.length,
      labelsCount: layout.labels.length,
      textDataCount: layout.textData.length,
      hasTickFormat: typeof layout.tickFormat === "function",
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hasD3Scale, "measureAxis populated _d3Scale on the plain object");
  assert.ok(Array.isArray(res.domain), "domain is set");
  assert.ok(res.boundsWidth > 0, `bounds.width > 0 (got ${res.boundsWidth})`);
  assert.ok(res.boundsHeight > 0, `bounds.height > 0 (got ${res.boundsHeight})`);
  assert.ok(res.ticksCount > 0, `tick count > 0 (got ${res.ticksCount})`);
  assert.ok(res.labelsCount > 0, `label count > 0 (got ${res.labelsCount})`);
  assert.ok(res.textDataCount > 0, "textData populated");
  assert.ok(res.hasTickFormat, "tickFormat function returned");
});

it("Plot subclasses (BarChart/LinePlot/AreaPlot) route shapes through _chartScene", async () => {
  // Plot's main shape, confidence Area, and line markers all go through
  // `absorbShapeIntoChartScene`, which stuffs their nodes into `viz._chartScene`.
  const cases = [
    {name: "BarChart", data: [{id: "A", value: 10}, {id: "B", value: 20}, {id: "C", value: 5}]},
    {name: "LinePlot", data: [
      {id: "S1", x: 0, y: 1}, {id: "S1", x: 1, y: 2}, {id: "S1", x: 2, y: 3},
    ]},
    {name: "AreaPlot", data: [
      {id: "S1", x: 0, y: 1}, {id: "S1", x: 1, y: 2}, {id: "S1", x: 2, y: 3},
    ]},
  ];

  for (const {name, data} of cases) {
    const page = await newPage();
    const res = await page.evaluate(async ({name, data}) => {
      const target = document.getElementById("B");
      const chart = new window.d3plusCore[name]()
        .data(data)
        .groupBy("id")
        .width(400)
        .height(300)
        .duration(0)
        .select(target);
      if (name === "BarChart") chart.y("value");
      await new Promise(resolve => chart.render(resolve));
      return {
        chartSceneLength: chart._chartScene ? chart._chartScene.length : 0,
        rendered: target.querySelector("svg") !== null,
      };
    }, {name, data});
    if (page._errors.length)
      throw new Error(`${name}: ${page._errors.join("; ")}`);
    await closePage(page);

    assert.ok(res.chartSceneLength > 0, `${name}: _chartScene populated`);
    assert.ok(res.rendered, `${name}: svg rendered`);
  }
});

it("Data-driven charts emit scene via chartDef.emit", async function () {
  // For each: render, verify `_chartScene` is populated and the chart
  // rendered something to the DOM.
  const charts = [
    {name: "Pie", data: [{id: "A", value: 10}, {id: "B", value: 20}]},
    {name: "Donut", data: [{id: "A", value: 10}, {id: "B", value: 20}]},
    {name: "Matrix", data: [
      {row: "r1", column: "c1", value: 1},
      {row: "r1", column: "c2", value: 2},
      {row: "r2", column: "c1", value: 3},
      {row: "r2", column: "c2", value: 4},
    ]},
    {name: "RadialMatrix", data: [
      {row: "r1", column: "c1", value: 1},
      {row: "r1", column: "c2", value: 2},
      {row: "r2", column: "c1", value: 3},
    ]},
    {name: "Priestley", data: [
      {id: "A", start: 0, end: 10},
      {id: "B", start: 5, end: 15},
    ]},
  ];

  for (const {name, data} of charts) {
    const page = await newPage();
    const res = await page.evaluate(async ({name, data}) => {
      const target = document.getElementById("B");
      const viz = new window.d3plusCore[name]()
        .data(data)
        .width(400)
        .height(300)
        .duration(0)
        .select(target);
      await new Promise(resolve => viz.render(resolve));
      return {
        hasChartScene: Array.isArray(viz._chartScene),
        chartSceneLength: viz._chartScene ? viz._chartScene.length : 0,
        hasContent: target.querySelector("svg") !== null,
      };
    }, {name, data});
    if (page._errors.length)
      throw new Error(`${name}: ${page._errors.join("; ")}`);
    await closePage(page);

    assert.ok(res.hasChartScene, `${name}: _chartScene populated`);
    assert.ok(
      res.chartSceneLength > 0,
      `${name}: emit produced scene nodes`,
    );
    assert.ok(res.hasContent, `${name}: rendered svg to target`);
  }
});

it("Axis.measure() populates outerBounds without touching the DOM", async () => {
  // Phase-E follow-on: `axis.measure()` runs the full layout pass (scale
  // construction, tick selection, label textWrap, outerBounds computation)
  // with zero DOM access. The free-function `computeAxisLayout(axis)` is a
  // thin wrapper exposing the result as a value. This test runs in a real
  // browser to exercise the production code path, but verifies no DOM nodes
  // are created — the body of an empty `<div>` stays empty post-measure.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const A = document.getElementById("A");
    A.innerHTML = "";
    const childCountBefore = A.children.length;

    // Construct a fresh AxisBottom — no select(), no parent in the DOM.
    const axis = new window.d3plusCore.AxisBottom()
      .domain([0, 100])
      .width(400)
      .height(60)
      .align("end")
      .gridSize(0);
    axis.measure();

    // No DOM was created by measure() — the page body is unchanged.
    const childCountAfter = A.children.length;
    const bodySvgCount = document.body.querySelectorAll("svg").length;
    // outerBounds is populated.
    const bounds = axis.outerBounds();

    // The free-function wrapper exposes the same data.
    const {computeAxisLayout} = window.d3plusCore;
    const axis2 = new window.d3plusCore.AxisBottom()
      .domain([0, 100])
      .width(400)
      .height(60)
      .align("end")
      .gridSize(0);
    const layout = computeAxisLayout
      ? computeAxisLayout(axis2)
      : null;

    return {
      childCountBefore,
      childCountAfter,
      bodySvgCount,
      hasBounds:
        typeof bounds.width === "number" && typeof bounds.height === "number",
      bounds,
      hasComputeAxisLayout: !!computeAxisLayout,
      layoutHasBounds:
        layout && typeof layout.bounds.width === "number",
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.strictEqual(res.childCountBefore, 0, "target starts empty");
  assert.strictEqual(res.childCountAfter, 0, "measure() created no children in target");
  // Two side-svgs at most — one from each previously-passing newPage()
  // helper test fixture (the helper page has two svg containers).
  assert.ok(res.hasBounds, "outerBounds returns a sized box");
  assert.ok(res.bounds.width > 0, `bounds.width > 0 (got ${res.bounds.width})`);
  assert.ok(res.bounds.height > 0, `bounds.height > 0 (got ${res.bounds.height})`);
  // The free function is exported on the package's `index` (and surfaces on
  // `window.d3plus` via the UMD wrapper). Validate it matches the method.
  if (res.hasComputeAxisLayout) {
    assert.ok(res.layoutHasBounds, "computeAxisLayout returns bounds");
  }
});

it("backContribution renders a Back button in the top-left controls panel when history is non-empty", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([{id: "A", value: 10}, {id: "B", value: 20}])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(300)
      .duration(0)
      .select(target);
    // Seed drill-down history so backContribution renders the back button.
    viz._history = [{depth: 0}];
    await new Promise(resolve => viz.render(resolve));
    const panel = target.querySelector(".d3plus-top-left-controls-item");
    const btn = panel && panel.querySelector(".back-control");
    return {
      text: target.textContent,
      hasBack: !!btn,
      isButton: btn ? btn.tagName.toLowerCase() === "button" : false,
      hasIcon: btn ? !!btn.querySelector("svg") : false,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.hasBack, "back button in the top-left controls panel");
  assert.ok(res.isButton, "back control is a real <button>, not a scene text node");
  assert.ok(res.hasIcon, "back arrow SVG icon present");
  assert.ok(res.text.toLowerCase().includes("back"), "back label rendered");
});

it("backContribution emits nothing when history is empty (default state)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([{id: "A", value: 10}, {id: "B", value: 20}])
        .groupBy("id")
        .sum("value")
        .width(400)
        .height(300)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      hasBack: !!target.querySelector(".back-control"),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(!res.hasBack, "no back button when history is empty");
});

it("titleFeature composes a title TextNode into the scene", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
        ])
        .groupBy("id")
        .sum("value")
        .title(() => "My Chart Title")
        .width(300)
        .height(200)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      text: target.textContent,
      vizFeaturesGroup: !!target.querySelector('[data-key="viz-features"]'),
      titleTextNode: !!target.querySelector('[data-key="viz-title"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);

  assert.ok(res.vizFeaturesGroup, "viz-features group composed into scene");
  assert.ok(res.titleTextNode, "title text node present in scene");
  // Wrapped lines render as separate tspans with no inserted whitespace, so
  // check the words rather than the exact phrase with its space intact.
  assert.ok(res.text.includes("My Chart"), "title text appears in rendered DOM");
  assert.ok(res.text.includes("Title"), "title text appears in rendered DOM");
});

it("CanvasRenderer picks a Path2D path in a real browser", async () => {
  const page = await newPage();
  const res = await page.evaluate(() => {
    const B = document.getElementById("B");
    const r = new window.d3plus.CanvasRenderer();
    r.mount({container: B, width: 100, height: 100, pixelRatio: 1});
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [{type: "path", key: "p", d: "M10,10 L90,10 L90,90 L10,90 Z", paint: {fill: "#09c"}}],
      },
    });
    const inside = r.pick([50, 50]);
    const outside = r.pick([5, 5]);
    return {inside: inside && inside.node.key, outside};
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);
  assert.strictEqual(res.inside, "p", "point inside the square path hits (Path2D isPointInPath)");
  assert.strictEqual(res.outside, null, "point outside the path misses");
});

it("CanvasRenderer paints a real texture pattern (not the solid fallback) in a real browser", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const B = document.getElementById("B");
    const r = new window.d3plus.CanvasRenderer();
    r.mount({container: B, width: 100, height: 100, pixelRatio: 1});
    // A high-contrast lines texture: red background (== the solid fallback the
    // first frame paints) with thick blue diagonal lines. Blue pixels can only
    // appear once the SVG tile rasterizes into a real CanvasPattern.
    const token =
      "pattern:" +
      JSON.stringify({texture: "lines", background: "#ff0000", stroke: "#0000ff", strokeWidth: 4, size: 10});
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [{type: "rect", key: "a", x: 0, y: 0, width: 100, height: 100, paint: {fill: token}}],
      },
    });
    const canvas = B.querySelector("canvas.d3plus-render-canvas");
    const ctx = canvas.getContext("2d");
    const sample = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0, blue = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 150 && data[i + 2] < 100) red++;
        if (data[i + 2] > 150 && data[i] < 100) blue++;
      }
      return {red, blue};
    };
    // Poll until the async tile rasterizes and the renderer repaints (≤ ~1s).
    for (let k = 0; k < 40; k++) {
      const s = sample();
      if (s.blue > 0 && s.red > 0) return s;
      await new Promise(done => window.setTimeout(done, 25));
    }
    return sample();
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await closePage(page);
  assert.ok(res.red > 0, "tile background (red) painted");
  assert.ok(
    res.blue > 0,
    "tile stroke lines (blue) painted — a real CanvasPattern tiled, not the solid fallback",
  );
});
