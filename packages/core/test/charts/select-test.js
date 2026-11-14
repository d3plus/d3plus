import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {Geomap, Plot, Treemap} from "../../index.ts";
import {
  boundsTouchRegion,
  boxPolygon,
  dragRegion,
  extendLasso,
  LASSO_STEP,
  polygonSlice,
  regionBox,
  regionContains,
  regionHits,
  regionPath,
  sourceRow,
  targetInRegion,
} from "../../src/charts/drawSteps/selectRegion.ts";
import {
  combineRows,
  rowKey,
  rowMatcher,
  selectedRows,
  seriesRows,
} from "../../src/charts/drawSteps/selectState.ts";
import {
  clearSelection,
  currentSelection,
  hasSelection,
  lastSelectedChart,
  selectClick,
  selectRows,
  setSelection,
} from "../../src/charts/drawSteps/selectActions.ts";
import {
  chartArea,
  chartTargets,
  SELECT_LAYER,
  selectArea,
  syncSelectSurface,
} from "../../src/charts/drawSteps/selectGesture.ts";
import {
  reserveZoomControlsLeft,
  syncSelectButtons,
  syncSelectTool,
  zoomControlsHtml,
  zoomPanelStyle,
} from "../../src/charts/drawSteps/zoomControlsMarkup.ts";
import {getTopLeftContributions} from "../../src/charts/drawSteps/topLeftControls.ts";
import {topLeftControlsBox} from "../../src/charts/drawSteps/topLeftControlsMarkup.ts";
import {bareFeature} from "../../src/charts/Geomap/emit.ts";
import {applyInteractionOpacity} from "../../src/charts/viz/interactionOpacity.ts";

useJsdom();

const box = (a, b) =>
  dragRegion(
    "box",
    a,
    [b],
    [
      [0, 0],
      [100, 100],
    ],
  );
const triangle = {
  tool: "lasso",
  points: [
    [0, 0],
    [100, 0],
    [0, 100],
  ],
};

/* selectRegion.ts */

it("boxPolygon: a box's corners, clockwise from the top-left", () => {
  assert.deepStrictEqual(
    boxPolygon([
      [1, 2],
      [3, 4],
    ]),
    [
      [1, 2],
      [3, 2],
      [3, 4],
      [1, 4],
    ],
  );
});

it("dragRegion: a box spans the start and the last point, either way round", () => {
  const r = dragRegion(
    "box",
    [50, 60],
    [
      [0, 0],
      [20, 30],
    ],
    [
      [0, 0],
      [100, 100],
    ],
  );
  assert.strictEqual(r.tool, "box");
  assert.deepStrictEqual(regionBox(r), [
    [20, 30],
    [50, 60],
  ]);
});

it("dragRegion: clamps to the area", () => {
  const r = dragRegion(
    "box",
    [50, 50],
    [[150, -20]],
    [
      [10, 10],
      [90, 90],
    ],
  );
  assert.deepStrictEqual(regionBox(r), [
    [50, 10],
    [90, 50],
  ]);
  const lasso = dragRegion(
    "lasso",
    [5, 5],
    [[50, 120]],
    [
      [10, 10],
      [90, 90],
    ],
  );
  assert.deepStrictEqual(lasso.points, [
    [10, 10],
    [50, 90],
  ]);
});

it("dragRegion: a lasso runs through every point", () => {
  const r = dragRegion(
    "lasso",
    [0, 0],
    [
      [10, 0],
      [10, 10],
    ],
    [
      [0, 0],
      [99, 99],
    ],
  );
  assert.deepStrictEqual(r.points, [
    [0, 0],
    [10, 0],
    [10, 10],
  ]);
});

it("extendLasso: skips points within LASSO_STEP of the last", () => {
  const path = [[0, 0]];
  extendLasso(path, [LASSO_STEP - 1, 0]);
  assert.strictEqual(path.length, 1);
  extendLasso(path, [LASSO_STEP, 0]);
  assert.deepStrictEqual(path, [
    [0, 0],
    [LASSO_STEP, 0],
  ]);
  assert.deepStrictEqual(extendLasso([], [4, 5]), [[4, 5]]);
});

