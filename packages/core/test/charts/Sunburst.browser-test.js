import assert from "assert";
import {hsl} from "d3-color";
import {colorLighter} from "@d3plus/color";
import {labelRotations} from "../../es/src/charts/Sunburst/labelFit.js";
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

it("Sunburst: draws three rings, shading each top-level color a step lighter per ring", async function () {
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
  // The shade depends on the ring alone, not on an arc's size among its siblings.
  assert.strictEqual(
    out.pages,
    colorLighter(out.frontend, 0.22),
    "second ring",
  );
  assert.strictEqual(
    out.components,
    out.pages,
    "the same ring, the same shade",
  );
  assert.strictEqual(
    out.dashboard,
    colorLighter(out.frontend, 0.44),
    "third ring",
  );
  assert.strictEqual(
    out.settings,
    out.dashboard,
    "the same ring, the same shade",
  );
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

it("Sunburst: shadeConfig tunes the shading; shade(false), a user color, and a user fill draw unshaded", async function () {
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
      weak: await fills({shadeConfig: {step: 0.1}}),
      capped: await fills({shadeConfig: {step: 0.4, max: 0.5}}),
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
    colorLighter(out.weak[0], 0.1),
    "custom step",
  );
  assert.strictEqual(
    out.weak[2],
    colorLighter(out.weak[0], 0.2),
    "custom step, two rings out",
  );
  assert.strictEqual(
    out.capped[2],
    colorLighter(out.capped[0], 0.5),
    "custom cap",
  );
});

it("Sunburst: labels break only between words and run along the ring or the radius", async function () {
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
      .map(n => {
        const arc = window
          .arcs(chart)
          .find(a => n.key && n.key.startsWith(a.key + "_"));
        const mid = arc
          ? ((arc.arc.startAngle + arc.arc.endAngle) / 2) * (180 / Math.PI)
          : null;
        const disc = Boolean(arc && arc.arc.innerRadius === 0);
        return {
          key: n.key,
          lines: lines(n),
          rotate: (n.transform && n.transform.rotate) || 0,
          mid,
          disc,
        };
      });
    const split = window.d3plus.sunburstSplit("Containerization orchestration");
    const metrics = window.d3plus.sunburstLabelMetrics("Docs Guides", s =>
      s.map(w => w.length),
    );
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(100);
    const zoomed = chart._chartScene
      .filter(n => n.type === "text")
      .map(n => {
        const arc = window
          .arcs(chart)
          .find(a => n.key && n.key.startsWith(a.key + "_"));
        const mid = arc
          ? ((arc.arc.startAngle + arc.arc.endAngle) / 2) * (180 / Math.PI)
          : null;
        const disc = Boolean(arc && arc.arc.innerRadius === 0);
        return {
          key: n.key,
          lines: lines(n),
          rotate: (n.transform && n.transform.rotate) || 0,
          mid,
          disc,
        };
      });
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
    all.every(l => l.rotate >= -90 && l.rotate <= 90),
    "never upside down",
  );
  for (const l of all) {
    assert.ok(l.mid !== null, `label ${l.key} pairs with its arc`);
    if (l.disc) {
      assert.strictEqual(l.rotate, 0, "the center label stays upright");
      continue;
    }
    const {tangential, radial} = labelRotations(((l.mid % 360) + 360) % 360);
    assert.ok(
      [tangential, radial].some(x => Math.abs(l.rotate - x) < 1e-6),
      `${l.lines.join(" ")} at ${l.mid.toFixed(1)}° rotates ${l.rotate}°, not along the ring (${tangential}°) or radius (${radial}°)`,
    );
  }
  assert.ok(
    all.some(l => l.rotate !== 0),
    "ring labels turn with their arcs",
  );
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

it("Sunburst: zooming out plays the zoom-in in reverse", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    chart.duration(600);
    const dOf = path => {
      const el = document.querySelector(
        `#viz path[data-key='sunburst-${JSON.stringify(path)}']`,
      );
      return el ? el.getAttribute("d") : null;
    };
    const texts = () => chart._chartScene.filter(n => n.type === "text").length;
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(800);
    const zoomed = {api: dOf(["Backend", "API"]), center: dOf(["Backend"])};
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(0);
    const entering = window.arcs(chart).filter(n => n.enterArc);
    const scene = {
      entering: entering.map(n => n.key).sort(),
      starts: entering.map(n => [n.enterArc.startAngle, n.enterArc.endAngle]),
      backend: Boolean(window.arcFor(chart, ["Backend"]).enterArc),
      texts: texts(),
    };
    await window.wait(220);
    const mid = {api: dOf(["Backend", "API"]), center: dOf(["Backend"])};
    await window.wait(800);
    const end = {
      api: dOf(["Backend", "API"]),
      center: dOf(["Backend"]),
      texts: texts(),
    };
    return {zoomed, scene, mid, end};
  });
  const returning = ["Frontend", "Docs"].map(
    a => `sunburst-${JSON.stringify([a])}`,
  );
  for (const key of returning)
    assert.ok(out.scene.entering.includes(key), `${key} sweeps back in`);
  assert.ok(
    !out.scene.backend,
    "the old center is not entering: it shrinks back into its ring",
  );
  assert.ok(
    out.scene.starts.every(
      ([s, e]) => s === e && (s === 0 || Math.abs(s - Math.PI * 2) < 1e-9),
    ),
    "returning arcs start folded at 0 or 2π",
  );
  for (const k of ["api", "center"]) {
    assert.notStrictEqual(
      out.mid[k],
      out.zoomed[k],
      `${k} has left its zoomed shape mid-animation`,
    );
    assert.notStrictEqual(
      out.mid[k],
      out.end[k],
      `${k} hasn't reached its final shape mid-animation`,
    );
  }
  assert.ok(
    out.scene.texts > 0 && out.end.texts > 0,
    "labels are drawn throughout",
  );
});

