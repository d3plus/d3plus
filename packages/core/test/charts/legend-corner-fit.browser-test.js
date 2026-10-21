import {it} from "vitest";
import assert from "~test/browser/assert.js";

import {legendLabelsWhole} from "../../src/charts/features/featuresLegend.ts";
import {render} from "~test/browser/render.js";

/**
    A top legend beside the corner control panels (zoom on the right, table
    view and search on the left) takes the same places a title does: centered
    between them, then inset from each by its own amount, and when its labels
    don't fit whole beside them, a full-width row below them. No entry loses
    or squeezes its label while there is room below the panels, in SVG and on
    canvas.
*/

const regions = [
  "Northeast Manufacturing",
  "Southern Agriculture",
  "Pacific Technology Services",
  "Midwest Transportation",
  "Mountain Region Tourism",
];

/**
    Renders a `width`-px-wide LinePlot with a top legend of `labels` and zoom,
    table view and search showing, and returns the legend's chart-space box,
    whether every entry kept its whole label, the corner controls' chart-space
    boxes, and the margin the chart claimed at the top. `css` styles the page.
*/
const legendLayout = (width, renderer, {labels = regions, css = ""} = {}) =>
  render(
    `<style>${css}</style><div id="s" style="width:${width}px;height:400px;"></div>`,
    ({labels, renderer}) =>
      new Promise((resolve, reject) => {
        const data = labels.flatMap((id, i) => [{id, x: 1, y: i + 1}, {id, x: 2, y: i + 3}]);
        const viz = new window.d3plus.LinePlot()
          .select("#s")
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .legendPosition("top")
          .tableView(true)
          .search(true)
          .renderer(renderer)
          .duration(0);
        viz.render(() => {
          try {
            let group = null;
            const walk = n => {
              if (/^Legend-/.test(n.key || "") && n.type === "group") group = n;
              (n.children || []).forEach(walk);
            };
            walk(viz.toScene().root);
            const surfaces = [...document.querySelectorAll("#s svg, #s canvas")]
              .map(e => e.getBoundingClientRect())
              .sort((a, b) => b.width * b.height - a.width * a.height);
            const origin = surfaces[0];
            const rects = selector =>
              [...document.querySelectorAll(selector)].map(e => {
                const r = e.getBoundingClientRect();
                return {left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top};
              });
            const legend = viz._legendClass;
            const ob = legend.outerBounds();
            const t = group ? group.transform : {x: 0, y: 0};
            resolve({
              box: {left: t.x + ob.x, right: t.x + ob.x + ob.width, top: t.y + ob.y, bottom: t.y + ob.y + ob.height},
              whole: window.d3plus.legendLabelsWhole(legend),
              entries: (legend._lineData || []).length,
              controls: [...rects("#s .zoom-control"), ...rects("#s .d3plus-top-left-controls-item button")],
              controlsHeight: window.d3plus.cornerControlsHeight(viz),
              legendHeight: ob.height,
              marginTop: viz._margin.top,
              width: viz.schema.width,
            });
          } catch (e) {
            reject(e);
          }
        });
      }),
    {labels, renderer},
  );

const overlaps = (a, b) => !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top);

/** Asserts every entry keeps its whole label and the legend clears every corner control. */
function assertClear(out, label, entries = regions.length) {
  assert.strictEqual(out.entries, entries, `${label}: every entry is drawn`);
  assert.ok(out.whole, `${label}: every entry keeps its whole label`);
  assert.ok(out.controls.length >= 6, `${label}: both corner panels show`);
  for (const r of out.controls) {
    assert.ok(!overlaps(out.box, r), `${label}: the legend clears the control at ${r.left},${r.top}`);
  }
}

