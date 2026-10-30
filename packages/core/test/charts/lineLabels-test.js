import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  bumpLineLabels,
  labelOverlapsLine,
  lineLabelBox,
  lineLabelConfig,
  lineLabelKey,
  lineLabelSides,
  lineLabelSpace,
  lineLabelText,
  lineLabelValue,
  fitLineLabelText,
  lineLabelCap,
  measureLineLabel,
  rowLineLabelSides,
  spreadLabelPositions,
} from "../../internal.ts";

useJsdom();

it("lineLabelSides — the ends each lineLabels value labels", () => {
  assert.deepStrictEqual(lineLabelSides(true), ["end"]);
  assert.deepStrictEqual(lineLabelSides("end"), ["end"]);
  assert.deepStrictEqual(lineLabelSides("start"), ["start"]);
  assert.deepStrictEqual(lineLabelSides("both"), ["start", "end"]);
  assert.deepStrictEqual(lineLabelSides(false), []);
  assert.deepStrictEqual(lineLabelSides(undefined), []);
  assert.deepStrictEqual(lineLabelSides(null), []);
});

it("rowLineLabelSides — calls a function setting with the row", () => {
  const calls = [];
  const setting = (d, i) => {
    calls.push([d, i]);
    return d.id === "a" ? "both" : d.id === "b";
  };
  assert.deepStrictEqual(rowLineLabelSides(setting, {id: "a"}, 0), [
    "start",
    "end",
  ]);
  assert.deepStrictEqual(rowLineLabelSides(setting, {id: "b"}, 1), ["end"]);
  assert.deepStrictEqual(rowLineLabelSides(setting, {id: "c"}, 2), []);
  assert.deepStrictEqual(calls, [
    [{id: "a"}, 0],
    [{id: "b"}, 1],
    [{id: "c"}, 2],
  ]);
  assert.deepStrictEqual(rowLineLabelSides("start", {id: "a"}, 0), ["start"]);
});

it("lineLabelValue — formats a label's value when values are on", () => {
  const format = v => `${v} units`;
  assert.strictEqual(lineLabelValue(undefined, 4, {}, 0, format), undefined);
  assert.strictEqual(
    lineLabelValue({value: false}, 4, {}, 0, format),
    undefined,
  );
  assert.strictEqual(
    lineLabelValue({value: true}, 4, {}, 0, format),
    "4 units",
  );
  const seen = [];
  const valueFormat = (v, d, i) => {
    seen.push([v, d, i]);
    return `${v}%`;
  };
  assert.strictEqual(
    lineLabelValue({value: true, valueFormat}, 37, {id: "x"}, 3, format),
    "37%",
  );
  assert.deepStrictEqual(seen, [[37, {id: "x"}, 3]]);
  assert.strictEqual(
    lineLabelValue({value: true}, undefined, {}, 0, format),
    undefined,
  );
  assert.strictEqual(
    lineLabelValue({value: true, valueFormat: () => ""}, 1, {}, 0, format),
    undefined,
  );
  assert.strictEqual(
    lineLabelValue({value: true, valueFormat: () => 12}, 1, {}, 0, format),
    "12",
  );
});

it("lineLabelText — the name, then the value", () => {
  assert.strictEqual(lineLabelText("Brazil"), "Brazil");
  assert.strictEqual(lineLabelText("Brazil", "37%"), "Brazil 37%");
  assert.strictEqual(lineLabelText(2024, "4"), "2024 4");
});

it("lineLabelKey — keeps each end's bumped position apart", () => {
  assert.strictEqual(lineLabelKey("end", "a"), "a");
  assert.strictEqual(lineLabelKey(undefined, 3), "3");
  assert.strictEqual(lineLabelKey("start", "a"), "start:a");
});

it("spreadLabelPositions — leaves labels that fit where they are", () => {
  assert.deepStrictEqual(spreadLabelPositions([], [], [0, 100]), []);
  assert.deepStrictEqual(
    spreadLabelPositions([10, 40, 70], [12, 12, 12], [0, 100]),
    [10, 40, 70],
  );
});

