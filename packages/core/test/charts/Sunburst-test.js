import assert from "assert";
import {hsl} from "d3-color";
import {colorLighter} from "@d3plus/color";
import {render, closeBrowser} from "../playwright.js";

// The Viz render pipeline awaits browser layout that never resolves under
// jsdom, so the chart is rendered in a headless browser instead.
after(async () => {
  await closeBrowser();
});

const data = [
  {area: "Frontend", module: "Components", file: "Button", size: 120},
  {area: "Frontend", module: "Components", file: "Table", size: 410},
  {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
  {area: "Frontend", module: "Pages", file: "Settings", size: 180},
  {area: "Backend", module: "API", file: "Users", size: 330},
  {area: "Backend", module: "API", file: "Orders", size: 460},
  {area: "Backend", module: "Database", file: "Models", size: 290},
  {area: "Backend", module: "Jobs", file: "Email", size: 20},
  {area: "Docs", module: "Guides", file: "Theming", size: 40},
  {area: "Docs", module: "Reference", file: "API Reference", size: 260},
];

/** In-page helpers shared by every test: build + render a Sunburst, and route a scene event at a node. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.Sunburst()
      .select("#viz")
      .data(window.DATA.map(d => ({...d})))
      .groupBy(opts.groupBy || ["area", "module", "file"])
      .sum("size")
      .duration(0)
      .width(500).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.arcs = chart => chart._chartScene.filter(n => n.type === "path");
  window.arcFor = (chart, path) => window.arcs(chart).find(n => n.key === "sunburst-" + JSON.stringify(path));
  window.route = (chart, type, node) => chart._routeSceneEvent({
    type,
    point: [1, 1],
    pick: {node, datum: node.datum, index: node.index},
    nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
  });
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

it("Sunburst: draws one arc per node of a two-level hierarchy", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({groupBy: ["area", "module"]});
    return {
      svgPaths: document.querySelectorAll(
        "#viz svg.d3plus-render-svg path[data-key^='sunburst-']",
      ).length,
      arcs: window.arcs(chart).length,
      rings: [...new Set(window.arcs(chart).map(n => n.arc.innerRadius))]
        .length,
      hollow: Math.min(...window.arcs(chart).map(n => n.arc.innerRadius)) > 0,
    };
  });
  assert.strictEqual(out.arcs, 3 + 7, "3 areas + 7 modules");
  assert.strictEqual(out.svgPaths, out.arcs, "every arc reached the SVG");
  assert.strictEqual(out.rings, 2);
  assert.ok(out.hollow, "the unfocused center stays empty");
});

it("Sunburst: draws three rings, shading each top-level color lighter per ring and per sibling", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const fill = path => window.arcFor(chart, path).paint.fill;
    const labels = chart._chartScene.filter(n => n.type === "text");
    return {
      rings: [...new Set(window.arcs(chart).map(n => n.arc.innerRadius))]
        .length,
      frontend: fill(["Frontend"]),
      pages: fill(["Frontend", "Pages"]),
      components: fill(["Frontend", "Components"]),
      dashboard: fill(["Frontend", "Pages", "Dashboard"]),
      settings: fill(["Frontend", "Pages", "Settings"]),
      backend: fill(["Backend"]),
      legend: chart._legendClass
        .data()
        .map(d => chart.schema.shapeConfig.fill(d, 0)),
      labelCount: labels.length,
      arcCount: window.arcs(chart).length,
    };
  });
  assert.strictEqual(out.rings, 3);
  assert.ok(
    out.legend.includes(out.frontend),
    "the top ring keeps the legend color",
  );
  assert.notStrictEqual(
    out.backend,
    out.frontend,
    "a different branch gets a different color",
  );
  // Pages (700) outweighs Components (530); Dashboard (520) outweighs Settings (180).
  assert.strictEqual(
    out.pages,
    colorLighter(out.frontend, 0.1),
    "largest child: one ring lighter",
  );
  assert.strictEqual(
    out.components,
    colorLighter(out.frontend, 0.42),
    "smallest child: plus the full sibling spread",
  );
  assert.strictEqual(
    out.dashboard,
    colorLighter(out.frontend, 0.2),
    "two rings out",
  );
  assert.strictEqual(out.settings, colorLighter(out.frontend, 0.5), "capped");
  const hue = c => hsl(c).h;
  for (const c of [out.pages, out.components, out.dashboard, out.settings])
    assert.ok(
      Math.abs(hue(c) - hue(out.frontend)) < 1,
      "the branch keeps one hue",
    );
  assert.ok(
    out.labelCount > 0 && out.labelCount < out.arcCount,
    "only arcs with room get a label",
  );
});

it("Sunburst: shade(false), a user color, and a user fill all draw colors unshaded", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const fills = async config => {
      const chart = await window.build({config});
      return ["Frontend", "Frontend|Pages", "Frontend|Pages|Settings"].map(
        p => window.arcFor(chart, p.split("|")).paint.fill,
      );
    };
    return {
      off: await fills({shade: false}),
      color: await fills({
        color: d => (d.area === "Frontend" ? "#2f9e44" : "#e03131"),
      }),
      fill: await fills({shapeConfig: {fill: () => "#ae3ec9"}}),
      weak: await fills({shadeConfig: {depth: 0, sibling: 0.1}}),
    };
  });
  assert.strictEqual(new Set(out.off).size, 1, "shade(false)");
  assert.deepStrictEqual(
    out.color,
    ["#2f9e44", "#2f9e44", "#2f9e44"],
    "a color accessor",
  );
  assert.deepStrictEqual(
    out.fill,
    ["#ae3ec9", "#ae3ec9", "#ae3ec9"],
    "a shapeConfig fill",
  );
  assert.strictEqual(
    out.weak[1],
    out.weak[0],
    "no depth strength: the largest child matches its parent",
  );
  assert.strictEqual(
    out.weak[2],
    colorLighter(out.weak[0], 0.1),
    "custom sibling strength",
  );
});

it("Sunburst: labels break only between words and lean horizontal", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const long = window.DATA.map(d => ({
      ...d,
      module:
        d.module === "Database" ? "Infrastructural Persistence" : d.module,
    }));
    window.DATA = long;
    const chart = await window.build();
    const lines = n =>
      (n.lines || []).map(
        l => l.text ?? (l.runs || []).map(r => r.text).join(""),
      );
    const labels = chart._chartScene
      .filter(n => n.type === "text")
      .map(n => ({
        lines: lines(n),
        rotate: (n.transform && n.transform.rotate) || 0,
      }));
    const split = window.d3plus.sunburstSplit("Containerization orchestration");
    const metrics = window.d3plus.sunburstLabelMetrics("Docs Guides", s =>
      s.map(w => w.length),
    );
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(100);
    const zoomed = chart._chartScene
      .filter(n => n.type === "text")
      .map(n => ({
        lines: lines(n),
        rotate: (n.transform && n.transform.rotate) || 0,
      }));
    return {labels, split, metrics, zoomed};
  });
  const words = new Set(
    data
      .flatMap(d => [d.area, d.module, d.file])
      .concat(["Infrastructural", "Persistence"])
      .flatMap(t => t.split(" ")),
  );
  for (const {lines} of [...out.labels, ...out.zoomed])
    for (const line of lines) {
      assert.ok(!/[\u00AD-]$/.test(line), `no hyphenated break: ${line}`);
      for (const w of line.split(/\s+/).filter(Boolean))
        assert.ok(words.has(w) || w.endsWith("..."), `whole word: ${w}`);
    }
  assert.ok(out.labels.length > 5, "labels drawn");
  assert.ok(
    [...out.labels, ...out.zoomed].every(l => l.lines.length),
    "every label has text lines",
  );
  assert.deepStrictEqual(
    out.split.map(w => w.trim()),
    ["Containerization", "orchestration"],
  );
  assert.deepStrictEqual(out.metrics, {words: [4, 6], space: 1});
  const all = [...out.labels, ...out.zoomed];
  assert.ok(
    all.every(l => l.rotate > -90 && l.rotate <= 90),
    "never upside down",
  );
  const flat = all.filter(l => Math.abs(l.rotate) <= 45).length;
  assert.ok(
    flat > all.length / 2,
    `most labels within 45° of horizontal (${flat}/${all.length})`,
  );
  const api = out.zoomed.find(l => l.lines.join(" ") === "API");
  assert.strictEqual(api.rotate, 0, "a roomy zoomed arc reads horizontally");
});

it("Sunburst: colors every arc by its summed value under a colorScale", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({config: {colorScale: "size"}});
    const fill = path => window.arcFor(chart, path).paint.fill;
    return {
      parent: fill(["Frontend"]),
      children: [
        fill(["Frontend", "Pages", "Dashboard"]),
        fill(["Frontend", "Components", "Button"]),
      ],
      scale: Boolean(
        chart._colorScaleClass && chart._colorScaleClass._colorScale,
      ),
    };
  });
  assert.ok(out.scale, "the colorScale was built");
  assert.notStrictEqual(
    out.children[0],
    out.children[1],
    "leaves differ by value",
  );
  assert.strictEqual(
    out.parent,
    out.children[0],
    "a parent's own (larger) sum lands in the top bucket, with the largest leaf",
  );
});

it("Sunburst: hover highlights the arc and its ancestors and adds a share-of-parent tooltip row", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const target = window.arcFor(chart, ["Backend", "API", "Orders"]);
    window.route(chart, "mouseenter", target);
    window.route(chart, "mousemove", target);
    await window.wait(50);
    const bright = window
      .arcs(chart)
      .filter(n => chart._hover(n.datum, 0))
      .map(n => n.key)
      .sort();
    const tooltip = document.querySelector(".d3plus-tooltip");
    return {bright, tooltip: tooltip ? tooltip.textContent : ""};
  });
  assert.deepStrictEqual(out.bright, [
    'sunburst-["Backend","API","Orders"]',
    'sunburst-["Backend","API"]',
    'sunburst-["Backend"]',
  ]);
  assert.ok(out.tooltip.includes("Orders"), out.tooltip);
  assert.ok(out.tooltip.includes("Share of Parent"), out.tooltip);
});

it("Sunburst: click zooms into an arc, and the center and Back zoom out", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const before = window.arcFor(chart, ["Backend", "API"]).arc;
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(100);
    const center = window.arcFor(chart, ["Backend"]);
    const zoomed = {
      history: chart._history.length,
      center: center.arc,
      apiSpan: window.arcFor(chart, ["Backend", "API"]).arc,
      frontend: window.arcFor(chart, ["Frontend"]),
      back: Boolean(document.querySelector("#viz .back-control")),
    };
    window.route(chart, "click", center);
    await window.wait(100);
    const viaCenter = {
      history: chart._history.length,
      frontend: Boolean(window.arcFor(chart, ["Frontend"])),
    };
    window.route(chart, "click", window.arcFor(chart, ["Backend", "API"]));
    await window.wait(100);
    const deep = {
      center: Boolean(
        window.arcFor(chart, ["Backend", "API"]).arc.innerRadius === 0,
      ),
    };
    document.querySelector("#viz .back-control").click();
    await window.wait(100);
    return {
      before,
      zoomed,
      viaCenter,
      deep,
      afterBack: {
        history: chart._history.length,
        rings: [...new Set(window.arcs(chart).map(n => n.arc.innerRadius))]
          .length,
      },
    };
  });
  assert.strictEqual(out.zoomed.history, 1);
  assert.deepStrictEqual(
    [
      out.zoomed.center.innerRadius,
      out.zoomed.center.startAngle,
      out.zoomed.center.endAngle,
    ],
    [0, 0, Math.PI * 2],
    "the clicked arc became the center disc",
  );
  assert.ok(
    out.zoomed.apiSpan.endAngle - out.zoomed.apiSpan.startAngle >
      out.before.endAngle - out.before.startAngle,
    "descendants widen to fill the circle",
  );
  assert.ok(!out.zoomed.frontend.datum, "a sibling is no longer a data arc");
  assert.strictEqual(
    out.zoomed.frontend.arc.startAngle,
    out.zoomed.frontend.arc.endAngle,
    "it folds to zero width",
  );
  assert.ok(out.zoomed.back, "the Back control appears");
  assert.deepStrictEqual(
    out.viaCenter,
    {history: 0, frontend: true},
    "clicking the center zooms out",
  );
  assert.ok(out.deep.center, "a second-ring arc can be zoomed into directly");
  assert.deepStrictEqual(
    out.afterBack,
    {history: 0, rings: 3},
    "Back restores the full sunburst",
  );
});

it("Sunburst: renders on Canvas and hit-tests a real click into a zoom", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({renderer: "canvas"});
    const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
    const target = window.arcFor(chart, ["Frontend"]);
    const t = chart._chartTransform;
    const mid = (target.arc.startAngle + target.arc.endAngle) / 2;
    const r = (target.arc.innerRadius + target.arc.outerRadius) / 2;
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + t.x + r * Math.sin(mid);
    const clientY = rect.top + t.y - r * Math.cos(mid);
    canvas.dispatchEvent(
      new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
    );
    canvas.dispatchEvent(
      new MouseEvent("click", {clientX, clientY, bubbles: true}),
    );
    await window.wait(150);
    return {
      canvas: Boolean(canvas),
      svgArcs: document.querySelectorAll("#viz path[data-key^='sunburst-']")
        .length,
      history: chart._history.length,
      center: window.arcFor(chart, ["Frontend"]).arc.innerRadius,
    };
  });
  assert.ok(out.canvas, "painted to a canvas");
  assert.strictEqual(out.svgArcs, 0, "no SVG arcs");
  assert.strictEqual(out.history, 1, "the click hit the Frontend arc");
  assert.strictEqual(out.center, 0, "Frontend is the center disc");
});

it("Sunburst: buckets the leaves under the threshold into one arc per parent", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({
      config: {threshold: 0.05, thresholdName: "Files"},
    });
    const buckets = window
      .arcs(chart)
      .filter(n => n.datum && n.datum._isAggregation);
    return {
      buckets: buckets.map(n => n.key),
      label: buckets.length ? chart._drawLabel(buckets[0].datum, 0) : "",
      jobs: window.arcFor(chart, ["Backend", "Jobs"]).datum._isAggregation,
    };
  });
  assert.strictEqual(
    out.buckets.length,
    3,
    "Button, Email, and Theming (<5%) each bucket within their own module",
  );
  assert.ok(out.label.startsWith("Files < 5"), out.label);
  assert.strictEqual(
    out.jobs,
    undefined,
    "the bucket's parent is not itself a bucket",
  );
});