it("Sunburst: zooming out one of two levels returns the outer level's siblings, on Canvas too", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({renderer: "canvas"});
    chart.duration(600);
    window.route(chart, "click", window.arcFor(chart, ["Backend"]));
    await window.wait(800);
    window.route(chart, "click", window.arcFor(chart, ["Backend", "API"]));
    await window.wait(800);
    window.route(chart, "click", window.arcFor(chart, ["Backend", "API"]));
    await window.wait(0);
    const entering = window
      .arcs(chart)
      .filter(n => n.enterArc)
      .map(n => n.key);
    const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
    await window.wait(220);
    const mid = canvas.toDataURL();
    await window.wait(900);
    const end = canvas.toDataURL();
    return {
      entering,
      history: chart._history.length,
      center: window.arcFor(chart, ["Backend"]).arc.innerRadius,
      changed: mid !== end,
    };
  });
  assert.strictEqual(out.history, 1, "one level up");
  assert.strictEqual(out.center, 0, "Backend is the center again");
  assert.ok(
    out.entering.includes('sunburst-["Backend","Database"]'),
    "API's siblings sweep back in",
  );
  assert.ok(
    !out.entering.some(k => k.includes("Frontend")),
    "the level above stays out",
  );
  assert.ok(out.changed, "the canvas is still animating mid-way");
});

it("Sunburst: keeps a data field named share, with d3plus's Share row beside it", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    window.DATA = window.DATA.map((d, i) => ({...d, share: i + 1}));
    const chart = await window.build();
    const leaf = window.arcFor(chart, ["Backend", "API", "Orders"]);
    const parent = window.arcFor(chart, ["Backend"]);
    window.route(chart, "mouseenter", leaf);
    window.route(chart, "mousemove", leaf);
    await window.wait(50);
    const rows = [...document.querySelectorAll(".d3plus-tooltip-tbody tr")].map(
      tr => [...tr.querySelectorAll("td")].map(td => td.textContent),
    );
    return {
      leafShare: leaf.datum.share,
      leafComputed: leaf.datum.__d3plusShare,
      parentShare: parent.datum.share,
      rows,
    };
  });
  // Orders is the sixth row (share: 6) and 460 of the 2630 total.
  assert.strictEqual(out.leafShare, 6, "the row keeps its own share");
  assert.ok(
    Math.abs(out.leafComputed - 460 / 2630) < 1e-9,
    "d3plus's share lives under its own key",
  );
  assert.strictEqual(
    out.parentShare,
    5 + 6 + 7 + 8,
    "a parent merges its rows' own share fields",
  );
  const share = out.rows.find(r => r[0] === "Share");
  assert.ok(
    share && share[1] === "17.5%",
    `Share row shows d3plus's fraction: ${JSON.stringify(out.rows)}`,
  );
});

