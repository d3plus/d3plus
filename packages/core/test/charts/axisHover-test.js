import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {
  anchorAxes,
  barEndOffset,
  closestAnchor,
  collectAnchors,
  isAnchorMark,
  liftAnchor,
  markAnchors,
  nearestAnchor,
} from "../../src/charts/Plot/axisHoverAnchors.ts";
import {
  axisValueAt,
  formatAxisValue,
  handleAxisHover,
  resolveAxisHover,
} from "../../src/charts/Plot/axisHover.ts";
import {
  axisHoverDefaults,
  axisHoverNodes,
  badgeBox,
  guidePoints,
  plotEdges,
} from "../../src/charts/Plot/axisHoverScene.ts";

useJsdom();

/**
    #782: the axis hover's pure pieces — which point a hover snaps to, which
    axes it badges, what each badge reads, and the guide/badge geometry.
*/

const wrap = (row, extra = {}) => ({
  __d3plus__: true,
  data: row,
  i: 0,
  id: row.id,
  x: row.x,
  y: row.y,
  x2: undefined,
  y2: undefined,
  ...extra,
});

const circle = (row, cx, cy, extra = {}) => ({
  type: "circle",
  key: row.id,
  shapeType: "Circle",
  cx: 0,
  cy: 0,
  r: 5,
  transform: {x: cx, y: cy},
  datum: wrap(row),
  paint: {fill: "#ff0000"},
  ...extra,
});

it("axisHover: barEndOffset picks the edge farther from the bar's base", () => {
  assert.strictEqual(barEndOffset(-80, 80), -80, "a positive bar ends on top");
  assert.strictEqual(barEndOffset(0, 50), 50, "a negative bar ends below");
  assert.strictEqual(barEndOffset(-10, 4), -10);
});

it("axisHover: liftAnchor moves an anchor and spans the move", () => {
  const anchor = {x: 10, y: 90, datum: {}};
  assert.deepStrictEqual(liftAnchor(anchor, 40, "y"), {
    x: 10,
    y: 40,
    datum: {},
    span: [90, 40],
  });
  assert.deepStrictEqual(liftAnchor(anchor, 30, "x").span, [10, 30]);
  assert.strictEqual(liftAnchor(anchor, NaN, "y"), anchor, "no end, no move");
});

it("axisHover: markAnchors reads each mark's drawn point", () => {
  const row = {id: "a", x: 1, y: 2};
  const c = markAnchors(circle(row, 30, 40), "y", "red");
  assert.deepStrictEqual(
    c.map(a => [a.x, a.y, a.color, a.shape]),
    [[30, 40, "red", "Circle"]],
  );

  const line = {
    type: "path",
    key: "a",
    shapeType: "Line",
    datum: row,
    interactionPoints: [
      {x: 0, y: 10, datum: wrap(row)},
      {x: 50, y: 20, datum: wrap(row)},
    ],
  };
  assert.deepStrictEqual(
    markAnchors(line, "y").map(a => [a.x, a.y]),
    [
      [0, 10],
      [50, 20],
    ],
  );

  // A vertical bar's transform sits on its base; it ends at its top.
  const bar = {
    type: "rect",
    key: "a",
    shapeType: "Bar",
    x: -10,
    y: -60,
    width: 20,
    height: 60,
    transform: {x: 100, y: 200},
    datum: wrap(row),
  };
  assert.deepStrictEqual(
    markAnchors(bar, "y").map(a => [a.x, a.y, a.span]),
    [[100, 140, [200, 140]]],
  );
  // A horizontal bar ends at its right edge.
  const hbar = {...bar, x: 0, y: -10, width: 70, height: 20};
  assert.deepStrictEqual(
    markAnchors(hbar, "x").map(a => [a.x, a.y, a.span]),
    [[170, 200, [100, 170]]],
  );
  // Any other rect reads at its center.
  assert.deepStrictEqual(
    markAnchors({...bar, shapeType: "Rect"}, "y").map(a => [a.x, a.y]),
    [[100, 170]],
  );

  assert.deepStrictEqual(
    markAnchors({...bar, key: "a::hit"}, "y"),
    [],
    "a hit target stands in for its mark",
  );
  assert.deepStrictEqual(markAnchors({...bar, datum: undefined}, "y"), []);
  assert.deepStrictEqual(
    markAnchors({type: "path", key: "p", shapeType: "Path", datum: row}, "y"),
    [],
    "a path without points has none",
  );
});