it("regionPath: a closed path through the outline", () => {
  assert.strictEqual(regionPath(triangle), "M0,0L100,0L0,100Z");
  assert.strictEqual(regionPath({tool: "lasso", points: []}), "");
});

it("regionContains: a box includes its edges; a lasso its inside", () => {
  const r = box([10, 10], [20, 20]);
  assert.ok(regionContains(r, [10, 15]));
  assert.ok(!regionContains(r, [21, 15]));
  assert.ok(regionContains(triangle, [10, 10]));
  assert.ok(!regionContains(triangle, [80, 80]));
  assert.ok(
    !regionContains(
      {
        tool: "lasso",
        points: [
          [0, 0],
          [9, 9],
        ],
      },
      [1, 1],
    ),
  );
});

it("boundsTouchRegion: a box touches on any overlap", () => {
  const r = box([10, 10], [20, 20]);
  assert.ok(boundsTouchRegion({x: 18, y: 18, width: 30, height: 30}, r));
  assert.ok(!boundsTouchRegion({x: 21, y: 0, width: 5, height: 50}, r));
});

it("boundsTouchRegion: a lasso touches by a corner, a vertex, or a crossing edge", () => {
  // A corner inside the lasso.
  assert.ok(
    boundsTouchRegion({x: 10, y: 10, width: 100, height: 100}, triangle),
  );
  // A lasso vertex inside the box.
  assert.ok(boundsTouchRegion({x: -5, y: -5, width: 10, height: 10}, triangle));
  // Only edges crossing: a thin bar straddling the hypotenuse.
  const bar = {x: 40, y: -10, width: 2, height: 200};
  assert.ok(
    boundsTouchRegion(bar, {
      tool: "lasso",
      points: [
        [0, 50],
        [100, 50],
        [100, 60],
        [0, 60],
      ],
    }),
  );
  assert.ok(
    !boundsTouchRegion({x: 80, y: 80, width: 10, height: 10}, triangle),
  );
});

it("polygonSlice: an outline's vertical extent at x", () => {
  const square = [
    [0, 0],
    [10, 0],
    [10, 20],
    [0, 20],
  ];
  assert.deepStrictEqual(polygonSlice(square, 5), [0, 20]);
  assert.deepStrictEqual(polygonSlice(square, 0), [0, 20]);
  assert.strictEqual(polygonSlice(square, 11), null);
  assert.deepStrictEqual(
    polygonSlice(
      [
        [0, 0],
        [10, 10],
        [0, 10],
      ],
      5,
    ),
    [5, 10],
  );
});

const circle = (key, cx, cy, datum) => ({
  type: "circle",
  key,
  cx,
  cy,
  r: 4,
  datum,
});
const target = (node, extra = {}) => ({
  id: String(node.key),
  node,
  center: node.type === "circle" ? [node.cx, node.cy] : [0, 0],
  box: {x: 0, y: 0, width: 0, height: 0},
  group: "shape",
  chain: [],
  ...extra,
});

it("targetInRegion: a point by its center, a rect by any overlap", () => {
  const r = box([10, 10], [20, 20]);
  assert.ok(targetInRegion(target(circle("a", 15, 15, {})), r));
  assert.ok(!targetInRegion(target(circle("b", 22, 15, {})), r));
  const rect = {
    type: "rect",
    key: "r",
    x: 0,
    y: 0,
    width: 12,
    height: 12,
    datum: {},
  };
  assert.ok(
    targetInRegion(target(rect, {box: {x: 0, y: 0, width: 12, height: 12}}), r),
  );
});

it("targetInRegion: an Area's point by the area's height there", () => {
  const area = {type: "path", key: "a", shapeType: "Area", d: "", datum: {}};
  const t = target(area, {pointIndex: 0, center: [15, 100]});
  const outline = [
    [0, 0],
    [30, 0],
    [30, 40],
    [0, 40],
  ];
  assert.ok(targetInRegion(t, box([10, 10], [20, 20]), outline));
  assert.ok(!targetInRegion(t, box([10, 50], [20, 60]), outline));
  // Without an outline, the point's own position decides.
  assert.ok(!targetInRegion(t, box([10, 10], [20, 20])));
});