it("Sunburst: shadeConfig deep-merges and RESET restores the chart's default", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const {RESET} = window.d3plus;
    const chart = await window.build();
    const third = () =>
      window.arcFor(chart, ["Frontend", "Pages", "Settings"]).paint.fill;
    const top = window.arcFor(chart, ["Frontend"]).paint.fill;
    chart.shadeConfig({max: 0.3});
    const merged = {...chart.shadeConfig()};
    await new Promise(resolve => chart.render(resolve));
    const capped = third();
    chart.shadeConfig({step: 0.1, max: RESET});
    const partial = {...chart.shadeConfig()};
    chart.config({shadeConfig: RESET});
    const reset = {...chart.shadeConfig()};
    await new Promise(resolve => chart.render(resolve));
    return {top, merged, capped, partial, reset, restored: third()};
  });
  assert.deepStrictEqual(
    out.merged,
    {step: 0.22, max: 0.3},
    "setting max keeps step",
  );
  assert.strictEqual(
    out.capped,
    colorLighter(out.top, 0.3),
    "the third ring is capped at the new max",
  );
  assert.deepStrictEqual(
    out.partial,
    {step: 0.1, max: 0.6},
    "RESET at one key restores just that key",
  );
  assert.deepStrictEqual(
    out.reset,
    {step: 0.22, max: 0.6},
    "RESET restores the Sunburst default",
  );
  assert.strictEqual(out.restored, colorLighter(out.top, 0.44));
});

