import {describe, it} from "vitest";
import assert from "assert";

import {
  clientAnchor,
  hoverReach,
  isPointShape,
  nearestHoverSurface,
  nearestPick,
  pointMarkTargets,
  pointTarget,
  pointTooltipAnchor,
  routePointerEvent,
  surfaceOrigin,
} from "../../internal.ts";
import {
  Beeswarm,
  Geomap,
  Network,
  Pack,
  Pie,
  Plot,
  Treemap,
} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

/**
    Nearest-point hover (`hoverDistance`) off a painted scene: which nodes
    are point marks, collecting them in surface space (through group and
    zoom transforms, past clips and `::hit`/inert nodes), when it applies,
    which picks it replaces, and the enter/leave stream it routes.
*/

const circle = (key, cx, cy, r = 3, extra = {}) => ({
  type: "circle",
  key,
  cx,
  cy,
  r,
  shapeType: "Circle",
  datum: {data: {id: key}, i: 0},
  index: 0,
  ...extra,
});

const cells = (children, extra = {}) => ({
  type: "group",
  key: "viz-chart-cells",
  children,
  ...extra,
});

const scene = (...children) => ({
  root: {type: "group", key: "viz-root", children},
});

/** A chart stand-in: point marks are Circle/Rect shapes, events land in `log`. */
function fakeViz(nodes, schema = {}) {
  const log = [];
  const viz = {
    schema: {hoverDistance: 20, width: 400, height: 300, ...schema},
    _pointMark: node => isPointShape(node),
    _paintedScene: scene(cells(nodes)),
    _routeSceneEvent: e =>
      log.push(`${e.type}:${e.pick ? e.pick.node.key : "-"}`),
  };
  return {viz, log};
}

const move = (point, pick = null) => ({
  type: "mousemove",
  point,
  pick,
  nativeEvent: {type: "mousemove"},
});

describe("isPointShape", () => {
  it("accepts Circle and Rect shapes outside composites", () => {
    assert.ok(isPointShape(circle("a", 0, 0)));
    assert.ok(isPointShape({type: "rect", key: "r", shapeType: "Rect"}));
    assert.ok(isPointShape({type: "circle", key: "bare"}), "a bare circle");
    assert.ok(!isPointShape({type: "rect", key: "b", shapeType: "Bar"}));
    assert.ok(!isPointShape({type: "path", key: "p", shapeType: "Path"}));
    assert.ok(
      !isPointShape({
        type: "rect",
        key: "box",
        shapeType: "Rect",
        owners: [{shapeType: "Box", datum: {}, index: 0}],
      }),
      "a Box's rect",
    );
    assert.ok(isPointShape({type: "path", shapeType: "Path"}, ["Path"]));
  });
});

describe("pointMarkTargets", () => {
  it("collects point marks at their surface centers", () => {
    const nodes = [
      {
        type: "group",
        key: "zoom",
        transform: {x: 10, y: 20, scale: 2},
        children: [
          circle("a", 5, 5, 4),
          {
            type: "rect",
            key: "bar",
            x: 0,
            y: 0,
            width: 5,
            height: 50,
            shapeType: "Bar",
            datum: {},
          },
          {
            type: "rect",
            key: "sq",
            x: 30,
            y: 30,
            width: 6,
            height: 10,
            shapeType: "Rect",
            datum: {id: "sq"},
          },
        ],
      },
    ];
    const points = pointMarkTargets([cells(nodes)], isPointShape);
    assert.deepStrictEqual(
      points.map(p => [p.item.node.key, p.x, p.y, p.r]),
      [
        ["a", 20, 30, 8],
        ["sq", 76, 90, 6],
      ],
    );
  });

  it("skips ::hit duplicates, inert nodes, legend items, and clipped marks", () => {
    const nodes = [
      circle("a", 10, 10),
      circle("a::hit", 10, 10, 10, {aria: {hidden: true}}),
      circle("inert", 30, 30, 3, {interactive: false}),
      {
        type: "group",
        key: "clip",
        clip: {type: "rect", x: 0, y: 0, width: 100, height: 100},
        children: [circle("in", 50, 50), circle("out", 150, 50)],
      },
    ];
    const legend = {
      type: "group",
      key: "viz-legend",
      children: [circle("swatch", 200, 200)],
    };
    const points = pointMarkTargets([cells(nodes), legend], isPointShape);
    assert.deepStrictEqual(
      points.map(p => p.item.node.key),
      ["a", "in"],
    );
  });
});

