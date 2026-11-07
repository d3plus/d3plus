import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {near} from "~test/helpers.js";
import {Donut, Pie} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {
  applyPieLayout,
  pieRingLayout,
} from "../../src/charts/Pie/applyLayout.ts";
import {ringSizeFor} from "../../src/charts/Pie/arcFit.ts";
import {textShownWhole} from "../../src/charts/Pie/curvedLabels.ts";
import {pieEmit} from "../../src/charts/Pie/emit.ts";
import {
  NO_ROOM,
  clampSides,
  crowdedRoom,
  layoutWithLabelRoom,
  outsideClaim,
  pieLabelRoom,
  usedRoom,
} from "../../src/charts/Pie/labelRoom.ts";
import {
  OUTSIDE_LABEL_FONT_SIZE,
  leaderPoints,
  leaderRoutes,
  outsideColumn,
  outsideIdealY,
  outsideMetrics,
  outsideRoom,
  outsideSide,
  polylinesCross,
  segmentDistance,
  stackOutsideLabels,
} from "../../src/charts/Pie/outsideLabels.ts";
import {
  LEADER_OPACITY,
  OUTSIDE_ENTER,
  outsideSpace,
  pieOutsideLabels,
  pieOutsideNodes,
  placeOutsideLabels,
} from "../../src/charts/Pie/outsideNodes.ts";
import {
  labelGoesOutside,
  outsideFontSize,
  pieLabelPlan,
  pieMayLabelOutside,
  pieSharePct,
  twoLineWidth,
} from "../../src/charts/Pie/pieLabels.ts";
import {pieStraightLabels} from "../../src/charts/Pie/straightLabels.ts";

useJsdom();

const TAU = Math.PI * 2;
const metrics = outsideMetrics(12);

const spending = [
  {id: "Housing", value: 33.3},
  {id: "Transportation", value: 17},
  {id: "Food", value: 12.9},
  {id: "Personal insurance and pensions", value: 12},
  {id: "Healthcare", value: 8},
  {id: "Entertainment", value: 4.7},
  {id: "Cash contributions", value: 3.4},
  {id: "Apparel and services", value: 2.6},
  {id: "Education", value: 2.2},
  {id: "Miscellaneous", value: 1.4},
  {id: "Personal care", value: 1.2},
  {id: "Alcoholic beverages", value: 0.8},
  {id: "Tobacco", value: 0.4},
  {id: "Reading", value: 0.1},
];

/** A 600×500 chart, prepared for its layout stage with no margins. */
function prepare(viz, width = 600, height = 500) {
  viz.width(width).height(height).duration(0);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  return viz;
}

/** Lays a chart out with `applyPieLayout`. */
function draw(viz, width, height) {
  prepare(viz, width, height);
  const {shapeData} = runStages({viz}, [applyPieLayout]);
  return {viz, shapeData};
}

const outsideText = nodes =>
  nodes
    .filter(n => n.type === "text" && `${n.key}`.startsWith("pie-outside-"))
    .map(n => n.lines.map(l => l.text).join(" "));

it("outsideMetrics — a 1.3em column line and a 10px elbow, 8px tail, 4px gap", () => {
  assert.deepStrictEqual(outsideMetrics(12), {
    fontSize: 12,
    lineHeight: 16,
    elbow: 10,
    tail: 8,
    gap: 4,
  });
  assert.strictEqual(outsideMetrics(20).lineHeight, 26);
});

it("outsideSide — right for a slice facing right, up or down; left otherwise", () => {
  assert.strictEqual(outsideSide(Math.PI / 2), 1);
  assert.strictEqual(outsideSide(0), 1);
  assert.strictEqual(outsideSide(Math.PI), 1);
  assert.strictEqual(outsideSide(-Math.PI / 4), -1);
  assert.strictEqual(outsideSide(TAU - 0.1), -1);
});

it("outsideColumn — the ring's radius plus the elbow and the tail", () => {
  assert.strictEqual(outsideColumn(100, metrics), 118);
});