it("axisHover: isAnchorMark keeps data marks only", () => {
  const row = {id: "a", x: 1, y: 2};
  assert.ok(isAnchorMark(circle(row, 0, 0)));
  assert.ok(!isAnchorMark(undefined));
  assert.ok(!isAnchorMark({...circle(row, 0, 0), interactionGroup: "axis"}));
  assert.ok(!isAnchorMark({...circle(row, 0, 0), interactive: false}));
  assert.ok(!isAnchorMark({...circle(row, 0, 0), shapeType: "Box"}));
  assert.ok(!isAnchorMark({...circle(row, 0, 0), shapeType: undefined}));
  assert.ok(
    !isAnchorMark({...circle(row, 0, 0), datum: {__d3plusShape__: true}}),
  );
});

it("axisHover: collectAnchors walks the chart scene's marks", () => {
  const a = circle({id: "a", x: 1, y: 2}, 10, 20);
  const b = circle({id: "b", x: 3, y: 4}, 30, 40);
  const viz = {
    schema: {},
    _chartScene: [
      {type: "group", key: "content", children: [a, b]},
      {
        type: "group",
        key: "plot-x-axis",
        interactionGroup: "axis",
        children: [circle({id: "tick", x: 0, y: 0}, 0, 0)],
      },
    ],
  };
  assert.deepStrictEqual(
    collectAnchors(viz).map(p => [p.datum.id, p.x, p.y, p.color]),
    [
      ["a", 10, 20, "#ff0000"],
      ["b", 30, 40, "#ff0000"],
    ],
  );
  assert.deepStrictEqual(collectAnchors({schema: {}}), [], "no scene");
});

it("axisHover: nearestAnchor measures along one axis, bars by their span", () => {
  const anchors = [
    {x: 0, y: 10, datum: {id: "a"}},
    {x: 0, y: 50, datum: {id: "b"}},
  ];
  assert.strictEqual(nearestAnchor(anchors, "y", 35).datum.id, "b");
  assert.strictEqual(nearestAnchor(anchors, "y", 20).datum.id, "a");
  assert.strictEqual(nearestAnchor([], "y", 20), null);
  const stack = [
    {x: 0, y: 60, span: [100, 60], datum: {id: "low"}},
    {x: 0, y: 10, span: [60, 10], datum: {id: "high"}},
  ];
  assert.strictEqual(
    nearestAnchor(stack, "y", 55).datum.id,
    "high",
    "inside the upper segment, though nearer the lower one's end",
  );
});

it("axisHover: closestAnchor measures in both directions", () => {
  const anchors = [
    {x: 0, y: 0, datum: {id: "a"}},
    {x: 10, y: 10, datum: {id: "b"}},
  ];
  assert.strictEqual(closestAnchor(anchors, [8, 7]).datum.id, "b");
  assert.strictEqual(closestAnchor(anchors, [1, 2]).datum.id, "a");
  assert.strictEqual(closestAnchor([], [1, 2]), null);
});

it("axisHover: anchorAxes picks the axes a point is badged on", () => {
  const plain = {x: 1, y: 2};
  assert.deepStrictEqual(anchorAxes(plain, {}), ["x", "y"]);
  assert.deepStrictEqual(anchorAxes({...plain, y2: 5}, {}), ["x", "y2"]);
  assert.deepStrictEqual(anchorAxes({...plain, x2: 5}, {}), ["x2", "y"]);
  assert.deepStrictEqual(
    anchorAxes(plain, {bar: true, discrete: "x"}),
    ["y"],
    "a bar skips its discrete axis",
  );
  assert.deepStrictEqual(anchorAxes(plain, {bar: true, discrete: "y"}), ["x"]);
  assert.deepStrictEqual(anchorAxes(plain, {bar: true}), ["y"]);
  assert.deepStrictEqual(anchorAxes(plain, {cross: "y"}), ["x"]);
  assert.deepStrictEqual(anchorAxes(plain, {only: "x"}), ["x"]);
  assert.deepStrictEqual(anchorAxes({...plain, y2: 1}, {only: "y"}), ["y2"]);
});