describe("hoverReach", () => {
  it("is hoverDistance, or 0 when off or on a shared-tooltip plot", () => {
    assert.strictEqual(hoverReach(fakeViz([]).viz), 20);
    assert.strictEqual(hoverReach(fakeViz([], {hoverDistance: 0}).viz), 0);
    assert.strictEqual(hoverReach(fakeViz([], {hoverDistance: -5}).viz), 0);
    const {viz} = fakeViz([]);
    delete viz._pointMark;
    assert.strictEqual(hoverReach(viz), 0, "no point marks");
    assert.strictEqual(
      hoverReach(fakeViz([], {tooltipShared: true, discrete: "x"}).viz),
      0,
    );
    assert.strictEqual(
      hoverReach(fakeViz([], {tooltipShared: true}).viz),
      20,
      "a scatter has no discrete axis to share",
    );
  });
});

describe("nearestPick", () => {
  const a = circle("a", 100, 100),
    b = circle("b", 140, 100);
  const line = {
    type: "line",
    key: "grid",
    points: [],
    interactionGroup: "axis",
  };

  it("resolves empty space to the nearest point within reach", () => {
    const {viz} = fakeViz([a, b]);
    assert.strictEqual(nearestPick(viz, null, [110, 100]).node, a);
    assert.strictEqual(nearestPick(viz, null, [125, 100]).node, b);
    assert.strictEqual(nearestPick(viz, null, [100, 140]), null, "too far");
    const pick = nearestPick(viz, null, [100, 110]);
    assert.deepStrictEqual(pick, {node: a, datum: a.datum, index: 0});
  });

  it("replaces chrome and non-point picks, keeps the rest", () => {
    const {viz} = fakeViz([a, b]);
    const p = node => ({node, datum: node.datum, index: 0});
    assert.strictEqual(nearestPick(viz, p(line), [110, 100]).node, a);
    const link = {type: "path", key: "link", shapeType: "Path", datum: {}};
    assert.strictEqual(nearestPick(viz, p(link), [110, 100]).node, a);
    for (const node of [
      b,
      {type: "rect", key: "leg", interactionGroup: "legend", datum: {}},
      {type: "line", key: "trend", interactionGroup: "trend", datum: {}},
      {type: "text", key: "label", datum: {data: {}}},
    ]) {
      const pick = p(node);
      assert.strictEqual(nearestPick(viz, pick, [110, 100]), pick, node.key);
    }
  });

  it("does nothing when hoverDistance is 0", () => {
    const {viz} = fakeViz([a], {hoverDistance: 0});
    assert.strictEqual(nearestPick(viz, null, [101, 100]), null);
  });

  it("follows a zoom transform in the painted scene", () => {
    const zoomed = {
      type: "group",
      key: "viz-zoom",
      transform: {x: -100, y: 0, scale: 2},
      children: [a],
    };
    const {viz} = fakeViz([zoomed]);
    // `a` paints at (100, 200) once zoomed.
    assert.strictEqual(nearestPick(viz, null, [110, 200]).node, a);
    assert.strictEqual(nearestPick(viz, null, [110, 100]), null);
  });

  it("rebuilds once per painted scene", () => {
    const {viz} = fakeViz([a]);
    nearestPick(viz, null, [100, 100]);
    const first = viz._nearestHover.index;
    nearestPick(viz, null, [101, 100]);
    assert.strictEqual(viz._nearestHover.index, first, "cached");
    viz._paintedScene = scene(cells([b]));
    assert.strictEqual(nearestPick(viz, null, [101, 100]), null);
    assert.strictEqual(nearestPick(viz, null, [135, 100]).node, b);
    assert.notStrictEqual(viz._nearestHover.index, first);
  });

  it("stays within the small-multiples panel under the pointer", () => {
    const {viz} = fakeViz([a, b]);
    viz._facetPanels = [
      {key: "left", cell: {x: 0, y: 0, width: 120, height: 300}},
      {key: "right", cell: {x: 125, y: 0, width: 120, height: 300}},
    ];
    // 18px from b, 18px from a — each pointer resolves within its own panel.
    assert.strictEqual(nearestPick(viz, null, [118, 100]).node, a);
    assert.strictEqual(nearestPick(viz, null, [130, 100]).node, b);
    assert.strictEqual(nearestPick(viz, null, [122, 100]), null, "a gap");
  });
});