it("outsideIdealY — level with the slice's middle, pushed out by the elbow", () => {
  near(outsideIdealY(0, 100, metrics), -110, 1e-9, "12 o'clock");
  near(outsideIdealY(Math.PI, 100, metrics), 110, 1e-9, "6 o'clock");
  near(outsideIdealY(Math.PI / 2, 100, metrics), 0, 1e-9, "3 o'clock");
});

it("outsideRoom — the widest label on each side, plus its leader", () => {
  const room = outsideRoom(
    [
      {angle: 1, width: 50},
      {angle: 2, width: 80},
      {angle: -1, width: 30},
    ],
    metrics,
  );
  assert.deepStrictEqual(room, {left: 52, right: 102});
  assert.deepStrictEqual(outsideRoom([{angle: 1, width: 40}], metrics), {
    left: 0,
    right: 62,
  });
});

it("stackOutsideLabels — sorts by ideal height and spreads apart without overlap", () => {
  const ys = stackOutsideLabels(
    [
      {y: 10, size: 16, weight: 3},
      {y: 0, size: 16, weight: 2},
      {y: 5, size: 16, weight: 1},
    ],
    [-100, 100],
  );
  // Sorted by their ideal heights: 0, 5, 10, then packed 16 apart around them.
  assert.deepStrictEqual(
    ys.map(y => Math.round(y)),
    [21, -11, 5],
  );
});

it("stackOutsideLabels — keeps the column within its bounds", () => {
  const ys = stackOutsideLabels(
    [
      {y: -95, size: 16, weight: 1},
      {y: -94, size: 16, weight: 1},
    ],
    [-100, 100],
  );
  assert.deepStrictEqual(ys, [-92, -76]);
});

it("stackOutsideLabels — drops the smallest weights first when the column is too tall", () => {
  const items = [10, 1, 5, 2].map((weight, k) => ({
    y: k,
    size: 20,
    weight,
  }));
  const ys = stackOutsideLabels(items, [0, 50]);
  assert.strictEqual(ys[1], null, "the smallest goes first");
  assert.strictEqual(ys[3], null, "then the next smallest");
  assert.ok(ys[0] !== null && ys[2] !== null);
  assert.ok(ys[2] - ys[0] >= 20 - 1e-9);
});

it("stackOutsideLabels — drops labels `fits` rejects, smallest first", () => {
  const items = [
    {y: 0, size: 10, weight: 5},
    {y: 0, size: 10, weight: 1},
  ];
  // Nothing may sit below 0: the two can't both stay at or above it.
  const ys = stackOutsideLabels(items, [-100, 100], (_i, y) => y <= 0);
  assert.strictEqual(ys[1], null);
  assert.ok(ys[0] <= 0);
  assert.deepStrictEqual(stackOutsideLabels([], [0, 10]), []);
});

it("segmentDistance — the nearest the segment comes to the origin", () => {
  assert.strictEqual(segmentDistance([-5, 3], [5, 3]), 3);
  near(segmentDistance([3, 4], [6, 8]), 5, 1e-12, "ends nearest");
});

it("leaderRoutes — straight out by the elbow, across, then level into the column", () => {
  const radius = 100;
  const angle = Math.PI / 4;
  const y = outsideIdealY(angle, radius, metrics);
  const [route] = leaderRoutes(angle, radius, y, metrics);
  const [a, elbow, knee, end] = route;
  near(Math.hypot(...a), radius, 1e-9, "starts on the ring");
  near(Math.hypot(...elbow), radius + metrics.elbow, 1e-9, "elbow");
  near(Math.atan2(elbow[0], -elbow[1]), angle, 1e-9, "radial");
  assert.strictEqual(knee[1], y);
  assert.strictEqual(end[1], y);
  assert.strictEqual(end[0], outsideColumn(radius, metrics));
  assert.strictEqual(end[0] - knee[0], metrics.tail, "level tail");
  assert.deepStrictEqual(leaderPoints(angle, radius, y, metrics), route);
});