it("sourceRow: unwraps one level", () => {
  const row = {id: 1};
  assert.strictEqual(sourceRow({__d3plus__: true, data: row}), row);
  assert.strictEqual(sourceRow(row), row);
  assert.strictEqual(sourceRow(undefined), undefined);
});

it("regionHits: rows of the marks and series points inside", () => {
  const a = {id: "a"},
    b = {id: "b"},
    p0 = {id: "s", x: 0},
    p1 = {id: "s", x: 1},
    series = {id: "s"};
  const line = {
    type: "line",
    key: "s",
    points: [],
    datum: {__d3plus__: true, data: series},
    interactionPoints: [
      {x: 15, y: 15, datum: p0, index: 0},
      {x: 50, y: 50, datum: p1, index: 1},
    ],
  };
  const targets = [
    target(circle("a", 12, 12, {data: a})),
    target(circle("b", 40, 40, b)),
    target(line, {pointIndex: 0, center: [15, 15]}),
    target(line, {pointIndex: 1, center: [50, 50]}),
    {...target(circle("legend", 12, 12, {id: "l"})), group: "legend"},
  ];
  assert.deepStrictEqual(regionHits(targets, box([10, 10], [20, 20])), [
    {row: a},
    {row: p0, series},
  ]);
});

/* selectState.ts */

it("rowKey: same values, same key; underscored and object fields left out", () => {
  const when = new Date(2020, 0, 1);
  const a = {id: "x", value: 1, on: true, when, _i: 3, nested: {q: 1}};
  const b = {when: new Date(2020, 0, 1), value: 1, on: true, id: "x"};
  assert.strictEqual(rowKey(a), rowKey(b));
  assert.notStrictEqual(rowKey(a), rowKey({...b, value: "1"}));
  assert.strictEqual(rowKey(a), rowKey(a), "cached");
  assert.strictEqual(rowKey(null), "null");
});

it("rowMatcher: matches the same rows, or rows with the same values", () => {
  const row = {id: "a", v: 1};
  const match = rowMatcher([row]);
  assert.ok(match(row));
  assert.ok(match({id: "a", v: 1}));
  assert.ok(!match({id: "a", v: 2}));
});

const scene = () => {
  const rows = [{id: "a"}, {id: "b"}];
  const points = [
    {id: "s", x: 0},
    {id: "s", x: 1},
  ];
  const nodes = [
    {
      type: "group",
      key: "g",
      children: [
        circle("a", 0, 0, {__d3plus__: true, data: rows[0], i: 0}),
        circle("b", 0, 0, rows[1]),
        {type: "circle", key: "b::hit", cx: 0, cy: 0, r: 1, datum: rows[1]},
        {
          type: "line",
          key: "s",
          points: [],
          datum: {id: "s"},
          interactionPoints: points.map((datum, k) => ({
            x: k,
            y: 0,
            datum,
            index: k,
          })),
        },
      ],
    },
    {
      type: "group",
      key: "axis",
      interactionGroup: "axis",
      children: [circle("tick", 0, 0, {id: "a"})],
    },
  ];
  return {rows, points, nodes};
};

it("selectedRows: each mark's row and each series point's row, chrome skipped", () => {
  const {rows, points, nodes} = scene();
  assert.deepStrictEqual(
    selectedRows(nodes, () => true),
    [...rows, ...points],
  );
  assert.deepStrictEqual(
    selectedRows(nodes, d => d.id === "a" || d.x === 1),
    [rows[0], points[1]],
  );
});

it("seriesRows: the series holding any of the rows", () => {
  const {nodes, points} = scene();
  assert.deepStrictEqual(seriesRows(nodes, [{id: "s", x: 1}]), [{id: "s"}]);
  assert.deepStrictEqual(seriesRows(nodes, [{id: "a"}]), []);
  assert.strictEqual(points.length, 2);
});

it("combineRows: replaces, adds, or toggles", () => {
  const [a, b, c] = [{id: "a"}, {id: "b"}, {id: "c"}];
  assert.deepStrictEqual(combineRows([a], [b, b], "replace"), [b]);
  assert.deepStrictEqual(combineRows([a, b], [{id: "b"}, c], "add"), [a, b, c]);
  assert.deepStrictEqual(combineRows([a, b], [{id: "b"}, c], "toggle"), [a, c]);
});

