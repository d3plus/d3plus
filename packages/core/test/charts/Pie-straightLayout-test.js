import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {near} from "~test/helpers.js";
import {Donut, Pie} from "../../index.ts";
import {runStages, textLineBoxes} from "../../internal.ts";
import {applyPieLayout} from "../../src/charts/Pie/applyLayout.ts";
import {pieLabelPlan} from "../../src/charts/Pie/pieLabels.ts";
import {sectorEdges} from "../../src/charts/Pie/sectorBox.ts";
import {
  STRAIGHT_LABEL_DEFAULTS,
  centerLabelLines,
  straightLabelLayout,
  straightLabelOptions,
  wrapWidths,
} from "../../src/charts/Pie/straightLayout.ts";
import {bisectorOffset, boxInSector} from "./sectorInside.js";

useJsdom();

const deg = d => (d * Math.PI) / 180;
const seg = (start, end, inner = 0, outer = 200) => ({
  innerRadius: inner,
  outerRadius: outer,
  startAngle: deg(start),
  endAngle: deg(end),
});

/** A layout's whole box: the name's and the share's together. */
const wholeBox = layout => {
  const {name, share} = layout;
  const bottom = share ? share.y + share.height : name.y + name.height;
  return {x: name.x, y: name.y, width: name.width, height: bottom - name.y};
};

it("straightLabelOptions — a fixed fontSize, else fontMin to fontMax, and the padding", () => {
  assert.deepStrictEqual(straightLabelOptions({}), STRAIGHT_LABEL_DEFAULTS);
  assert.strictEqual(STRAIGHT_LABEL_DEFAULTS.fontMax, 32);
  assert.strictEqual(STRAIGHT_LABEL_DEFAULTS.fontMin, 10);
  const fixed = straightLabelOptions({fontSize: 14, fontMin: 6});
  assert.deepStrictEqual([fixed.fontMin, fixed.fontMax], [14, 14]);
  const range = straightLabelOptions({fontMin: 10, fontMax: 30, padding: 2});
  assert.deepStrictEqual(
    [range.fontMin, range.fontMax, range.padding],
    [10, 30, 2],
  );
  const low = straightLabelOptions({fontMin: 40, fontMax: 20});
  assert.deepStrictEqual([low.fontMin, low.fontMax], [20, 20]);
  const odd = straightLabelOptions({fontSize: () => 12, padding: "4px"});
  assert.deepStrictEqual([odd.fontMin, odd.fontMax, odd.padding], [10, 32, 5]);
});

it("wrapWidths — the narrowest wrap between words onto each number of lines", () => {
  const width = t => t.length;
  assert.deepStrictEqual(wrapWidths("Personal care", width, 4), [13, 8]);
  assert.deepStrictEqual(
    wrapWidths("Rent and utilities", width, 4),
    [18, 9, 9],
    "three lines are no narrower than its longest word",
  );
  assert.deepStrictEqual(
    wrapWidths("a bb ccc dddd", width, 2),
    [13, 8],
    "stops at maxLines",
  );
  assert.deepStrictEqual(wrapWidths("Transportation", width, 4), [14]);
  assert.deepStrictEqual(wrapWidths("  ", width, 4), []);
});

it("straightLabelLayout — the name and share, as large as fits, centered on the bisector", () => {
  const arc = seg(0, 90);
  const layout = straightLabelLayout(sectorEdges(arc), [4.5, 2.6], 1.6);
  assert.ok(layout);
  assert.ok(Number.isInteger(layout.fontSize));
  assert.ok(layout.fontSize >= 10 && layout.fontSize <= 32);
  assert.ok(layout.share, "a share beneath");
  assert.strictEqual(
    layout.shareSize,
    Math.round(layout.fontSize * STRAIGHT_LABEL_DEFAULTS.shareRatio),
  );
  near(layout.share.y, layout.name.y + layout.name.height - 5, 1e-9, "beneath");
  assert.strictEqual(layout.truncated, false);
  near(bisectorOffset(arc, layout.center).across, 0, 1e-9, "on the bisector");
  const box = wholeBox(layout);
  near(box.x + box.width / 2, layout.center[0], 1e-9, "centered across");
  assert.ok(boxInSector(arc, box), "inside its slice");
});