describe("routePointerEvent", () => {
  const a = circle("a", 100, 100),
    b = circle("b", 140, 100);

  it("enters and leaves the resolved point, not the raw pick", () => {
    const {viz, log} = fakeViz([a, b]);
    routePointerEvent(viz, move([60, 100]));
    routePointerEvent(viz, move([110, 100]));
    routePointerEvent(viz, move([112, 100]));
    // The renderer's own crossing onto `a` is dropped: already hovered.
    routePointerEvent(viz, {
      ...move([100, 100], {node: a}),
      type: "mouseenter",
    });
    routePointerEvent(viz, move([100, 100], {node: a, datum: a.datum}));
    routePointerEvent(viz, move([135, 100]));
    routePointerEvent(viz, move([200, 100]));
    routePointerEvent(viz, {
      type: "mouseleave",
      point: [500, 100],
      pick: null,
      nativeEvent: {type: "mouseleave"},
    });
    assert.deepStrictEqual(log, [
      "mousemove:-",
      "mouseenter:a",
      "mousemove:a",
      "mousemove:a",
      "mousemove:a",
      "mouseleave:-",
      "mouseenter:b",
      "mousemove:b",
      "mouseleave:-",
      "mousemove:-",
      "mouseleave:-",
    ]);
  });

  it("resolves clicks to the nearest point", () => {
    const {viz, log} = fakeViz([a]);
    routePointerEvent(viz, {
      type: "click",
      point: [90, 105],
      pick: null,
      nativeEvent: {type: "click"},
    });
    assert.deepStrictEqual(log, ["click:a"]);
  });

  it("passes events from other sources through", () => {
    const {viz, log} = fakeViz([a], {hoverDistance: 0});
    const bar = {type: "rect", key: "bar", shapeType: "Bar", datum: {}};
    routePointerEvent(viz, {
      type: "mouseenter",
      point: [0, 0],
      pick: {node: bar},
      nativeEvent: {},
    });
    routePointerEvent(viz, {
      type: "mousemove",
      point: [0, 0],
      pick: {node: bar},
      nativeEvent: {},
    });
    assert.deepStrictEqual(log, ["mouseenter:bar", "mousemove:bar"]);
    assert.strictEqual(viz._nearestHover.key, "bar");
  });

  it("matches the renderer's stream when nothing is replaced", () => {
    const {viz, log} = fakeViz([a, b], {hoverDistance: 0});
    const on = node => move([0, 0], {node, datum: node.datum});
    routePointerEvent(viz, on(a));
    routePointerEvent(viz, on(b));
    routePointerEvent(viz, move([0, 0]));
    assert.deepStrictEqual(log, [
      "mouseenter:a",
      "mousemove:a",
      "mouseleave:-",
      "mouseenter:b",
      "mousemove:b",
      "mouseleave:-",
      "mousemove:-",
    ]);
  });
});

