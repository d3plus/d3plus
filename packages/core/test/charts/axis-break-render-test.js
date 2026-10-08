import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Plot scale breaks (#766, #767): `xBreak`/`yBreak` remove value ranges from
    an axis, and shapes crossing a break get a gap cut across them.
*/

const bars = [
  {id: "A", v: 42},
  {id: "B", v: 58},
  {id: "C", v: 35},
  {id: "D", v: 960},
  {id: "E", v: 51},
];

/** Renders `src` and reports both axes' breaks, the mask groups, and the bars. */
const probe = (src, opts = {}) =>
  render(
    '<div id="viz" style="width:700px;height:450px"></div>',
    ([src, data, opts]) =>
      new Promise((resolve, reject) => {
        try {
          const viz = new Function("lib", "data", `return (${src})(lib, data);`)(window.d3plus, data)
            .duration(0)
            .select("#viz");
          if (opts.renderer) viz.renderer(opts.renderer);
          viz.render(() => {
           try {
            const masks = [];
            const bars = [];
            const shapes = new Set();
            const walk = (n, inMask) => {
              const isMask = String(n.key).startsWith("plot-break-mask");
              if (isMask) masks.push({key: n.key, rings: n.clip.d.split("Z").filter(Boolean).length});
              if (n.shapeType) shapes.add(`${n.shapeType}:${inMask || isMask}`);
              const row = n.datum && (n.datum.data || n.datum);
              if (n.shapeType === "Bar" && n.type === "rect")
                bars.push({id: row && row.id, v: row && row.v, y: n.transform.y + n.y, h: n.height});
              (n.children || []).forEach(c => walk(c, inMask || isMask));
            };
            viz._chartScene.forEach(n => walk(n, false));
            const axisInfo = axis => ({
              breaks: axis._breaks.map(b => ({start: b.start, end: b.end, baseline: b.baseline})),
              ticks: axis._visibleTicks.map(Number),
              lines: axis.toScene().children.filter(n => n.type === "line" && !String(n.key).startsWith("grid")).map(n => n.key),
              zero: axis._getPosition(0),
              range: axis._getRange(),
            });
            const out = {y: axisInfo(viz._yAxis), x: axisInfo(viz._xAxis), masks, bars, shapes: [...shapes]};
            if (opts.pixel) {
              const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
              const ratio = canvas.width / canvas.getBoundingClientRect().width;
              const ct = viz._chartTransform;
              const brk = viz._yAxis._breaks[0];
              const gapY = (brk.startPosition + brk.endPosition) / 2;
              const bar = viz._chartScene.flatMap(function flat(n) {
                return [n, ...(n.children || []).flatMap(flat)];
              }).find(n => n.shapeType === "Bar" && n.type === "rect" && n.datum && (n.datum.data || n.datum).id === "D");
              const x = bar.transform.x + ct.x;
              const px = y => Array.from(canvas.getContext("2d").getImageData(Math.round(x * ratio), Math.round((y + ct.y) * ratio), 1, 1).data);
              out.pixels = {gap: px(gapY), above: px(gapY - 12), below: px(gapY + 12)};
            }
            if (opts.zoom) {
              viz._zoomRescale({k: 1, x: 0, y: 0});
              out.identity = viz._yAxis._breaks.length;
              // Zoom 8× into the top of the plot, above the break.
              viz._zoomRescale({k: 8, x: -2800, y: 0});
              out.zoomed = {breaks: viz._yAxis._breaks.length, domain: viz._yAxis._d3Scale.domain()};
            }
            resolve(out);
           } catch (e) {
            reject(e);
           }
          });
        } catch (e) {
          reject(e);
        }
      }),
    [src, opts.data || bars, opts],
  );

it("BarChart: yBreak fits a tall outlier bar, labeling both edges and masking the bar", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yBreak([80, 900])`);
  assert.deepStrictEqual(out.y.breaks, [{start: 80, end: 900, baseline: false}]);
  assert.ok(out.y.ticks.includes(80) && out.y.ticks.includes(900), "both break edges are ticks");
  assert.ok(!out.y.ticks.some(t => t > 80 && t < 900), "no ticks inside the break");
  assert.ok(out.y.lines.includes("break-0-0") && out.y.lines.includes("break-0-1"), "break glyph");
  assert.deepStrictEqual(out.masks.map(m => m.key), ["plot-break-mask-y"], "content is masked");
  assert.ok(out.shapes.includes("Bar:true"), "bars sit inside the mask");
  const d = out.bars.find(b => b.id === "D");
  assert.strictEqual(d.v, 960, "the datum (and so the tooltip) keeps its real value");
  assert.ok(Math.abs(d.y + d.h - out.y.zero) <= 1, "bars still start at 0");
});

it("LinePlot: yBreak breaks the axis and masks the line", async function () {
  this.timeout(60000);
  const data = [1, 2, 3, 4, 5, 6].map(x => ({id: "s", x, y: x === 4 ? 940 : 30 + x * 6}));
  const out = await probe(`(lib, data) => new lib.LinePlot().data(data).groupBy("id").x("x").y("y").yBreak([90, 900])`, {data});
  assert.deepStrictEqual(out.y.breaks, [{start: 90, end: 900, baseline: false}]);
  assert.deepStrictEqual(out.masks.map(m => m.key), ["plot-break-mask-y"]);
  assert.ok(out.shapes.includes("Line:true"), "the line is inside the mask");
});

it("BarChart: horizontal bars break the x axis with xBreak", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").discrete("y").y("id").x("v").xBreak([80, 900])`);
  assert.deepStrictEqual(out.x.breaks, [{start: 80, end: 900, baseline: false}]);
  assert.deepStrictEqual(out.y.breaks, [], "the discrete axis doesn't break");
  assert.deepStrictEqual(out.masks.map(m => m.key), ["plot-break-mask-x"]);
});