it("spreadLabelPositions — spreads touching labels around their center", () => {
  const out = spreadLabelPositions([50, 52, 54], [10, 10, 10], [0, 100]);
  assert.deepStrictEqual(out, [42, 52, 62]);
  // A run that collides with the run above merges into it.
  const merged = spreadLabelPositions(
    [10, 30, 31, 32],
    [10, 10, 10, 10],
    [0, 100],
  );
  for (let i = 1; i < merged.length; i++)
    assert.ok(merged[i] - merged[i - 1] >= 10 - 1e-9, `${merged}`);
  assert.ok(merged[0] <= 10, "the top label moves up, if at all");
});

it("spreadLabelPositions — mixed sizes keep half of each apart", () => {
  const out = spreadLabelPositions([50, 50], [10, 20], [0, 100]);
  assert.strictEqual(out[1] - out[0], 15);
});

it("spreadLabelPositions — stays inside its bounds", () => {
  const top = spreadLabelPositions([0, 1, 2], [10, 10, 10], [0, 100]);
  assert.deepStrictEqual(top, [0, 10, 20]);
  const bottom = spreadLabelPositions([99, 100, 100], [10, 10, 10], [0, 100]);
  assert.deepStrictEqual(bottom, [80, 90, 100]);
  // Reversed bounds read the same.
  assert.deepStrictEqual(
    spreadLabelPositions([99, 100, 100], [10, 10, 10], [100, 0]),
    [80, 90, 100],
  );
  // Too many to fit: packed from the top, running past the bottom.
  const over = spreadLabelPositions([5, 5, 5, 5], [10, 10, 10, 10], [0, 20]);
  assert.deepStrictEqual(over, [0, 10, 20, 30]);
});

it("lineLabelBox — sits past a line's right or left end", () => {
  const points = [
    [10, 50],
    [60, 30],
    [110, 20],
  ];
  assert.deepStrictEqual(lineLabelBox(points, "end", 40, 400), {
    x: 100,
    y: -80,
    width: 40,
    height: 100,
  });
  assert.deepStrictEqual(lineLabelBox(points, "start", 40, 400), {
    x: -40,
    y: -50,
    width: 40,
    height: 100,
  });
  // A bumped label moves its box by the bump.
  assert.deepStrictEqual(lineLabelBox(points, "start", 40, 400, 60), {
    x: -40,
    y: -40,
    width: 40,
    height: 100,
  });
  // A reversed line's ends are its leftmost and rightmost points.
  const reversed = points.slice().reverse();
  assert.strictEqual(lineLabelBox(reversed, "end", 40, 400).x, 0);
  assert.strictEqual(lineLabelBox(reversed, "start", 40, 400).x, -140);
});

it("lineLabelSpace — the widest label at the edge, at most the cap", () => {
  const labels = [
    {edgeX: 100, spaceNeeded: 30},
    {edgeX: 100, spaceNeeded: 50},
    {edgeX: 80, spaceNeeded: 90},
  ];
  assert.strictEqual(lineLabelSpace(labels, 100, 100), 50);
  assert.strictEqual(lineLabelSpace(labels, 100, 30), 30);
  assert.strictEqual(lineLabelSpace(labels, 0, 400), 0);
  assert.strictEqual(lineLabelSpace([], 0, 400), 0);
});

/** A measure context on identity axes, labeling each line by its id. */
const measureCtx = {
  labelFunction: d => d.id,
  fontColorAccessor: "red",
  fontSizeAccessor: 10,
  fontWeightAccessor: 400,
  fontFamilyAccessor: ["Arial"],
  paddingAccessor: 5,
  xEstimate: d => d * 10,
  yEstimate: d => 100 - d,
  valueText: v => `${v}%`,
};

const line = (id, points) => [
  id,
  points.map(([x, y]) => ({
    __d3plus__: true,
    data: {id, x, y},
    i: 0,
    x,
    y,
  })),
];