it("straightLabelLayout — wraps onto more lines where that shows the name larger", () => {
  // A tall, narrow slice standing up from the center.
  const tall = seg(-15, 15);
  const layout = straightLabelLayout(sectorEdges(tall), [6, 3.2], null);
  assert.strictEqual(layout.lines, 2);
  const one = straightLabelLayout(sectorEdges(tall), [6], null);
  assert.ok(layout.fontSize > one.fontSize, "larger on two lines");
  // A wide, shallow ring segment keeps one line.
  const wide = seg(-40, 40, 160);
  assert.strictEqual(
    straightLabelLayout(sectorEdges(wide), [6, 3.2], null).lines,
    1,
  );
});

it("straightLabelLayout — fontMax caps the name, and the box goes halfway along its room", () => {
  const arc = seg(0, 180);
  const layout = straightLabelLayout(sectorEdges(arc), [2], 1.5);
  assert.strictEqual(layout.fontSize, 32);
  near(bisectorOffset(arc, layout.center).across, 0, 1e-9, "on the bisector");
  const fixed = straightLabelLayout(sectorEdges(arc), [2], 1.5, {
    ...STRAIGHT_LABEL_DEFAULTS,
    fontMin: 12,
    fontMax: 12,
  });
  assert.strictEqual(fixed.fontSize, 12);
  assert.strictEqual(fixed.shareSize, 12, "never below fontMin");
});

it("straightLabelLayout — leaves the share off where it would shrink the name", () => {
  // A shallow ring: room for one line, not two.
  const arc = seg(-60, 60, 150, 200);
  const layout = straightLabelLayout(sectorEdges(arc), [3], 1.6);
  assert.strictEqual(layout.share, null);
  assert.strictEqual(layout.shareSize, null);
  assert.ok(boxInSector(arc, layout.name));
  const withShare = straightLabelLayout(sectorEdges(arc), [3], 1.6, {
    ...STRAIGHT_LABEL_DEFAULTS,
    shareKeep: 0,
    shareFont: 0,
  });
  assert.ok(withShare.share, "kept when any size will do");
  assert.ok(withShare.fontSize < layout.fontSize);
  assert.ok(boxInSector(arc, wholeBox(withShare)));
});

it("straightLabelLayout — cuts a name short at fontMin, or gives up", () => {
  const arc = seg(0, 30, 0, 120);
  const layout = straightLabelLayout(sectorEdges(arc), [40], 2);
  assert.strictEqual(layout.truncated, true);
  assert.strictEqual(layout.fontSize, 10);
  assert.strictEqual(layout.lines, 1);
  assert.strictEqual(layout.share, null);
  assert.ok(boxInSector(arc, layout.name));
  near(bisectorOffset(arc, layout.center).across, 0, 1e-9, "on the bisector");
  assert.strictEqual(
    straightLabelLayout(sectorEdges(seg(0, 2, 0, 120)), [40], 2),
    null,
    "no room for a few letters",
  );
  assert.strictEqual(straightLabelLayout(sectorEdges(arc), [], 2), null);
});

it("straightLabelLayout — a name that only shows whole below 10px is cut short at 10px", () => {
  const arc = seg(0, 12, 0, 200);
  const small = straightLabelLayout(sectorEdges(arc), [3], null, {
    ...STRAIGHT_LABEL_DEFAULTS,
    fontMin: 6,
  });
  assert.ok(
    small.fontSize >= 6 && small.fontSize < 10 && !small.truncated,
    `whole at ${small.fontSize}px when fontMin allows it`,
  );
  const layout = straightLabelLayout(sectorEdges(arc), [3], null);
  assert.strictEqual(layout.truncated, true);
  assert.strictEqual(layout.fontSize, 10);
});

