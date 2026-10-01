import assert from "assert";

import {closeBrowser, render} from "../playwright.js";

/**
    The size legend (#83) in charts: a nested-circle key in the bottom-right
    corner panel for every chart that sizes marks — Plot bubbles, Geomap
    points, Network, Rings. The legend's circles must be the chart's own
    radii (its largest circle IS the chart's largest mark), the panel must
    stay clear of the chart body, and bottom/side legends and colorScales
    must make room for it.
*/

after(async () => {
  await closeBrowser();
});

/**
    Renders the chart `builderSrc` returns, then reports the size-legend
    panel (from the scene, so it's renderer-agnostic) against the chart's
    own circle marks.
*/
const probe = (builderSrc, {zoomIn = 0, width = 800, height = 500} = {}) =>
  render(`<div id="viz" style="width:${width}px;height:${height}px"></div>`, ([src, zooms]) =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus)
        .duration(0)
        .select("#viz");
      const report = () => {
        try {
          const nodes = [];
          const walk = (n, path) => {
            nodes.push({n, path});
            (n.children || []).forEach(c => walk(c, path.concat(n.key)));
          };
          walk(viz.toScene().root, []);
          const inPanel = ({path}) => path.includes("viz-bottomRight");
          const panel = (nodes.find(({n}) => n.key === "viz-bottomRight") || {}).n;
          const legendCircles = nodes.filter(x => inPanel(x) && x.n.type === "circle").map(x => x.n.r);
          const legendText = nodes
            .filter(x => inPanel(x) && x.n.type === "text")
            .map(x => x.n.lines.map(l => l.text).join(" "));
          const chartRadii = nodes
            .filter(x => !inPanel(x) && x.n.type === "circle" && x.n.datum && !x.path.includes("viz-legend"))
            .map(x => x.n.r);
          const box = viz._bottomRightBox;
          const painted = panel ? panel.children[0] : null;
          resolve({
            panel: !!panel,
            legendCircles,
            legendText,
            chartMax: chartRadii.length ? Math.max(...chartRadii) : null,
            chartRadii,
            box: box ? {width: box.width, height: box.height, bottom: box.bottom, side: box.side} : null,
            paintedTransform: painted ? painted.transform : null,
            marginBottom: viz._margin.bottom,
            marginRight: viz._margin.right,
            legendWidth: viz._legendClass.schema.width,
            colorScaleHeight: viz._colorScaleClass.schema.height,
            zoom: viz._zoomTransform ? viz._zoomTransform.scale : 1,
            chartWidth: viz.schema.width,
            paddingRight: viz.schema.legendPadding(viz) ? viz._padding.right : 0,
            chartHeight: viz.schema.height,
          });
        } catch (e) {
          reject(e);
        }
      };
      viz.render(() => {
        let left = zooms;
        const step = () => {
          if (!left) return report();
          left--;
          document.querySelector(".zoom-in").click();
          window.setTimeout(step, 900);
        };
        step();
      });
    }), [builderSrc, zoomIn]);

const bubbles = `[
  {id: "a", x: 1, y: 3, v: 10}, {id: "b", x: 2, y: 1, v: 250},
  {id: "c", x: 3, y: 4, v: 1000}, {id: "d", x: 4, y: 2, v: 520},
]`;
const bubbleChart = extra => `lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y").size("v")${extra || ""}`;

it("size legend: a bubble chart draws the key from its own radius scale", async () => {
  const out = await probe(bubbleChart(".sizeMin(4).sizeMax(30)"));
  assert.ok(out.panel, "bottom-right panel present");
  assert.strictEqual(out.legendCircles.length, 3);
  assert.strictEqual(Math.max(...out.legendCircles), out.chartMax, "largest legend circle = largest bubble");
  assert.strictEqual(Math.max(...out.legendCircles), 30);
  assert.ok(out.legendText.includes("v"), "title defaults to the size key");
  assert.ok(out.legendText.includes("1k") && out.legendText.includes("10"), "labels the extremes");
});

it("size legend: by default the chart body ends left of the panel, at full height", async () => {
  const out = await probe(bubbleChart());
  assert.strictEqual(out.box.side, "right");
  assert.ok(out.marginRight >= out.box.width, "right margin clears the panel");
  const flat = await probe(bubbleChart(".sizeLegend(false)"));
  assert.strictEqual(out.marginBottom, flat.marginBottom, "no bottom margin taken");
  const {x, y} = out.paintedTransform;
  assert.ok(x >= out.chartWidth - out.box.width - 1e-6, "painted inside the reserved box");
  assert.ok(y >= out.chartHeight - out.box.bottom - out.box.height - 1e-6);
});

it("size legend: sizeLegendPosition('bottom') ends the chart body above the panel instead", async () => {
  const out = await probe(bubbleChart(".sizeLegendPosition('bottom')"));
  assert.strictEqual(out.box.side, "bottom");
  assert.ok(out.marginBottom >= out.box.bottom + out.box.height);
  const flat = await probe(bubbleChart(".sizeLegend(false)"));
  assert.strictEqual(out.marginRight, flat.marginRight, "no right margin taken");
});