/* selectActions.ts */

/** A stand-in chart: a scene, a repaint counter, a `select` log, and a live region. */
const fakeViz = (extra = {}) => {
  const {nodes} = scene();
  const log = [];
  const viz = {
    _chartScene: nodes,
    _uuid: "fake",
    repaints: 0,
    _scheduleSceneRepaint() {
      this.repaints++;
    },
    _keyboardNav: {live: {textContent: ""}},
    schema: {
      on: {select: rows => log.push(rows.map(d => d.id + (d.x ?? "")))},
      translate: (s, _l, ...args) => s.replace("{0}", args[0]),
    },
    log,
    ...extra,
  };
  return viz;
};

it("setSelection / currentSelection / hasSelection", () => {
  const viz = fakeViz();
  assert.ok(!hasSelection(viz));
  assert.deepStrictEqual(currentSelection(viz), []);
  setSelection(viz, [{id: "s", x: 0}]);
  assert.ok(hasSelection(viz));
  assert.deepStrictEqual(currentSelection(viz), [{id: "s", x: 0}]);
  assert.ok(viz._selection({id: "s"}), "the series stays lit");
  setSelection(viz, d => d.id === "b");
  assert.deepStrictEqual(currentSelection(viz), [{id: "b"}]);
  setSelection(viz, []);
  assert.ok(!hasSelection(viz));
  assert.strictEqual(viz.repaints, 3);
  assert.deepStrictEqual(viz.log, [], "code fires no select event");
});

it("selectRows: combines, announces, fires select, and becomes the Escape target", () => {
  const viz = fakeViz();
  selectRows(viz, [{id: "a"}], "replace");
  selectRows(viz, [{id: "b"}], "add");
  assert.strictEqual(viz._keyboardNav.live.textContent, "2 selected");
  selectRows(viz, [{id: "a"}], "toggle");
  assert.deepStrictEqual(viz.log, [["a"], ["a", "b"], ["b"]]);
  assert.ok(lastSelectedChart(viz));
});

it("clearSelection: clears once, announcing it and firing select", () => {
  const viz = fakeViz();
  assert.strictEqual(clearSelection(viz), false);
  selectRows(viz, [{id: "a"}], "replace");
  assert.strictEqual(clearSelection(viz), true);
  assert.strictEqual(viz._keyboardNav.live.textContent, "Selection cleared");
  assert.deepStrictEqual(viz.log, [["a"], []]);
  assert.ok(!lastSelectedChart(viz));
});

it("selectClick: selects a clicked mark while a tool is on", () => {
  const viz = fakeViz();
  const node = circle("a", 0, 0, {id: "a"});
  const click = (shiftKey = false, extra = {}) => ({
    type: "click",
    point: [0, 0],
    pick: {node},
    nativeEvent: {shiftKey},
    ...extra,
  });
  assert.strictEqual(
    selectClick(viz, click(), {id: "a"}, false),
    false,
    "no tool",
  );
  viz._selectTool = "box";
  viz._selectSurface = {press: {clicked: false}};
  assert.strictEqual(
    selectClick(viz, click(), {id: "a"}, true),
    false,
    "legend",
  );
  assert.strictEqual(
    selectClick(viz, click(false, {type: "mousemove"}), {id: "a"}, false),
    false,
  );
  assert.strictEqual(selectClick(viz, click(), {id: "a"}, false), true);
  assert.ok(viz._selectSurface.press.clicked);
  selectClick(viz, click(true), {id: "b"}, false);
  selectClick(viz, click(true), {id: "a"}, false);
  assert.deepStrictEqual(viz.log, [["a"], ["a", "b"], ["b"]]);
  // A mark the chart says the selection can't pick is swallowed, unselected.
  viz._selectMark = () => false;
  viz._selectSurface.press.clicked = false;
  assert.strictEqual(selectClick(viz, click(), {id: "a"}, false), true);
  assert.ok(!viz._selectSurface.press.clicked);
  assert.strictEqual(viz.log.length, 3);
});

/* selectGesture.ts */

