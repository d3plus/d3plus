import assert from "assert";
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

it("Sunburst: draws three rings whose children inherit their top-level color, with labels where they fit", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const fill = path => window.arcFor(chart, path).paint.fill;
    const labels = chart._chartScene.filter(n => n.type === "text");
    return {
      rings: [...new Set(window.arcs(chart).map(n => n.arc.innerRadius))]
        .length,
      frontend: [
        fill(["Frontend"]),
        fill(["Frontend", "Pages"]),
        fill(["Frontend", "Pages", "Dashboard"]),
      ],
      backend: fill(["Backend", "Jobs", "Email"]),
      labelCount: labels.length,
      arcCount: window.arcs(chart).length,
      rotated: labels.some(n => n.transform && n.transform.rotate),
    };
  });
  assert.strictEqual(out.rings, 3);
  assert.strictEqual(
    new Set(out.frontend).size,
    1,
    "Frontend's descendants share its color",
  );
  assert.notStrictEqual(
    out.backend,
    out.frontend[0],
    "a different branch gets a different color",
  );
  assert.ok(
    out.labelCount > 0 && out.labelCount < out.arcCount,
    "only arcs with room get a label",
  );
  assert.ok(out.rotated, "ring labels follow the arcs");
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