it("size legend: hidden by sizeLegend(false), without a size accessor, or for a single size", async () => {
  const off = await probe(bubbleChart(".sizeLegend(false)"));
  assert.strictEqual(off.panel, false);
  assert.strictEqual(off.box, null);
  const unsized = await probe(`lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y")`);
  assert.strictEqual(unsized.panel, false);
  const flat = await probe(`lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y").size(() => 5)`);
  assert.strictEqual(flat.panel, false);
});

it("size legend: a bottom legend narrows to sit beside the panel", async () => {
  const legendSrc = extra => `lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y").size("v").legendPosition("bottom")${extra}`;
  const without = await probe(legendSrc(".sizeLegend(false)"));
  // Right side (default): the widened right margin narrows it by the panel plus a gap.
  const right = await probe(legendSrc(""));
  const rightExpected = right.box.width + 6;
  assert.ok(
    Math.abs(without.legendWidth - right.legendWidth - rightExpected) < 1,
    `right: legend width shrinks by ${rightExpected} (${without.legendWidth} → ${right.legendWidth})`,
  );
  // Bottom side: it insets by the panel plus a gap, less the padding it
  // already kept clear of the right edge.
  const bottom = await probe(legendSrc(".sizeLegendPosition('bottom')"));
  const bottomExpected = bottom.box.width + 6 - bottom.paddingRight;
  assert.ok(
    Math.abs(without.legendWidth - bottom.legendWidth - bottomExpected) < 1,
    `bottom: legend width shrinks by ${bottomExpected} (${without.legendWidth} → ${bottom.legendWidth})`,
  );
});

it("size legend: a right colorScale shortens to end above the panel", async () => {
  const csSrc = extra => `lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y").size("v").colorScale("v").colorScalePosition("right")${extra}`;
  const withPanel = await probe(csSrc(""));
  const without = await probe(csSrc(".sizeLegend(false)"));
  assert.ok(withPanel.colorScaleHeight < without.colorScaleHeight);
});

it("size legend: Geomap points", async () => {
  const out = await probe(`lib => new lib.Geomap().tiles(false).ocean("transparent").legend(false)
    .data([{id: "a", p: [0, 0], v: 1}, {id: "b", p: [20, 10], v: 50}, {id: "c", p: [-30, 25], v: 100}])
    .point(d => d.p).pointSize(d => d.v).pointSizeMin(2).pointSizeMax(20)`);
  assert.ok(out.panel);
  assert.strictEqual(Math.max(...out.legendCircles), out.chartMax);
  assert.strictEqual(out.chartMax, 20);
});

it("size legend: Geomap relabels, not grows, when zoomed in", async () => {
  const src = `lib => new lib.Geomap().tiles(false).ocean("transparent").legend(false)
    .data([{id: "a", p: [0, 0], v: 1}, {id: "b", p: [20, 10], v: 50}, {id: "c", p: [-30, 25], v: 400}])
    .point(d => d.p).pointSize(d => d.v).pointSizeMin(2).pointSizeMax(20).pointSizeScale("sqrt")`;
  const base = await probe(src);
  const zoomed = await probe(src, {zoomIn: 1});
  assert.ok(zoomed.zoom > 1, "chart zoomed in");
  assert.ok(Math.max(...zoomed.legendCircles) <= Math.max(...base.legendCircles) + 1e-6, "circles stay in the box");
  assert.notDeepStrictEqual(zoomed.legendText, base.legendText, "labels change with zoom");
  assert.ok(!zoomed.legendText.includes("400"), "the unzoomed max no longer fits");
});

const graph = `
  nodes([{id: "a", v: 5}, {id: "b", v: 40}, {id: "c", v: 100}, {id: "d", v: 70}, {id: "e", v: 20}])
  .links([{source: "a", target: "b"}, {source: "a", target: "c"}, {source: "b", target: "d"}, {source: "c", target: "e"}])`;

it("size legend: Network, sized from its fitted radius scale", async () => {
  const out = await probe(`lib => new lib.Network().${graph}.size("v")`);
  assert.ok(out.panel);
  assert.ok(Math.abs(Math.max(...out.legendCircles) - out.chartMax) < 1e-6);
});

it("size legend: Rings sizes nodes by value and keys them", async () => {
  const out = await probe(`lib => new lib.Rings().${graph}.center("a").size("v")`, {height: 600});
  assert.ok(out.panel);
  assert.ok(Math.abs(Math.max(...out.legendCircles) - out.chartMax) < 1e-6);
});

it("size legend: hidden by default when it would crowd the chart, unless forced on", async () => {
  const big = extra => `lib => new lib.Plot().data(${bubbles}).groupBy("id").x("x").y("y").size("v").sizeMax(90)${extra}`;
  const auto = await probe(big(""), {height: 350});
  assert.strictEqual(auto.panel, false, "a legend over a third of the chart height is skipped");
  const forced = await probe(big(".sizeLegend(true)"), {height: 350});
  assert.ok(forced.panel, "sizeLegend(true) always shows it");
});