describe("nearestHoverSurface", () => {
  useJsdom();

  /** A chart stand-in with an outer svg holding a scene svg and a background rect. */
  function surfaceViz(renderer = "svg") {
    const ns = "http://www.w3.org/2000/svg";
    const outer = document.body.appendChild(
      document.createElementNS(ns, "svg"),
    );
    const background = outer.appendChild(document.createElementNS(ns, "rect"));
    const brush = outer.appendChild(document.createElementNS(ns, "g"));
    brush.setAttribute("class", "d3plus-viz-brush");
    const handle = brush.appendChild(document.createElementNS(ns, "rect"));
    const inner = outer.appendChild(document.createElementNS(ns, "svg"));
    const mark = inner.appendChild(document.createElementNS(ns, "circle"));
    const {viz, log} = fakeViz([circle("a", 100, 100)]);
    viz._renderer = renderer;
    viz._select = {node: () => outer};
    viz._sceneRenderer = {elements: () => [inner]};
    return {viz, log, outer, background, handle, mark};
  }

  const fire = (el, type, x, y, init = {}) =>
    el.dispatchEvent(
      new window.MouseEvent(type, {
        bubbles: type !== "mouseleave",
        clientX: x,
        clientY: y,
        ...init,
      }),
    );

  it("routes moves over the empty space around the scene", () => {
    const {viz, log, outer, background, handle, mark} = surfaceViz();
    nearestHoverSurface(viz);
    fire(outer, "mousemove", 110, 100);
    fire(background, "mousemove", 112, 100);
    fire(mark, "mousemove", 100, 100);
    fire(handle, "mousemove", 100, 100);
    fire(outer, "mousemove", 300, 100);
    assert.deepStrictEqual(log, [
      "mouseenter:a",
      "mousemove:a",
      "mousemove:a",
      "mouseleave:-",
      "mousemove:-",
    ]);
  });

  it("gives a click near a point to the point alone", () => {
    const {viz, log, background} = surfaceViz();
    nearestHoverSurface(viz);
    let reached = 0;
    background.addEventListener("click", () => reached++);
    fire(background, "click", 105, 100);
    assert.deepStrictEqual(log, ["click:a"]);
    assert.strictEqual(reached, 0, "the background never sees it");
    fire(background, "click", 300, 300);
    assert.deepStrictEqual(log, ["click:a"]);
    assert.strictEqual(reached, 1, "a click far from every point passes");
  });

  it("leaves the hovered point when the pointer leaves the chart", () => {
    const {viz, log, outer} = surfaceViz();
    nearestHoverSurface(viz);
    fire(outer, "mouseleave", 500, 500);
    assert.deepStrictEqual(log, [], "nothing hovered, nothing to leave");
    fire(outer, "mousemove", 110, 100);
    fire(outer, "mouseleave", 500, 500);
    assert.deepStrictEqual(log, [
      "mouseenter:a",
      "mousemove:a",
      "mouseleave:-",
    ]);
  });

  it("ignores the scene svg's leave into the space around it", () => {
    const {viz, log, outer, background} = surfaceViz();
    nearestHoverSurface(viz);
    fire(outer, "mousemove", 110, 100);
    routePointerEvent(viz, {
      type: "mouseleave",
      point: [111, 100],
      pick: null,
      nativeEvent: new window.MouseEvent("mouseleave", {
        relatedTarget: background,
      }),
    });
    assert.deepStrictEqual(log, ["mouseenter:a", "mousemove:a"]);
  });

  it("does nothing with hoverDistance 0, and unbinds", () => {
    const {viz, log, outer} = surfaceViz();
    viz.schema.hoverDistance = 0;
    nearestHoverSurface(viz);
    fire(outer, "mousemove", 110, 100);
    assert.deepStrictEqual(log, []);
    viz.schema.hoverDistance = 20;
    nearestHoverSurface(viz, true);
    fire(outer, "mousemove", 110, 100);
    assert.deepStrictEqual(log, [], "unbound");
    assert.strictEqual(viz._nearestHover.surface, undefined);
  });

  it("binds nothing on the Canvas renderer", () => {
    const {viz, log, outer} = surfaceViz("canvas");
    nearestHoverSurface(viz);
    fire(outer, "mousemove", 110, 100);
    assert.deepStrictEqual(log, []);
  });
});