it("measureLineLabel — measures either end of a line", () => {
  const entry = line("a", [
    [1, 10],
    [3, 30],
  ]);
  const end = measureLineLabel(entry, measureCtx, "end");
  assert.strictEqual(end.side, "end");
  assert.strictEqual(end.edgeX, 30);
  assert.strictEqual(end.value, 30);
  assert.strictEqual(end.xValue, 3);
  assert.strictEqual(end.valueText, "30%");
  assert.strictEqual(end.fontColor, "red");
  assert.strictEqual(end.padding, 5);
  const start = measureLineLabel(entry, measureCtx, "start");
  assert.strictEqual(start.side, "start");
  assert.strictEqual(start.edgeX, 10);
  assert.strictEqual(start.value, 10);
  assert.strictEqual(start.xValue, 1);
  assert.strictEqual(start.valueText, "10%");
  assert.ok(end.labelWidth > 10, "the text has width");
  assert.strictEqual(end.spaceNeeded - end.labelWidth, 10);
  const bare = measureLineLabel(entry, {...measureCtx, valueText: () => {}});
  assert.strictEqual(bare.side, "end", "the right end by default");
  assert.ok(bare.labelWidth < end.labelWidth, "no value, narrower");
});

it("labelOverlapsLine — checks the side the label sits on", () => {
  const a = line("a", [
    [2, 50],
    [4, 50],
  ]);
  // b runs through the space right of a's end, c through the space left of its start.
  const b = line("b", [
    [4, 0],
    [5, 50],
  ]);
  const c = line("c", [
    [1, 50],
    [1.5, 0],
  ]);
  const measure = side =>
    [a, b, c].map(entry => measureLineLabel(entry, measureCtx, side));
  const [aEnd] = measure("end");
  assert.strictEqual(labelOverlapsLine(aEnd, measure("end")), true);
  assert.strictEqual(
    labelOverlapsLine(
      aEnd,
      measure("end").filter(l => l.id !== "b"),
    ),
    false,
  );
  const [aStart] = measure("start");
  assert.strictEqual(labelOverlapsLine(aStart, measure("start")), true);
  assert.strictEqual(
    labelOverlapsLine(
      aStart,
      measure("start").filter(l => l.id !== "c"),
    ),
    false,
  );
});

/** A viz stand-in whose y axis maps values straight to pixels. */
const fakeViz = {_yAxis: {_getPosition: v => v}};

it("bumpLineLabels — spreads each end of the lines on its own", () => {
  const labels = [
    {id: "a", side: "start", xValue: 1, value: 50, fontSize: 10, padding: 5},
    {id: "b", side: "start", xValue: 1, value: 52, fontSize: 10, padding: 5},
    {id: "a", side: "end", xValue: 2, value: 10, fontSize: 10, padding: 5},
    {id: "b", side: "end", xValue: 2, value: 90, fontSize: 10, padding: 5},
  ];
  const positions = bumpLineLabels(fakeViz, labels, [0, 100]);
  const [aStart, bStart, aEnd, bEnd] = labels;
  assert.ok(bStart.newY - aStart.newY >= 12 - 1e-9, "the start labels part");
  assert.strictEqual(aEnd.newY, undefined, "the end labels stay put");
  assert.strictEqual(bEnd.newY, undefined);
  assert.deepStrictEqual(Object.keys(positions).sort(), ["start:a", "start:b"]);
  assert.strictEqual(positions["start:a"], aStart.newY);
});

it("bumpLineLabels — a start label at the same x as an end label stays apart", () => {
  const labels = [
    {id: "a", side: "start", xValue: 1, value: 50, fontSize: 10, padding: 5},
    {id: "b", side: "end", xValue: 1, value: 50, fontSize: 10, padding: 5},
  ];
  bumpLineLabels(fakeViz, labels, [0, 100]);
  assert.strictEqual(labels[0].newY, undefined);
  assert.strictEqual(labels[1].newY, undefined);
});

