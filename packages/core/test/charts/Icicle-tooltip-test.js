import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

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

it("Icicle: the tooltip hides after leaving a non-leaf rect, on SVG and Canvas", async function () {
  this.timeout(60000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const leave = async path => {
        window.route(chart, "mousemove", window.rectFor(chart, path));
        await window.wait(30);
        const shown = window.tooltipShown(chart);
        window.route(chart, "mouseleave");
        await window.wait(30);
        return [shown, window.tooltipShown(chart)];
      };
      const result = {root: await leave(["App"]), mid: await leave(["App", "Charts"])};
      window.route(chart, "click", window.rectFor(chart, ["App"]));
      await window.wait(150);
      result.focus = await leave(["App"]);
      return result;
    }, renderer);
    for (const [name, [shown, after]] of Object.entries(out)) {
      assert.ok(shown, `${renderer} ${name}: shown on hover`);
      assert.ok(!after, `${renderer} ${name}: hidden after leaving`);
    }
  }
});
