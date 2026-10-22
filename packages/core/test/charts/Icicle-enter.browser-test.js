import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {cubicInOut} from "@d3plus/render";
import {render} from "~test/browser/render.js";

const data = [
  {area: "App", module: "Charts", file: "Treemap", size: 120},
  {area: "App", module: "Charts", file: "Icicle", size: 80},
  {area: "App", module: "Shapes", file: "Rect", size: 60},
  {area: "Docs", module: "Guides", file: "Theming", size: 40},
  {area: "Docs", module: "Reference", file: "API", size: 260},
];

const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.Icicle()
      .select("#viz")
      .data(opts.data || window.DATA.map(d => ({...d})))
      .groupBy(["area", "module", "file"])
      .sum("size")
      .duration(0)
      .width(500).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.rects = chart => chart._chartScene.filter(n => n.type === "rect" && n.key && n.key.startsWith("icicle-") && n.datum);
  window.rectFor = (chart, path) => window.rects(chart).find(n => n.key === "icicle-" + JSON.stringify(path));
  window.route = (chart, type, node) => chart._routeSceneEvent({
    type,
    point: [1, 1],
    pick: node && {node, datum: node.datum, index: node.index},
    nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
  });
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.depth = n => JSON.parse(n.key.slice("icicle-".length)).length;
  window.tooltipShown = chart => chart._tooltipClass.data().length > 0;
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    new Function("arg", `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`),
    {data, arg},
  );

it("Icicle: the first draw grows each rect out of its root edge, each level after the one before", async function () {
  for (const orient of ["horizontal", "vertical"]) {
    const out = await page(async orient => {
      const chart = await window.build({config: {orient}});
      const rects = window.rects(chart);
      const labels = chart._chartScene.filter(n => n.type === "text" && n.key.startsWith("icicle-"));
      return {
        rects: rects.map(n => ({depth: window.depth(n), box: {x: n.x, y: n.y, width: n.width, height: n.height}, enterRect: n.enterRect, enterWindow: n.enterWindow})),
        labels: labels.map(n => ({key: n.key, enterWindow: n.enterWindow})),
        rectWindows: Object.fromEntries(rects.map(n => [n.key, n.enterWindow])),
      };
    }, orient);
    for (const {box, enterRect} of out.rects) {
      const edge = orient === "vertical"
        ? {x: box.x + box.width / 2, y: box.y, width: 0, height: 0}
        : {x: box.x, y: box.y + box.height / 2, width: 0, height: 0};
      assert.deepStrictEqual(enterRect, edge, `${orient}: on the root edge`);
    }
    const windowAt = depth => out.rects.find(r => r.depth === depth).enterWindow;
    assert.ok(out.rects.every(r => JSON.stringify(r.enterWindow) === JSON.stringify(windowAt(r.depth))), "one window per level");
    assert.deepStrictEqual(windowAt(1), {start: 0, end: cubicInOut(1 / 3)});
    assert.strictEqual(windowAt(2).start, windowAt(1).end, "the second level starts as the first ends");
    assert.strictEqual(windowAt(3).start, windowAt(2).end);
    assert.strictEqual(windowAt(3).end, 1, "the last ends with the transition");
    assert.ok(out.labels.length > 0);
    for (const l of out.labels)
      assert.deepStrictEqual(l.enterWindow, out.rectWindows[l.key.replace(/_\d+$/, "")], `${l.key} enters with its rect`);
  }
});

it("Icicle: a data update staggers only its entering rects; zooms keep their own motion", async function () {
  const out = await page(async () => {
    const chart = await window.build();
    await new Promise(resolve =>
      chart.data([...window.DATA, {area: "Tests", module: "Unit", file: "Icicle", size: 90}, {area: "App", module: "Charts", file: "Pie", size: 50}])
        .render(() => resolve()),
    );
    const updated = Object.fromEntries(window.rects(chart).filter(n => n.enterWindow).map(n => [n.key, n.enterWindow]));
    window.route(chart, "click", window.rectFor(chart, ["App"]));
    await window.wait(150);
    const zoomIn = window.rects(chart).filter(n => n.enterWindow || n.enterRect).length;
    window.route(chart, "click", window.rectFor(chart, ["App"]));
    await window.wait(150);
    const zoomOut = window.rects(chart).filter(n => n.enterRect);
    return {
      updated,
      zoomIn,
      zoomOut: zoomOut.map(n => n.key),
      zoomOutWindows: zoomOut.filter(n => n.enterWindow).length,
    };
  });
  assert.deepStrictEqual(Object.keys(out.updated).sort(), [
    'icicle-["App","Charts","Pie"]',
    'icicle-["Tests","Unit","Icicle"]',
    'icicle-["Tests","Unit"]',
    'icicle-["Tests"]',
  ].sort(), "only the new rects enter");
  assert.deepStrictEqual(out.updated['icicle-["Tests"]'], {start: 0, end: cubicInOut(1 / 3)});
  assert.deepStrictEqual(out.updated['icicle-["Tests","Unit","Icicle"]'], {start: cubicInOut(2 / 3), end: 1});
  assert.deepStrictEqual(out.updated['icicle-["App","Charts","Pie"]'], {start: 0, end: cubicInOut(1 / 3)}, "a new leaf under a drawn parent starts at once");
  assert.strictEqual(out.zoomIn, 0, "a zoom-in adds no enter starts");
  assert.ok(out.zoomOut.some(k => k.includes("Docs")), "a zoom-out still grows returning rects in from the zoomed view");
  assert.strictEqual(out.zoomOutWindows, 0, "without a stagger");
});