it("axisHover: axisValueAt reads the record's value where it's drawn", () => {
  const invert = px => px / 2;
  assert.strictEqual(axisValueAt(42, 84, 84, invert), 42);
  assert.strictEqual(axisValueAt(42, 84, 84.5, invert), 42, "within a pixel");
  assert.strictEqual(
    axisValueAt(42, 84, 120, invert),
    60,
    "a stacked top reads the axis there",
  );
  assert.strictEqual(axisValueAt(42, 84, 120), 42, "nothing to invert");
  assert.strictEqual(axisValueAt(42, NaN, 120, invert), 60);
});

it("axisHover: formatAxisValue formats as plain text", () => {
  assert.strictEqual(
    formatAxisValue(v => `<b>${v}</b> `, 3),
    "3",
  );
  assert.strictEqual(formatAxisValue(undefined, "A"), "A");
  assert.strictEqual(
    formatAxisValue(v => `${v}`, undefined),
    "",
  );
  assert.strictEqual(
    formatAxisValue(v => `${v}`, null),
    "",
  );
  assert.strictEqual(
    formatAxisValue(v => `${v}`, NaN),
    "",
  );
});

it("axisHover: plotEdges, guidePoints and badgeBox place the chrome", () => {
  const edges = plotEdges({x: 20, y: 10, width: 200, height: 100});
  assert.deepStrictEqual(edges, {left: 20, right: 220, top: 10, bottom: 110});
  const p = {x: 50, y: 60};
  assert.deepStrictEqual(guidePoints("x", p, edges), [
    [50, 60],
    [50, 110],
  ]);
  assert.deepStrictEqual(guidePoints("x2", p, edges)[1], [50, 10]);
  assert.deepStrictEqual(guidePoints("y", p, edges)[1], [20, 60]);
  assert.deepStrictEqual(guidePoints("y2", p, edges)[1], [220, 60]);
  const size = {width: 30, height: 20};
  assert.deepStrictEqual(badgeBox("x", 50, size, edges), {
    x: 35,
    y: 110,
    width: 30,
    height: 20,
  });
  assert.deepStrictEqual(badgeBox("x2", 50, size, edges), {
    x: 35,
    y: -10,
    width: 30,
    height: 20,
  });
  assert.deepStrictEqual(badgeBox("y", 60, size, edges), {
    x: -10,
    y: 50,
    width: 30,
    height: 20,
  });
  assert.deepStrictEqual(badgeBox("y2", 60, size, edges), {
    x: 220,
    y: 50,
    width: 30,
    height: 20,
  });
});

it("axisHover: axisHoverDefaults are fresh dashed guides and padded badges", () => {
  const a = axisHoverDefaults();
  assert.deepStrictEqual(a, {
    guideConfig: {strokeDasharray: "4 3", strokeWidth: 1},
    badgeConfig: {fontSize: 12, fontWeight: 400, padding: 4, rx: 2},
  });
  assert.notStrictEqual(a.guideConfig, axisHoverDefaults().guideConfig);
});

/** A minimal scatter: x px = 2·x, y px = 100 − y, over a 200×100 plot. */
function scatter(config = {}) {
  const a = circle({id: "a", x: 30, y: 40}, 60, 60);
  const b = circle({id: "b", x: 80, y: 90}, 160, 10, {
    paint: {fill: "#0000ff"},
  });
  return {
    schema: {
      axisHover: true,
      axisHoverConfig: axisHoverDefaults(),
      colorDefaults: {},
      fontFamily: "sans-serif",
      locale: "en-US",
      ...config,
    },
    _chartScene: [a, b],
    _plotArea: {x: 0, y: 0, width: 200, height: 100},
    _xFunc: v => v * 2,
    _yFunc: v => 100 - v,
    _scheduleSceneRepaint() {
      this.repaints = (this.repaints || 0) + 1;
    },
    marks: {a, b},
  };
}