it("chartArea / selectArea: the chart area, or the panel's, zoomed with it", () => {
  const viz = {
    _margin: {top: 10, right: 20, bottom: 30, left: 40},
    schema: {width: 400, height: 300},
  };
  assert.deepStrictEqual(chartArea(viz), [
    [40, 10],
    [380, 270],
  ]);
  assert.deepStrictEqual(selectArea(viz, [100, 100]), [
    [40, 10],
    [380, 270],
  ]);
  viz._facetPanels = [
    {
      cell: {x: 0, y: 0, width: 200, height: 300},
      area: {x: 50, y: 20, width: 100, height: 200},
    },
  ];
  assert.deepStrictEqual(selectArea(viz, [100, 100]), [
    [50, 20],
    [150, 220],
  ]);
  viz._zoomTransform = {x: -10, y: 0, scale: 2};
  assert.deepStrictEqual(selectArea(viz, [100, 100]), [
    [90, 40],
    [290, 270],
  ]);
});

it("chartTargets: marks under the zoom and chart transforms, clipped, selectable only", () => {
  const a = {id: "a"},
    b = {id: "b"},
    far = {id: "far"};
  const viz = {
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    schema: {width: 200, height: 200},
    _chartTransform: {x: 10, y: 10},
    _zoomTransform: {x: 0, y: 0, scale: 2},
    _chartScene: [
      circle("a", 10, 10, a),
      circle("b", 20, 20, b),
      circle("far", 500, 5, far),
    ],
    _selectMark: node => node.key !== "b",
  };
  const targets = chartTargets(viz);
  assert.deepStrictEqual(
    targets.map(t => [t.node.key, t.center]),
    [["a", [40, 40]]],
  );
});

it("syncSelectSurface: binds the press, takes touches while a tool is on, and unbinds", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const viz = {_uuid: "u", _select: select(svg), schema: {selectMode: "lasso"}};
  const names = node => (node.__on || []).map(l => `${l.type}.${l.name}`);
  syncSelectSurface(viz);
  assert.strictEqual(viz._selectTool, "lasso");
  assert.ok(names(svg).includes("pointerdown.d3plusselect"));
  assert.strictEqual(svg.style.touchAction, "none");
  viz._selectTool = null;
  syncSelectSurface(viz);
  assert.strictEqual(svg.style.touchAction, "");
  syncSelectSurface(viz, true);
  assert.deepStrictEqual(names(svg), []);
  assert.strictEqual(viz._selectSurface, undefined);
  assert.strictEqual(SELECT_LAYER, "d3plus-select-brush");
});

/* zoomControlsMarkup.ts */

it("syncSelectTool: resets the tool only when selectMode changes", () => {
  const viz = {schema: {selectMode: "box"}};
  syncSelectTool(viz);
  assert.strictEqual(viz._selectTool, "box");
  viz._selectTool = null;
  syncSelectTool(viz);
  assert.strictEqual(viz._selectTool, null, "a button's choice holds");
  viz.schema.selectMode = false;
  syncSelectTool(viz);
  assert.strictEqual(viz._selectTool, null);
});

it("zoomControlsHtml: box and lasso buttons on every chart, none pressed without selectMode", () => {
  const viz = new Treemap();
  syncSelectTool(viz);
  const host = document.createElement("div");
  host.innerHTML = zoomControlsHtml(viz);
  const box = host.querySelector(".select-box");
  const lasso = host.querySelector(".select-lasso");
  assert.ok(box && lasso, "both buttons show");
  assert.strictEqual(box.getAttribute("aria-pressed"), "false");
  assert.strictEqual(lasso.getAttribute("aria-pressed"), "false");
  assert.strictEqual(viz._selectTool, null, "the chart starts out panning");
});

it("zoomPanelStyle: wraps, keeping room for the top-left controls", () => {
  const viz = new Treemap();
  reserveZoomControlsLeft(() => 0);
  assert.strictEqual(zoomPanelStyle(viz).paddingLeft, "0px");
  assert.strictEqual(zoomPanelStyle(viz).flexWrap, "wrap");
  reserveZoomControlsLeft(v => (v === viz ? 72 : 0));
  assert.strictEqual(zoomPanelStyle(viz).paddingLeft, "76px");
  // Put back the top-left controls' own measure.
  reserveZoomControlsLeft(
    v => topLeftControlsBox(v, getTopLeftContributions(v))?.width ?? 0,
  );
});