it("leaderRoutes — mirrors on the left, and every route stays outside the ring", () => {
  const radius = 120;
  for (const angle of [-0.3, -1, -2.5, 0.2, 1.4, 2.9]) {
    const ideal = outsideIdealY(angle, radius, metrics);
    for (const dy of [-30, 0, 30]) {
      for (const route of leaderRoutes(angle, radius, ideal + dy, metrics)) {
        assert.strictEqual(
          Math.sign(route[3][0]),
          outsideSide(angle),
          `${angle}: its side`,
        );
        for (let k = 1; k < route.length; k++)
          assert.ok(
            segmentDistance(route[k - 1], route[k]) >= radius - 1e-6,
            `${angle} ${dy}: segment ${k} clears the ring`,
          );
      }
    }
  }
});

it("leaderRoutes — a label beside the ring's top it can't reach without crossing has no route", () => {
  const radius = 100;
  // A sliver at 12 o'clock can't reach a label level with the ring's middle.
  assert.deepStrictEqual(leaderRoutes(-0.01, radius, 0, metrics), []);
  assert.strictEqual(leaderPoints(-0.01, radius, 0, metrics), null);
});

it("polylinesCross — segments that pass through each other, but not ones that touch", () => {
  assert.strictEqual(
    polylinesCross(
      [
        [0, 0],
        [10, 10],
      ],
      [
        [0, 10],
        [10, 0],
      ],
    ),
    true,
  );
  assert.strictEqual(
    polylinesCross(
      [
        [0, 0],
        [10, 0],
      ],
      [
        [0, 5],
        [10, 5],
      ],
    ),
    false,
  );
  // Meeting within the tolerance of an end doesn't count.
  assert.strictEqual(
    polylinesCross(
      [
        [0, 0],
        [10, 0],
      ],
      [
        [1, -5],
        [1, 1],
      ],
    ),
    false,
  );
});

it("ringSizeFor — a full ring's diameter; a half ring twice as wide as tall", () => {
  assert.deepStrictEqual(ringSizeFor(100, 0, TAU, 3), {
    width: 206,
    height: 206,
  });
  const half = ringSizeFor(100, -Math.PI / 2, Math.PI / 2);
  near(half.width, 200, 1e-9, "width");
  near(half.height, 100, 1e-9, "height");
});

it("clampSides — scales both sides down so the ring keeps its least size", () => {
  assert.deepStrictEqual(clampSides(50, 50, 600, 400), [50, 50]);
  assert.deepStrictEqual(clampSides(150, 50, 600, 500), [75, 25]);
  assert.deepStrictEqual(clampSides(10, 0, 100, 200), [0, 0]);
});

it("outsideClaim — its own width, else its two-line width, up to the cap", () => {
  assert.strictEqual(outsideClaim(80, 50, 100), 80);
  assert.strictEqual(outsideClaim(160, 90, 100), 90);
  assert.strictEqual(outsideClaim(260, 140, 100), 0);
});

it("crowdedRoom — room above for labels facing up, below for those facing down", () => {
  const room = crowdedRoom(
    NO_ROOM,
    [
      {angle: -0.1, size: 16},
      {angle: 0.2, size: 32},
      {angle: 3, size: 16},
    ],
    500,
    300,
  );
  assert.deepStrictEqual(room, {left: 0, right: 0, top: 48, bottom: 16});
  const tight = crowdedRoom(NO_ROOM, [{angle: 0, size: 300}], 500, 300);
  assert.strictEqual(tight.top, 200, "the ring keeps its least height");
});

it("usedRoom — a side with no label placed gives its room back", () => {
  const room = {left: 40, right: 60, top: 10, bottom: 0};
  assert.deepStrictEqual(usedRoom(room, {left: true, right: false}), {
    left: 40,
    right: 0,
    top: 10,
    bottom: 0,
  });
});