it("axisHover: resolveAxisHover badges a hovered circle on both axes", () => {
  const viz = scatter();
  const event = {type: "mousemove", pick: {node: viz.marks.b}, point: [0, 0]};
  const state = resolveAxisHover(viz, event, [161, 11]);
  assert.deepStrictEqual(state.point, {x: 160, y: 10});
  assert.strictEqual(state.color, "#0000ff");
  assert.strictEqual(state.datum.id, "b");
  assert.deepStrictEqual(state.badges, [
    {axis: "x", at: 160, text: "80", guide: true},
    {axis: "y", at: 10, text: "90", guide: true},
  ]);
  assert.strictEqual(
    resolveAxisHover(viz, {type: "mousemove", pick: null}, [0, 0]),
    null,
    "nothing hovered",
  );
  viz._plotArea = {x: 0, y: 0, width: 100, height: 100};
  assert.strictEqual(
    resolveAxisHover(viz, event, [161, 11]),
    null,
    "a point outside the plot area is clipped",
  );
});

it("axisHover: resolveAxisHover follows the snapped hover on a discrete axis", () => {
  const viz = scatter({discrete: "x", stacked: true});
  // A stacked bar column at x = 100: "low" spans 100→60, "high" 60→20.
  const bar = (id, base, end) => ({
    type: "rect",
    key: id,
    shapeType: "Bar",
    x: -10,
    y: end - base,
    width: 20,
    height: base - end,
    transform: {x: 100, y: base},
    datum: wrap({id, x: 2020, y: 40}),
    paint: {fill: id === "low" ? "#111111" : "#eeeeee"},
  });
  viz._chartScene = [bar("low", 100, 60), bar("high", 60, 20)];
  // y = 100 − v, offset onto a scale whose own range is 0 → 100.
  viz._yAxis = {
    _d3Scale: scaleLinear().domain([100, 0]).range([0, 100]),
    _scaleData: [],
    schema: {domain: [100, 0]},
  };
  viz._sharedHoverState = {mode: "shared", axis: "x", px: 100, value: 2020};
  const state = resolveAxisHover(
    viz,
    {type: "mousemove", pick: null},
    [100, 30],
  );
  assert.strictEqual(state.datum.id, "high");
  assert.deepStrictEqual(
    state.badges,
    [{axis: "y", at: 20, text: "80", guide: true}],
    "a stacked bar reads its stack's top, on the value axis only",
  );
  viz._sharedHoverState = null;
  assert.strictEqual(
    resolveAxisHover(viz, {type: "mousemove", pick: null}, [100, 30]),
    null,
    "no snapped hover, no axis hover",
  );
});

it("axisHover: resolveAxisHover badges the crosshair's discrete position", () => {
  const viz = scatter({discrete: "x"});
  const row = {id: "a", x: 2020, y: 40};
  viz._chartScene = [
    {
      type: "path",
      key: "a",
      shapeType: "Line",
      datum: row,
      paint: {stroke: "#00ff00"},
      interactionPoints: [{x: 100, y: 60, datum: wrap(row)}],
    },
  ];
  viz._sharedHoverState = {mode: "shared", axis: "x", px: 100, value: 2020};
  const state = resolveAxisHover(
    viz,
    {type: "mousemove", pick: null},
    [100, 30],
  );
  assert.strictEqual(state.color, "#00ff00");
  assert.deepStrictEqual(state.badges, [
    {axis: "x", at: 100, text: "2020", guide: false},
    {axis: "y", at: 60, text: "40", guide: true},
  ]);
  viz.schema.axisHover = "y";
  assert.deepStrictEqual(
    resolveAxisHover(viz, {type: "mousemove", pick: null}, [100, 30]).badges
      .length,
    1,
    'axisHover: "y" badges the y axis only',
  );
});