it("bumpLineLabels — spreads right-end labels from lineLabels: true", () => {
  const labels = [
    {id: "a", xValue: 2, value: 52, fontSize: 10, padding: 5},
    {id: "b", xValue: 2, value: 50, fontSize: 10, padding: 5},
  ];
  const positions = bumpLineLabels(fakeViz, labels, [0, 100]);
  assert.deepStrictEqual(
    labels.map(l => l.newY),
    [57, 45],
    "each moves 6px, 12px apart",
  );
  assert.deepStrictEqual(positions, {a: 57, b: 45});
});

it("bumpLineLabels — labels past the plot's room collapse into +N more", () => {
  const labels = ["a", "b", "c", "d", "e"].map((id, i) => ({
    id,
    xValue: 2,
    value: 10 + i,
    fontSize: 10,
    padding: 5,
  }));
  bumpLineLabels(fakeViz, labels, [0, 30]);
  // 12px apart, three fit in 0–30: the third stands for itself and the rest.
  assert.deepStrictEqual(
    labels.map(l => [l.collapsed, l.hidden]),
    [
      [undefined, undefined],
      [undefined, undefined],
      [3, undefined],
      [undefined, true],
      [undefined, true],
    ],
  );
  assert.strictEqual(labels[3].newY, undefined);
});

/** Line-label emit inputs for two lines, `a` labeled at both ends and `b` at its end. */
const emitInputs = (extra = {}) => ({
  viz: {
    schema: {lineLabels: "both", locale: "en-US", translate: s => s},
    _drawLabel: d => `Series ${d.id}`,
  },
  labelWidths: [
    {id: "a", side: "start", labelWidth: 30, valueText: "1%", defaultY: 10},
    {id: "a", side: "end", labelWidth: 50, valueText: "2%", defaultY: 20},
    {id: "b", side: "end", labelWidth: 40, defaultY: 60},
  ],
  largestLabel: 50,
  labelPositions: {},
  ...extra,
});

it("lineLabelConfig — two labels on a line labeled at both ends", () => {
  const config = lineLabelConfig(emitInputs());
  const a = {id: "a", data: {id: "a"}, i: 0};
  assert.deepStrictEqual(config.label(a, 0), ["Series a 1%", "Series a 2%"]);
  const points = [
    [0, 10],
    [100, 20],
  ];
  assert.deepStrictEqual(config.labelBounds(a, 0, {points}), [
    lineLabelBox(points, "start", 30, undefined),
    lineLabelBox(points, "end", 50, undefined),
  ]);
  const b = {id: "b", data: {id: "b"}, i: 1};
  assert.strictEqual(config.label(b, 1), "Series b");
  // The left-end label right-aligns; the rest keep the base anchor.
  const anchor = config.textAnchor("start");
  assert.strictEqual(anchor({l: 0, data: a}, 0), "end");
  assert.strictEqual(anchor({l: 1, data: a}, 0), "start");
  assert.strictEqual(anchor({data: {l: 0, data: b}}, 0), "start");
  assert.strictEqual(
    config.textAnchor(() => "middle")({l: 0, data: b}, 0),
    "middle",
  );
});

it("lineLabelConfig — names a series from `name`, and hides unlabeled rows", () => {
  const inputs = emitInputs({name: d => `${d.id}!`});
  const config = lineLabelConfig(inputs);
  assert.deepStrictEqual(config.label({id: "a", data: {id: "a"}, i: 0}, 0), [
    "a! 1%",
    "a! 2%",
  ]);
  assert.deepStrictEqual(
    lineLabelConfig({...inputs, name: "Fixed"}).label({id: "b", data: {}}, 0),
    "Fixed",
  );
  inputs.viz.schema.lineLabels = d => d.keep;
  const hidden = lineLabelConfig(inputs);
  assert.strictEqual(hidden.label({id: "a", data: {keep: false}}, 0), false);
  assert.strictEqual(hidden.label({id: "z", data: {keep: true}}, 0), false);
});