it("zoomControlsHtml: box and lasso buttons pressed for the selectMode tool", () => {
  const viz = new Treemap().selectMode("lasso");
  syncSelectTool(viz);
  const host = document.createElement("div");
  host.innerHTML = zoomControlsHtml(viz);
  const buttons = [...host.querySelectorAll("button")];
  assert.deepStrictEqual(
    buttons.map(b => b.classList[1]),
    [
      "zoom-in",
      "zoom-out",
      "zoom-reset",
      "zoom-brush",
      "select-box",
      "select-lasso",
    ],
  );
  assert.strictEqual(buttons[4].getAttribute("aria-label"), "Box Select");
  assert.strictEqual(buttons[4].getAttribute("aria-pressed"), "false");
  assert.strictEqual(buttons[5].getAttribute("aria-pressed"), "true");
  viz.locale("es-ES");
  host.innerHTML = zoomControlsHtml(viz);
  assert.strictEqual(
    host.querySelector(".select-lasso").getAttribute("aria-label"),
    "Selección de Lazo",
  );
});

it("syncSelectButtons: reflects the tool onto the buttons", () => {
  const viz = new Treemap().selectMode("box");
  syncSelectTool(viz);
  const host = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const panel = document.createElement("div");
  panel.className = "d3plus-zoom-control";
  panel.innerHTML = zoomControlsHtml(viz);
  host.append(svg, panel);
  document.body.appendChild(host);
  viz._select = select(svg);
  viz._selectTool = "lasso";
  syncSelectButtons(viz);
  assert.strictEqual(
    panel.querySelector(".select-box").getAttribute("aria-pressed"),
    "false",
  );
  assert.strictEqual(
    panel.querySelector(".select-lasso").getAttribute("aria-pressed"),
    "true",
  );
  assert.ok(panel.querySelector(".select-lasso").classList.contains("active"));
});

/* Geomap */

it("bareFeature: a region drawn for no data row", () => {
  assert.ok(
    bareFeature({
      type: "path",
      key: "p",
      datum: {__d3plus__: true, feature: {}},
    }),
  );
  assert.ok(!bareFeature({type: "path", key: "p", datum: {id: "usa"}}));
  assert.ok(!bareFeature({type: "path", key: "p"}));
  assert.ok(
    new Geomap()._selectMark({type: "path", key: "p", datum: {id: "usa"}}),
  );
});

/* interactionOpacity.ts */

it("applyInteractionOpacity: a selection dims the rest; a hover inside it only outlines", () => {
  const a = {id: "a"},
    b = {id: "b"};
  const nodes = [
    {
      type: "rect",
      key: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      datum: a,
      paint: {fill: "#f00"},
    },
    {
      type: "rect",
      key: "b",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      datum: b,
      paint: {fill: "#00f"},
    },
  ];
  const viz = {
    schema: {shapeConfig: {}},
    _selection: d => d.id === "a",
    _hover: d => d.id === "a",
  };
  const [lit, dim] = applyInteractionOpacity(nodes, viz);
  assert.strictEqual(lit.paint.opacity, undefined, "a stays bright");
  assert.ok(lit.paint.strokeWidth > 1, "and takes the hover outline");
  assert.strictEqual(dim.paint.opacity, 0.25, "b dims by activeOpacity");
  // `active` still wins over a selection.
  viz._active = d => d.id === "b";
  viz._hover = false;
  const [, bright] = applyInteractionOpacity(nodes, viz);
  assert.strictEqual(bright.paint.opacity, undefined);
});

it("Plot: selectMode and selectStyle are config keys, and selection reads back rows", () => {
  const viz = new Plot().selectMode("box").selectStyle({stroke: "red"});
  assert.strictEqual(viz.selectMode(), "box");
  assert.strictEqual(viz.selectStyle().stroke, "red");
  assert.strictEqual(
    viz.selectStyle()["fill-opacity"],
    0.15,
    "merged into the defaults",
  );
  assert.deepStrictEqual(viz.selection(), []);
  assert.strictEqual(viz.selection(false), viz);
  assert.strictEqual(new Plot().selectMode(), false);
});