it("BarChart: several breaks each get a glyph and a masked band", async function () {
  this.timeout(60000);
  const data = bars.map(b => (b.id === "C" ? {...b, v: 450} : b));
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yBreak([[80, 400], [500, 900]])`,
    {data},
  );
  assert.strictEqual(out.y.breaks.length, 2);
  ["break-0-0", "break-1-0"].forEach(k => assert.ok(out.y.lines.includes(k), k));
  assert.ok(out.masks[0].rings > 3, "outer ring plus holes for both bands");
});

it("BarChart: breakConfig.mask false keeps the glyph but leaves shapes whole", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yBreak([80, 900]).yConfig({breakConfig: {mask: false}})`,
  );
  assert.strictEqual(out.y.breaks.length, 1);
  assert.ok(out.y.lines.includes("break-0-0"));
  assert.deepStrictEqual(out.masks, [], "no mask group");
});

it("BarChart: the baseline break looks the same, unmasked unless asked", async function () {
  this.timeout(60000);
  const data = bars.map(b => ({...b, v: b.v + 1100}));
  const src = `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 2100])`;
  const out = await probe(src, {data});
  assert.deepStrictEqual(out.y.breaks, [{start: 0, end: 1100, baseline: true}]);
  assert.deepStrictEqual(out.y.lines, ["bar-baseline", "bar", "baseline-break-0", "baseline-break-1"]);
  assert.deepStrictEqual(out.masks, [], "no mask by default");
  const masked = await probe(`${src}.yConfig({baselineBreakConfig: {mask: true}})`, {data});
  assert.deepStrictEqual(masked.masks.map(m => m.key), ["plot-break-mask-y"], "mask on request");
});

it("BarChart: the Canvas renderer cuts the masked gap across a bar", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yBreak([80, 900])`,
    {renderer: "canvas", pixel: true},
  );
  // The canvas leaves unpainted pixels transparent, so the page shows through.
  const empty = p => p[3] === 0 || (p[0] > 240 && p[1] > 240 && p[2] > 240);
  assert.ok(empty(out.pixels.gap), `gap shows the background (${out.pixels.gap})`);
  assert.ok(!empty(out.pixels.above) && !empty(out.pixels.below), "bar paint on both sides of the gap");
});

it("Plot charts all take yBreak", async function () {
  this.timeout(120000);
  const data = [1, 2, 3, 4].flatMap(x => ["a", "b"].map(id => ({id, x, y: x === 3 && id === "a" ? 900 : 10 + x * 5})));
  for (const chart of ["AreaPlot", "StackedArea", "Plot", "BoxWhisker", "BumpChart"]) {
    const src = chart === "BoxWhisker"
      ? `(lib, data) => new lib.BoxWhisker().data(data).groupBy(["x", "id"]).x("x").y("y").yBreak([60, 850])`
      : `(lib, data) => new lib.${chart}().data(data).groupBy("id").x("x").y("y").yBreak([60, 850])`;
    const out = await probe(src, {data});
    if (chart === "BumpChart") {
      assert.deepStrictEqual(out.y.breaks, [], "BumpChart's rank axis ignores an out-of-domain break");
      continue;
    }
    assert.strictEqual(out.y.breaks.length, 1, `${chart} breaks`);
    assert.strictEqual(out.masks.length, 1, `${chart} masks`);
  }
});

it("Plot zoom keeps a break at the identity view and drops it once it leaves the visible domain", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yBreak([80, 900]).zoom(true)`,
    {zoom: true},
  );
  assert.strictEqual(out.identity, 1, "identity zoom keeps the break");
  assert.strictEqual(out.zoomed.breaks, 0, `break outside the zoomed domain ${out.zoomed.domain} is dropped`);
});