it("lineLabelConfig — collapsed and hidden labels, and shortened names", () => {
  const config = lineLabelConfig(
    emitInputs({
      labelWidths: [
        {id: "a", side: "end", collapsed: 2},
        {id: "b", side: "end", hidden: true},
        {id: "c", side: "start", name: "Ser\u2026"},
        {id: "d", side: "end", name: "Serie", valueText: "4"},
      ],
    }),
  );
  assert.strictEqual(config.label({id: "a", data: {}}, 0), "+2 more");
  assert.strictEqual(config.label({id: "b", data: {}}, 0), false);
  assert.strictEqual(config.label({id: "c", data: {}}, 0), "Ser\u2026");
  assert.strictEqual(config.label({id: "d", data: {}}, 0), "Serie 4");
});

it("fitLineLabelText — drops the value, then shortens the name, then hides", () => {
  const measure = t => t.length * 10;
  assert.deepStrictEqual(fitLineLabelText("Brazil", "37%", 100, measure), {
    name: "Brazil",
    value: "37%",
  });
  assert.deepStrictEqual(fitLineLabelText("Brazil", undefined, 60, measure), {
    name: "Brazil",
  });
  assert.deepStrictEqual(fitLineLabelText("Brazil", "37%", 60, measure), {
    name: "Brazil",
  });
  assert.deepStrictEqual(fitLineLabelText("Brazil", "37%", 40, measure), {
    name: "Bra\u2026",
  });
  assert.deepStrictEqual(fitLineLabelText("New York", undefined, 50, measure), {
    name: "New\u2026",
  });
  assert.deepStrictEqual(fitLineLabelText("Brazil", undefined, 20, measure), {
    name: "B\u2026",
  });
  assert.strictEqual(fitLineLabelText("Brazil", "37%", 15, measure), null);
});

it("lineLabelCap — a quarter of the width past the y axis per end", () => {
  assert.strictEqual(lineLabelCap(400), 100);
  assert.strictEqual(lineLabelCap(400, 40), 90);
  assert.strictEqual(lineLabelCap(0), 0);
  assert.strictEqual(lineLabelCap(20, 40), 0);
});

it("measureLineLabel — shortens a label to its room, or drops it", () => {
  const entry = line("Argentina", [
    [1, 10],
    [3, 30],
  ]);
  const ctx = {...measureCtx, labelFunction: d => d.id};
  const full = measureLineLabel(entry, ctx, "end");
  assert.strictEqual(full.name, undefined, "fits: no shortened name");
  const roomy = measureLineLabel(entry, {...ctx, maxSpace: 1000}, "end");
  assert.strictEqual(roomy.name, undefined);
  const tight = measureLineLabel(
    entry,
    {...ctx, maxSpace: full.spaceNeeded - 1},
    "end",
  );
  assert.strictEqual(tight.name, "Argentina", "the value goes first");
  assert.strictEqual(tight.valueText, undefined);
  assert.ok(tight.spaceNeeded <= full.spaceNeeded - 1);
  const tighter = measureLineLabel(entry, {...ctx, maxSpace: 45}, "start");
  assert.ok(tighter.name.endsWith("\u2026"), tighter.name);
  assert.ok(tighter.spaceNeeded <= 45);
  assert.strictEqual(measureLineLabel(entry, {...ctx, maxSpace: 21}), null);
});

it("LinePlot — lineLabels takes an end, and lineLabelConfig merges", () => {
  const viz = new LinePlot();
  assert.deepStrictEqual(viz.lineLabelConfig(), {value: false});
  viz.lineLabels("both").lineLabelConfig({value: true});
  assert.strictEqual(viz.lineLabels(), "both");
  const valueFormat = v => `${v}`;
  viz.lineLabelConfig({valueFormat});
  assert.deepStrictEqual(viz.lineLabelConfig(), {value: true, valueFormat});
});