it("textShownWhole — every letter in order, hyphenated breaks included", () => {
  assert.strictEqual(
    textShownWhole(["Trans-", "portation"], "Transportation"),
    true,
  );
  assert.strictEqual(textShownWhole(["Personal care"], "Personal care"), true);
  assert.strictEqual(textShownWhole(["Enter..."], "Entertainment"), false);
  assert.strictEqual(textShownWhole(["..."], "Entertainment"), false);
  assert.strictEqual(textShownWhole([], ""), false);
});

it("twoLineWidth — the wider line at the best break between words", () => {
  const width = t => t.length;
  assert.strictEqual(twoLineWidth("Cash contributions 3.4%", width), 18);
  assert.strictEqual(twoLineWidth("Personal care 1.2%", width), 9);
  assert.strictEqual(twoLineWidth("Transportation", width), 14);
});

it("labelGoesOutside — outside always, inside and along never, auto when cut short", () => {
  assert.strictEqual(labelGoesOutside("outside", true), true);
  assert.strictEqual(labelGoesOutside("inside", false), false);
  assert.strictEqual(labelGoesOutside("along", false), false);
  assert.strictEqual(labelGoesOutside("auto", false), true);
  assert.strictEqual(labelGoesOutside("auto", true), false);
});

it("outsideFontSize — the labelConfig's fontSize, else 12", () => {
  assert.strictEqual(outsideFontSize({}), OUTSIDE_LABEL_FONT_SIZE);
  assert.strictEqual(OUTSIDE_LABEL_FONT_SIZE, 12);
  assert.strictEqual(outsideFontSize({fontSize: 15}), 15);
  assert.strictEqual(outsideFontSize({fontSize: () => 15}), 12);
});

it("pieMayLabelOutside / pieSharePct — read the labelPosition and the share", () => {
  const {viz, shapeData} = draw(new Pie().data(spending).groupBy("id"));
  assert.strictEqual(pieMayLabelOutside(viz, shapeData), true);
  viz.labelPosition("inside");
  assert.strictEqual(pieMayLabelOutside(viz, shapeData), false);
  viz.labelPosition(d => (d.id === "Reading" ? "outside" : "along"));
  assert.strictEqual(pieMayLabelOutside(viz, shapeData), true);
  assert.strictEqual(pieSharePct(viz)({share: 0.125}), "12.5%");
});

it("pieStraightLabels — a label per slice in its largest box", () => {
  const viz = prepare(new Pie().data(spending.slice(0, 3)).groupBy("id"));
  const slices = pieRingLayout(viz);
  const arc = viz.ctx.arcData;
  const nodes = pieStraightLabels({
    viz,
    slices,
    arcMaker: d => arc(d),
    sc: {fill: "#336699"},
    sharePct: pieSharePct(viz),
    labelConfig: {},
  });
  const text = nodes.map(n => n.lines.map(l => l.text).join(" "));
  assert.ok(
    text.some(t => t.startsWith("Housing")),
    text.join(", "),
  );
  assert.ok(
    text.some(t => t.includes("%")),
    "a share beneath",
  );
});

it("pieRingLayout — keeps room around the ring, its hole shrinking with it", () => {
  const viz = prepare(new Donut().data(spending).groupBy("id"));
  pieRingLayout(viz);
  const full = viz.ctx.arcData.outerRadius()();
  const hole = viz.ctx.arcData.innerRadius()({}, 0);
  assert.deepStrictEqual(viz.ctx.pieCenter, {x: 300, y: 250});
  pieRingLayout(viz, {left: 160, right: 0, top: 20, bottom: 0});
  const r = viz.ctx.arcData.outerRadius()();
  near(r, 217, 1e-9, "fits the width left");
  near(
    viz.ctx.arcData.innerRadius()({}, 0) / r,
    hole / full,
    1e-9,
    "the hole keeps its proportion",
  );
  assert.deepStrictEqual(viz.ctx.pieCenter, {x: 380, y: 260});
});