/** A bare element rule: d3plus's box reset keeps it off the corner panels. */
const padded = "div {padding: 25px;}";
/** A rule that outranks the box reset, so it still inflates the corner panels. */
const inflated = "#s div {padding: 25px;}";
const cssLabel = {[padded]: " (padded)", [inflated]: " (inflated)"};

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a top legend that doesn't fit beside the corner controls drops below them`, async function () {
    const plain = await legendLayout(300, renderer);
    for (const [width, css] of [[300, ""], [300, padded], [350, inflated]]) {
      const label = `${renderer} @ ${width}px${cssLabel[css] || ""}`;
      const out = css ? await legendLayout(width, renderer, {css}) : plain;
      assertClear(out, label);
      const drawn = Math.max(...out.controls.map(r => r.bottom));
      assert.ok(out.controlsHeight >= drawn - 1, `${label}: the panels measure at least as tall as drawn (${out.controlsHeight} vs ${drawn})`);
      assert.ok(out.box.top >= out.controlsHeight, `${label}: starts below the panels (${out.box.top} vs ${out.controlsHeight})`);
      assert.ok(
        out.marginTop >= out.controlsHeight + out.legendHeight,
        `${label}: the claimed margin covers the drop below the panels (${out.marginTop})`,
      );
      if (css === padded) {
        assert.deepStrictEqual([out.box, out.marginTop], [plain.box, plain.marginTop], `${label}: page CSS doesn't move the legend`);
      }
    }
  });

  it(`${renderer}: a top legend too wide for the symmetric inset insets each side by its own corner`, async function () {
    for (const [width, css] of [[350, ""], [350, padded], [400, inflated]]) {
      const label = `${renderer} @ ${width}px${cssLabel[css] || ""}`;
      const out = await legendLayout(width, renderer, {css});
      assertClear(out, label);
      assert.ok(out.box.top < out.controlsHeight, `${label}: the legend stays on the controls' row`);
      const offCenter = (out.box.left + out.box.right) / 2 - out.width / 2;
      assert.ok(offCenter < -1, `${label}: the legend shifts toward the narrower left panel (${offCenter})`);
    }
  });

  it(`${renderer}: a top legend that fits between the corner controls stays on their row`, async function () {
    const out = await legendLayout(900, renderer);
    assertClear(out, renderer);
    assert.ok(out.box.top < out.controlsHeight, "the legend stays on the controls' row");
    assert.strictEqual(out.marginTop < out.controlsHeight + out.legendHeight, true, "the legend claims no drop");
  });
}

/** A Legend stand-in with the given outer size and measured entries. */
const fakeLegend = (lineData, bounds = {width: 100, height: 20}) => ({outerBounds: () => bounds, _lineData: lineData});
const entry = (fields = {}) => ({sentence: "Pacific Technology", lines: ["Pacific Technology"], width: 90, height: 17, og: {height: 17}, truncated: false, ...fields});

it("legendLabelsWhole — every entry drawn on its own line in full", () => {
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry(), entry({sentence: false, lines: undefined, width: 0})])), true);
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry({sentence: "A\nB", lines: ["A", "B"]})])), true, "a label's own line breaks");
});

it("legendLabelsWhole — a dropped, cut or squeezed label, or a dropped legend, isn't whole", () => {
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry({width: 0})])), false, "label dropped to a swatch");
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry({truncated: true})])), false, "label cut short");
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry({lines: ["Pacific", "Technology"]})])), false, "wrapped to the legend's width");
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry({height: 34})])), false, "wrapped to squeeze into a row");
  assert.strictEqual(legendLabelsWhole(fakeLegend([entry()], {width: 0, height: 0})), false, "legend dropped");
});

it("cornerPlacements — tries the symmetric inset, each corner's own inset, then a full-width drop", async function () {
  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "a", x: 1, y: 2}, {id: "b", x: 2, y: 3}];
        const shown = new window.d3plus.Plot().select("#a").data(data).groupBy("id").x("x").y("y")
          .tableView(true).search(true).duration(0);
        const hidden = new window.d3plus.Plot().select("#b").data(data).groupBy("id").x("x").y("y")
          .zoom(false).tableView(false).search(false).duration(0);
        shown.render(() =>
          hidden.render(() => {
            const {cornerControlsHeight, cornerPlacements} = window.d3plus;
            resolve({
              centered: cornerPlacements(shown, 0, 0, 0, true),
              start: cornerPlacements(shown, 0, 0, 0, false),
              below: cornerPlacements(shown, cornerControlsHeight(shown), 0, 0, true),
              hidden: cornerPlacements(hidden, 0, 0, 0, true),
              height: cornerControlsHeight(shown),
            });
          }),
        );
      }),
  );
  const [symmetric, sides, drop] = out.centered;
  assert.strictEqual(out.centered.length, 3);
  assert.ok(sides.left > 0 && sides.right > 0 && sides.left !== sides.right, "each side insets by its own corner");
  assert.deepStrictEqual(symmetric, {left: Math.max(sides.left, sides.right), right: Math.max(sides.left, sides.right), drop: 0});
  assert.deepStrictEqual(drop, {left: 0, right: 0, drop: out.height});
  assert.deepStrictEqual(out.start, [sides, drop], "content that isn't centered skips the symmetric inset");
  assert.deepStrictEqual(out.below, [{left: 0, right: 0, drop: 0}], "content below the panels takes the full width");
  assert.deepStrictEqual(out.hidden, [{left: 0, right: 0, drop: 0}], "no panels, no insets");
});