it("Sunburst: shapeConfig and tooltipConfig keep the chart's defaults through merges and RESET, without warnings", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const {RESET} = window.d3plus;
    const warnings = [];
    const warn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));
    const chart = await window.build();
    const fill = () => window.arcFor(chart, ["Frontend", "Pages"]).paint.fill;
    const top = window.arcFor(chart, ["Frontend"]).paint.fill;
    const parentRow = async () => {
      const node = window.arcFor(chart, ["Backend", "API", "Orders"]);
      window.route(chart, "mouseenter", node);
      window.route(chart, "mousemove", node);
      await window.wait(50);
      return [
        ...document.querySelectorAll(".d3plus-tooltip-tbody tr td:first-child"),
      ].map(td => td.textContent);
    };

    chart.shapeConfig({stroke: "#fff"});
    const sc = chart.shapeConfig();
    const kept = {
      strokeWidth: sc.strokeWidth,
      path: sc.Path && sc.Path.labelConfig && sc.Path.labelConfig.fontResize,
    };
    await new Promise(resolve => chart.render(resolve));
    const shadedAfterStroke = fill();
    chart.shapeConfig({fill: () => "#123456"});
    await new Promise(resolve => chart.render(resolve));
    const userFill = fill();
    chart.config({shapeConfig: {fill: RESET}});
    await new Promise(resolve => chart.render(resolve));
    const shadedAfterReset = fill();
    chart.shapeConfig({fill: () => "#654321"});
    chart.shapeConfig({fill: RESET});
    await new Promise(resolve => chart.render(resolve));
    const shadedAfterDirectReset = fill();

    chart.tooltipConfig({title: () => "Custom"});
    const rowsAfterTitle = await parentRow();
    chart.config({tooltipConfig: RESET});
    const rowsAfterReset = await parentRow();
    chart.tooltipConfig({footer: "Mine"});
    chart.tooltipConfig({footer: RESET});
    const rowsAfterDirect = await parentRow();
    chart.tooltipConfig(RESET);
    const rowsAfterDirectReset = await parentRow();

    // Every story's config, through the public setters.
    for (const config of [
      {ringSize: "area", padPixel: 2, innerRadius: 0},
      {shadeConfig: {step: 0.3, max: 0.5}},
      {threshold: 0.03, thresholdName: "Files"},
    ])
      await window.build({config});
    console.warn = warn;
    return {
      top,
      kept,
      shadedAfterStroke,
      userFill,
      shadedAfterReset,
      shadedAfterDirectReset,
      rowsAfterTitle,
      rowsAfterReset,
      rowsAfterDirect,
      rowsAfterDirectReset,
      warnings,
    };
  });
  assert.deepStrictEqual(
    out.kept,
    {strokeWidth: 1, path: true},
    "a nested override keeps the chart's other shapeConfig defaults",
  );
  assert.strictEqual(
    out.shadedAfterStroke,
    colorLighter(out.top, 0.22),
    "shading survives a shapeConfig merge",
  );
  assert.strictEqual(out.userFill, "#123456", "a user fill is drawn as given");
  assert.strictEqual(
    out.shadedAfterReset,
    colorLighter(out.top, 0.22),
    "RESET brings back the default fill, and its shading",
  );
  assert.deepStrictEqual(
    out.rowsAfterTitle,
    ["Share", "Share of Parent"],
    "a tooltipConfig merge keeps the Share rows",
  );
  assert.deepStrictEqual(
    out.rowsAfterReset,
    ["Share", "Share of Parent"],
    "RESET restores them",
  );
  assert.strictEqual(
    out.shadedAfterDirectReset,
    colorLighter(out.top, 0.22),
    "a direct shapeConfig({fill: RESET}) restores the shaded default",
  );
  assert.deepStrictEqual(
    out.rowsAfterDirect,
    ["Share", "Share of Parent"],
    "direct tooltipConfig merges keep the Share rows",
  );
  assert.deepStrictEqual(
    out.rowsAfterDirectReset,
    ["Share", "Share of Parent"],
    "a direct tooltipConfig(RESET) restores them",
  );
  assert.deepStrictEqual(out.warnings, [], "no config warnings");
});

/**
    Records every Sunburst label through one transition: on SVG by sampling
    the DOM, on Canvas by recording each painted frame. Each sample carries
    the transition's progress `t` (0–1, by time) and each label's place,
    text, and opacity.
*/
const recordLabels = `
  window.recordLabels = (chart, duration, action) => new Promise(async resolve => {
    const canvas = chart._renderer === "canvas";
    const samples = [];
    let start;
    const renderer = chart._sceneRenderer;
    const drawScene = renderer.drawScene.bind(renderer);
    renderer.drawScene = (scene, opts) => {
      if (start === undefined && opts && opts.duration) start = performance.now();
      return drawScene(scene, opts);
    };
    const fromFrame = frame => {
      const labels = {};
      const walk = n => {
        if (n.type === "text" && String(n.key).startsWith("sunburst-"))
          labels[n.key] = {
            place: JSON.stringify(n.transform || {}),
            text: (n.lines || []).map(l => l.text).join(" "),
            opacity: n.paint && n.paint.opacity !== undefined ? n.paint.opacity : 1,
          };
        (n.children || []).forEach(walk);
      };
      walk(frame.root);
      return labels;
    };
    const fromDom = () => {
      const labels = {};
      for (const el of document.querySelectorAll("#viz text[data-key^='sunburst-']")) {
        const op = el.getAttribute("opacity");
        labels[el.getAttribute("data-key")] = {
          place: el.getAttribute("transform"),
          text: el.textContent,
          opacity: op === null ? 1 : Number(op),
        };
      }
      return labels;
    };
    const paint = renderer._paint && renderer._paint.bind(renderer);
    if (canvas) renderer._paint = frame => {
      if (start !== undefined) samples.push({t: (performance.now() - start) / duration, labels: fromFrame(frame)});
      return paint(frame);
    };
    const before = canvas ? fromFrame(renderer._scene) : fromDom();
    action();
    const timer = canvas ? null : setInterval(() => {
      if (start !== undefined) samples.push({t: (performance.now() - start) / duration, labels: fromDom()});
    }, 25);
    await new Promise(r => setTimeout(r, duration + 400));
    if (timer) clearInterval(timer);
    renderer.drawScene = drawScene;
    if (canvas) renderer._paint = paint;
    resolve({before, after: canvas ? fromFrame(renderer._scene) : fromDom(), samples});
  });
`;