it("pieLabelPlan — small slices go outside; the plan is kept for its layout", () => {
  const {viz, shapeData} = draw(new Pie().data(spending).groupBy("id"));
  const plan = pieLabelPlan(viz, shapeData);
  assert.strictEqual(pieLabelPlan(viz, shapeData), plan, "cached");
  const names = plan.outside.map(c => c.text);
  assert.ok(names.includes("Reading 0.1%"), names.join(", "));
  assert.ok(!names.some(t => t.startsWith("Housing")), "big slices stay in");
  for (const c of plan.outside) {
    assert.ok(c.width > 0 && c.wrapWidth <= c.width);
    assert.strictEqual(c.weight, c.slice.value);
  }
  viz.labelPosition("inside");
  const inside = pieLabelPlan(prepare(viz), pieRingLayout(viz));
  assert.deepStrictEqual(inside.outside, []);
});

it("pieLabelRoom — room on the side the small slices face, within the floor", () => {
  const viz = prepare(new Pie().data(spending).groupBy("id"));
  const slices = pieRingLayout(viz);
  const room = pieLabelRoom(viz, slices, NO_ROOM, 300);
  // The long tail ends just before 12 o'clock, on the left.
  assert.ok(room.left > 60, `left ${room.left}`);
  assert.strictEqual(room.right, 0);
  const tight = pieLabelRoom(viz, slices, NO_ROOM, 560);
  assert.strictEqual(tight.left, 40, "clamped to the floor");
  viz.labelPosition("inside");
  assert.strictEqual(pieLabelRoom(viz, slices, NO_ROOM, 300), NO_ROOM);
});

it("layoutWithLabelRoom — shrinks the ring only when labels go outside", () => {
  const {viz} = draw(new Pie().data(spending.slice(0, 3)).groupBy("id"));
  near(viz.ctx.arcData.outerRadius()(), 247, 1e-9, "full size");
  const {viz: tail} = draw(new Pie().data(spending).groupBy("id"));
  const r = tail.ctx.arcData.outerRadius()();
  assert.ok(r < 247 && r >= 247 * 0.6, `${r}`);
  assert.ok(tail.ctx.pieCenter.x > 300, "shifted away from the labels");
  const calls = [];
  const slices = layoutWithLabelRoom(
    prepare(new Pie().data(spending).groupBy("id").labelPosition("inside")),
    room => {
      calls.push(room);
      return pieRingLayout(viz, room);
    },
    {width: 300, height: 300},
  );
  assert.ok(slices.length);
  assert.deepStrictEqual(calls, [NO_ROOM], "laid out once");
});

it("outsideSpace / placeOutsideLabels — columns beside the ring, apart, with leaders", () => {
  const frame = {radius: 150, cx: 300, cy: 250, width: 600, height: 500};
  assert.deepStrictEqual(outsideSpace(frame, metrics), {
    left: 128,
    right: 128,
  });
  const labels = [-0.3, -0.25, -0.2, 0.5, 2.5].map((angle, k) => ({
    angle,
    weight: 5 - k,
    lines: k === 4 ? 2 : 1,
  }));
  const placed = placeOutsideLabels(labels, frame, metrics);
  assert.ok(placed.every(Boolean), "all fit");
  const left = placed.slice(0, 3).map(p => p.y);
  for (let k = 1; k < left.length; k++)
    assert.ok(
      Math.abs(left[k] - left[k - 1]) >= metrics.lineHeight - 1e-9,
      "apart",
    );
  for (const [k, p] of placed.entries()) {
    assert.strictEqual(Math.sign(p.leader[3][0]), outsideSide(labels[k].angle));
    assert.strictEqual(p.leader[3][1], p.y);
  }
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++)
      assert.ok(!polylinesCross(placed[i].leader, placed[j].leader));
});