it("pieLabelPlan — a slice whose name needs less than 10px inside is labelled outside", () => {
  const viz = new Pie()
    .data([
      {id: "Green", value: 48},
      {id: "Red", value: 112},
      {id: "Blue", value: 96},
      {id: "Yellow", value: 31},
      {id: "Independent", value: 13},
    ])
    .groupBy("id")
    .startAngle(-90)
    .endAngle(90);
  const labels = straightLabels(viz, 440, 300);
  const names = labels.map(l => l.nodes[0].lines.map(x => x.text).join(" "));
  assert.ok(!names.includes("Independent"), names.join(", "));
  const plan = viz.ctx.pieLabelPlan.plan;
  assert.deepStrictEqual(
    plan.outside.map(c => c.text),
    ["Independent 4.33%"],
  );
  for (const {nodes} of labels)
    for (const n of nodes) assert.ok(n.font.size >= 10, `${n.font.size}px`);

  // A smaller fontMin of the chart's own keeps it inside.
  viz.shapeConfig({labelConfig: {fontMin: 6}});
  const kept = straightLabels(viz, 440, 300).map(l =>
    l.nodes[0].lines.map(x => x.text).join(" "),
  );
  assert.ok(kept.includes("Independent"), kept.join(", "));
});

it("centerLabelLines — moves a label's lines together onto a height", () => {
  const font = {family: "Arial", size: 10};
  const shared = {x: 0, y: 40};
  const nodes = [
    {
      type: "text",
      font,
      lines: [{text: "Name", x: 0, y: 10, width: 30}],
      transform: shared,
    },
    {
      type: "rect",
      transform: shared,
    },
    {
      type: "text",
      font: {...font, size: 6},
      lines: [{text: "5%", x: 0, y: 30, width: 10}],
      transform: {x: 0, y: 40},
    },
  ];
  centerLabelLines(nodes, 0);
  const boxes = textLineBoxes(nodes);
  const top = Math.min(...boxes.map(b => b.y - b.height / 2));
  const bottom = Math.max(...boxes.map(b => b.y + b.height / 2));
  near((top + bottom) / 2, 0, 1e-9, "centered");
  assert.strictEqual(
    shared.y,
    nodes[2].transform.y,
    "a shared transform moves once",
  );
  centerLabelLines([], 0);
});

/** A chart's straight labels after layout, each slice's nodes together. */
function straightLabels(viz, width = 600, height = 500) {
  viz.width(width).height(height).duration(0);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applyPieLayout]);
  const arc = viz.ctx.arcData;
  const bySlice = new Map();
  for (const node of pieLabelPlan(viz, shapeData).straight) {
    const slice = node.datum.data;
    bySlice.set(slice, [...(bySlice.get(slice) ?? []), node]);
  }
  return [...bySlice].map(([d, nodes]) => ({
    arc: {
      innerRadius: arc.innerRadius()(d, d.i),
      outerRadius: arc.outerRadius()(d, d.i),
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      padAngle: d.padAngle,
    },
    nodes,
  }));
}

it("pieStraightLabels — each label's lines centered on its slice's bisector, inside it", () => {
  const data = [
    {id: "Rent and utilities", value: 30},
    {id: "Groceries", value: 22},
    {id: "Transportation", value: 17},
    {id: "Dining out", value: 7},
    {id: "Healthcare", value: 6.5},
    {id: "Savings", value: 6},
  ];
  for (const viz of [
    new Pie().data(data).groupBy("id"),
    new Donut().data(data).groupBy("id").labelPosition("inside"),
    new Pie().data(data).groupBy("id").startAngle(-90).endAngle(90),
  ]) {
    const labels = straightLabels(viz);
    assert.ok(labels.length >= 4, `${labels.length} labels`);
    for (const {arc, nodes} of labels) {
      const boxes = textLineBoxes(nodes);
      const left = Math.min(...boxes.map(b => b.x - b.width / 2));
      const right = Math.max(...boxes.map(b => b.x + b.width / 2));
      const top = Math.min(...boxes.map(b => b.y - b.height / 2));
      const bottom = Math.max(...boxes.map(b => b.y + b.height / 2));
      const center = [(left + right) / 2, (top + bottom) / 2];
      const text = nodes
        .map(n => n.lines.map(l => l.text).join(" "))
        .join(" / ");
      assert.ok(
        bisectorOffset(arc, center).across < 1,
        `${text}: on the bisector (${bisectorOffset(arc, center).across})`,
      );
      assert.ok(
        boxInSector(arc, {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        }),
        `${text}: inside its slice`,
      );
    }
  }
});