/** Checks one recorded transition against the fade-swap rules. */
function assertLabelsFade({before, after, samples}, name) {
  const moved = Object.keys(before).filter(
    k =>
      after[k] &&
      (after[k].place !== before[k].place || after[k].text !== before[k].text),
  );
  const still = Object.keys(before).filter(k => after[k] && !moved.includes(k));
  assert.ok(moved.length > 0, `${name}: some labels move`);
  assert.ok(
    samples.length > 5,
    `${name}: sampled the transition (${samples.length})`,
  );
  const inner = samples.filter(s => s.t > 0.02 && s.t < 0.98);
  for (const k of moved) {
    const seen = inner
      .filter(s => s.labels[k])
      .map(s => ({t: s.t, ...s.labels[k]}));
    for (const s of seen)
      assert.ok(
        s.place === before[k].place || s.place === after[k].place,
        `${name}: ${k} drawn in between at t=${s.t.toFixed(2)}`,
      );
    const early = seen.filter(s => s.t < 0.2);
    assert.ok(early.length, `${name}: ${k} sampled early`);
    for (const s of early)
      assert.strictEqual(
        s.place,
        before[k].place,
        `${name}: ${k} stays put while fading out`,
      );
    assert.ok(
      early.some(s => s.opacity < 1),
      `${name}: ${k} fades out early`,
    );
    early.forEach(
      (s, i) =>
        i &&
        assert.ok(
          s.opacity <= early[i - 1].opacity + 1e-9,
          `${name}: ${k} fading out`,
        ),
    );
    const late = seen.filter(s => s.t > 0.8 && s.opacity > 0);
    assert.ok(late.length, `${name}: ${k} fades back in`);
    for (const s of late)
      assert.strictEqual(
        s.place,
        after[k].place,
        `${name}: ${k} reappears at its new place`,
      );
    late.forEach(
      (s, i) =>
        i &&
        assert.ok(
          s.opacity >= late[i - 1].opacity - 1e-9,
          `${name}: ${k} fading in`,
        ),
    );
  }
  for (const k of still)
    for (const s of inner)
      if (s.labels[k])
        assert.strictEqual(
          s.labels[k].opacity,
          1,
          `${name}: unmoved ${k} stays opaque`,
        );
}

for (const renderer of ["svg", "canvas"]) {
  it(`Sunburst: labels fade out in place and back in at their new place on zoom in, out, and Back (${renderer})`, async function () {
    this.timeout(120000);
    const out = await page(
      async ({renderer, recorder}) => {
        new Function(recorder)();
        const chart = await window.build({renderer});
        const duration = 1000;
        chart.duration(duration);
        const zoomIn = await window.recordLabels(chart, duration, () =>
          window.route(chart, "click", window.arcFor(chart, ["Backend"])),
        );
        const zoomOut = await window.recordLabels(chart, duration, () =>
          window.route(chart, "click", window.arcFor(chart, ["Backend"])),
        );
        await window.recordLabels(chart, duration, () =>
          window.route(chart, "click", window.arcFor(chart, ["Frontend"])),
        );
        const back = await window.recordLabels(chart, duration, () =>
          document.querySelector("#viz .back-control").click(),
        );
        return {zoomIn, zoomOut, back};
      },
      {renderer, recorder: recordLabels},
    );
    assertLabelsFade(out.zoomIn, "zoom in");
    assertLabelsFade(out.zoomOut, "zoom out");
    assertLabelsFade(out.back, "Back");
  });
}