it("pieOutsideNodes — inert labels and leaders that carry their slice's row", () => {
  const {viz, shapeData} = draw(new Pie().data(spending).groupBy("id"));
  const plan = pieLabelPlan(viz, shapeData);
  const frame = {
    radius: viz.ctx.arcData.outerRadius()(),
    cx: viz.ctx.pieCenter.x,
    cy: viz.ctx.pieCenter.y,
    width: 600,
    height: 500,
  };
  const {nodes, named, crowded} = pieOutsideNodes(viz, plan.outside, frame);
  assert.ok(named.size >= 5, `${named.size} named`);
  assert.ok(Array.isArray(crowded));
  const texts = nodes.filter(n => n.type === "text");
  const lines = nodes.filter(n => n.type === "line");
  assert.strictEqual(texts.length, named.size);
  assert.strictEqual(lines.length, named.size);
  for (const n of nodes) {
    assert.strictEqual(n.interactive, false);
    assert.strictEqual(n.aria.hidden, true);
    assert.deepStrictEqual(n.enterWindow, OUTSIDE_ENTER);
    assert.ok(
      [...named].some(s => s.data === n.datum),
      "its slice's row",
    );
  }
  for (const n of lines) {
    assert.strictEqual(n.paint.strokeWidth, 1);
    assert.strictEqual(n.paint.strokeOpacity, LEADER_OPACITY);
  }
  assert.deepStrictEqual(pieOutsideNodes(viz, [], frame).nodes, []);
});

it("pieOutsideLabels — worked out once per layout", () => {
  const {viz, shapeData} = draw(new Pie().data(spending).groupBy("id"));
  assert.strictEqual(
    pieOutsideLabels(viz, shapeData),
    pieOutsideLabels(viz, shapeData),
  );
});

it("pieEmit — the long tail is named outside, each slice once", () => {
  const {viz, shapeData} = draw(new Pie().data(spending).groupBy("id"));
  const nodes = pieEmit({viz, shapeData});
  const outside = outsideText(nodes);
  assert.ok(outside.includes("Reading 0.1%"), outside.join(", "));
  assert.ok(outside.includes("Entertainment 4.7%"), outside.join(", "));
  const inside = nodes
    .filter(n => n.type === "text" && !`${n.key}`.startsWith("pie-outside-"))
    .map(n => n.lines.map(l => l.text).join(" "));
  for (const t of outside) {
    const name = t.replace(/ [\d.]+%$/, "");
    assert.ok(!inside.some(i => i.startsWith(name)), `${name} is named once`);
  }
});

it("pieEmit — inside keeps every label in; outside puts every one out", () => {
  const inside = draw(
    new Donut().data(spending).groupBy("id").labelPosition("inside"),
  );
  assert.deepStrictEqual(outsideText(pieEmit(inside)), []);
  near(inside.viz.ctx.arcData.outerRadius()(), 247, 1e-9, "full size");
  const outside = draw(
    new Donut()
      .data(spending.slice(0, 6))
      .groupBy("id")
      .labelPosition("outside"),
  );
  const text = outsideText(pieEmit(outside));
  assert.strictEqual(text.length, 6, text.join(", "));
  const curved = pieEmit(outside).filter(n => n.type === "text" && n.path);
  assert.deepStrictEqual(curved, [], "no curved label");
});

it("pieEmit — a half pie labels its slivers outside, beside its flat edge", () => {
  const seats = [120, 105, 48, 39, 28, 9, 4, 3, 2].map((value, k) => ({
    id: `Party ${String.fromCharCode(65 + k)}`,
    value,
  }));
  const {viz, shapeData} = draw(
    new Pie().data(seats).groupBy("id").startAngle(-90).endAngle(90),
  );
  const labels = pieEmit({viz, shapeData}).filter(n =>
    `${n.key}`.startsWith("pie-outside-"),
  );
  const texts = labels.filter(n => n.type === "text");
  assert.ok(texts.length >= 3, `${texts.length}`);
  for (const n of labels.filter(n => n.type === "line"))
    assert.ok(n.points[3][0] > 0, "on the right, where the slivers face");
});