it("axisHover: handleAxisHover tracks the hover and clears on leave", () => {
  const viz = scatter();
  const move = {type: "mousemove", pick: {node: viz.marks.a}, point: [60, 60]};
  handleAxisHover(viz, move);
  assert.strictEqual(viz._axisHoverState.datum.id, "a");
  assert.strictEqual(viz.repaints, 1);
  handleAxisHover(viz, move);
  assert.strictEqual(viz.repaints, 1, "an unchanged hover doesn't repaint");
  handleAxisHover(viz, {type: "click", pick: null, point: [0, 0]});
  assert.strictEqual(viz._axisHoverState.datum.id, "a", "clicks pass through");
  handleAxisHover(viz, {type: "mouseleave", pick: null, point: [0, 0]});
  assert.strictEqual(viz._axisHoverState, null);
  assert.strictEqual(viz.repaints, 2);

  viz.schema.axisHover = false;
  handleAxisHover(viz, move);
  assert.strictEqual(viz._axisHoverState, null, "off with axisHover(false)");
  assert.strictEqual(viz.repaints, 2);

  viz.schema.axisHover = true;
  viz._facetPanels = [{key: "p1", cell: {x: 0, y: 0, width: 300, height: 300}}];
  handleAxisHover(viz, move);
  assert.strictEqual(viz._axisHoverState.panel, "p1", "records its panel");
});

it("axisHover: axisHoverNodes draws inert guides and contrasting badges", () => {
  const viz = scatter();
  const state = {
    point: {x: 160, y: 10},
    color: "#000000",
    datum: {id: "b"},
    index: 0,
    badges: [
      {axis: "x", at: 160, text: "80", guide: true},
      {axis: "y", at: 10, text: "90", guide: false},
    ],
  };
  const {guides, badges} = axisHoverNodes(viz, state);
  assert.strictEqual(guides.length, 1, "only guided axes get a guide");
  const [guide] = guides;
  assert.strictEqual(guide.type, "line");
  assert.deepStrictEqual(guide.points, [
    [160, 10],
    [160, 100],
  ]);
  assert.strictEqual(guide.paint.stroke, "#000000", "the mark's color");
  assert.deepStrictEqual(guide.paint.strokeDasharray, [4, 3]);
  assert.strictEqual(guide.interactive, false);
  assert.strictEqual(guide.interactionGroup, "axis");

  assert.strictEqual(badges.length, 2);
  const [box, text] = badges[0].children;
  assert.strictEqual(box.type, "rect");
  assert.strictEqual(box.paint.fill, "#000000");
  assert.strictEqual(box.y, 100, "under the x axis line");
  assert.strictEqual(box.x + box.width / 2, 160);
  assert.strictEqual(box.height, 12 + 4 * 2);
  assert.strictEqual(text.lines[0].text, "80");
  assert.notStrictEqual(text.paint.fill, "#000000", "contrasting ink");
  for (const node of [badges[0], box, text]) {
    assert.strictEqual(node.interactive, false);
    assert.strictEqual(node.interactionGroup, "axis");
  }
  assert.strictEqual(
    badges[1].children[0].x + badges[1].children[0].width,
    0,
    "left of the y axis line",
  );

  viz.schema.axisHoverConfig = {
    guideConfig: {stroke: "#123456", strokeDasharray: "none"},
    badgeConfig: {fill: d => (d.id === "b" ? "#ffffff" : "red"), padding: 2},
  };
  const styled = axisHoverNodes(viz, state);
  assert.strictEqual(styled.guides[0].paint.stroke, "#123456");
  assert.strictEqual(styled.guides[0].paint.strokeDasharray, undefined);
  assert.strictEqual(styled.badges[0].children[0].paint.fill, "#ffffff");
  assert.strictEqual(styled.badges[0].children[0].height, 12 + 2 * 2);

  assert.deepStrictEqual(axisHoverNodes({schema: {}}, state), {
    guides: [],
    badges: [],
  });
});

it("axisHover: resolveAxisHover badges a secondary axis in its own format", () => {
  const viz = scatter();
  const row = {id: "s", x: 30, y: undefined};
  const mark = circle(row, 60, 50);
  mark.datum = wrap(row, {y: undefined, y2: 50});
  viz._chartScene = [mark];
  viz._y2Config = {tickFormat: v => `${v} units`};
  const state = resolveAxisHover(
    viz,
    {type: "mousemove", pick: {node: mark}},
    [60, 50],
  );
  assert.deepStrictEqual(state.badges, [
    {axis: "x", at: 60, text: "30", guide: true},
    {axis: "y2", at: 50, text: "50 units", guide: true},
  ]);
});