describe("chart point marks", () => {
  useJsdom();
  const node = (type, shapeType, extra = {}) => ({
    type,
    key: "k",
    shapeType,
    ...extra,
  });

  it("Plot, Network and Geomap accept their points; other charts none", () => {
    const point = node("circle", "Circle");
    const square = node("rect", "Rect");
    const bar = node("rect", "Bar");
    const link = node("path", undefined);
    for (const Chart of [Plot, Beeswarm, Network, Geomap]) {
      const chart = new Chart();
      assert.ok(chart._pointMark(point), `${Chart.name} circle`);
      assert.ok(chart._pointMark(square), `${Chart.name} rect`);
      assert.ok(!chart._pointMark(bar), `${Chart.name} bar`);
      assert.ok(!chart._pointMark(link), `${Chart.name} path`);
    }
    for (const Chart of [Treemap, Pack, Pie]) {
      const chart = new Chart();
      assert.ok(!chart._pointMark(point), `${Chart.name} circle`);
      assert.ok(!chart._pointMark(square), `${Chart.name} rect`);
    }
  });

  it("hoverDistance defaults to 20", () => {
    assert.strictEqual(new Plot().hoverDistance(), 20);
    assert.strictEqual(new Network().hoverDistance(5).hoverDistance(), 5);
    assert.strictEqual(
      new Treemap().config({hoverDistance: 0}).hoverDistance(),
      0,
    );
  });
});

describe("point tooltip anchors", () => {
  const a = circle("a", 100, 100, 4);
  const zoomed = {
    type: "group",
    key: "viz-zoom",
    transform: {x: -100, y: 0, scale: 2},
    children: [a],
  };

  it("clientAnchor moves a surface box to client coordinates", () => {
    const anchor = clientAnchor(
      {x: 10, y: 20, width: 8, height: 6},
      {left: 100, top: 50},
    );
    assert.deepStrictEqual(anchor.getBoundingClientRect(), {
      x: 110,
      y: 70,
      left: 110,
      top: 70,
      right: 118,
      bottom: 76,
      width: 8,
      height: 6,
    });
  });

  it("pointTarget finds a point mark's painted target, through its ::hit duplicate", () => {
    const {viz} = fakeViz([zoomed]);
    assert.deepStrictEqual(pointTarget(viz, a).box, {
      x: 92,
      y: 192,
      width: 16,
      height: 16,
    });
    assert.strictEqual(pointTarget(viz, {...a, key: "a::hit"}).node, a);
    const bar = {type: "rect", key: "bar", shapeType: "Bar", datum: {}};
    assert.strictEqual(pointTarget(viz, bar), undefined);
    assert.strictEqual(pointTarget(viz, null), undefined);
    viz.schema.hoverDistance = 0;
    assert.strictEqual(pointTarget(viz, a), undefined, "off at 0");
  });

  it("pointTooltipAnchor points at the mark's top edge in client space", () => {
    const {viz} = fakeViz([zoomed]);
    viz._sceneRenderer = {
      elements: () => [
        {
          localName: "canvas",
          getBoundingClientRect: () => ({left: 30, top: 40}),
        },
      ],
    };
    assert.deepStrictEqual(surfaceOrigin(viz), {left: 30, top: 40});
    const rect = pointTooltipAnchor(viz, a).getBoundingClientRect();
    // The circle paints at (100, 200) with radius 8: its top center is
    // (130, 232) on the page.
    assert.strictEqual(rect.left + rect.width / 2, 130);
    assert.strictEqual(rect.top, 232);
    viz.schema.hoverDistance = 0;
    assert.strictEqual(pointTooltipAnchor(viz, a), undefined);
  });

  it("surfaceOrigin reads an svg's screen CTM, else the viewport origin", () => {
    const {viz} = fakeViz([]);
    viz._sceneRenderer = {
      elements: () => [
        {
          localName: "svg",
          getScreenCTM: () => ({e: 12, f: 34}),
          getBoundingClientRect: () => ({left: 0, top: 0}),
        },
      ],
    };
    assert.deepStrictEqual(surfaceOrigin(viz), {left: 12, top: 34});
    assert.deepStrictEqual(surfaceOrigin(fakeViz([]).viz), {left: 0, top: 0});
  });
});
