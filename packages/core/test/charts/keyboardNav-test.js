import {describe, it} from "vitest";
import assert from "assert";
import {colorDefaults} from "@d3plus/color";

import {
  appendFocusRing,
  chartName,
  createKeyboardNavHost,
  focusRingNode,
  focusRingStyle,
  focusTargets,
  KEYBOARD_NAV_INSTRUCTIONS,
  mapBox,
  mapper,
  nextTarget,
  ownBoxes,
  plainText,
  readingOrder,
  syncKeyboardNav,
  targetLabel,
  teardownKeyboardNav,
  updateKeyboardNavHost,
} from "../../internal.ts";
import {jsdomit} from "~test/jsdom.js";

/**
    The pieces behind keyboard navigation (`keyboardNav`): the marks a scene
    offers focus (`focusTargets`), the spatial arrow-key rules
    (`nextTarget`), reading order, the focus ring, the host element's name
    and attributes, and the host's lifecycle on a chart.
*/

const rect = (key, x, y, width, height, extra = {}) => ({
  type: "rect",
  key,
  x,
  y,
  width,
  height,
  datum: {key},
  ...extra,
});

const cells = (...children) => ({
  type: "group",
  key: "viz-chart-cells",
  children,
});

const ids = targets => targets.map(t => t.id);

describe("sceneBounds helpers", () => {
  it("ownBoxes returns a node's own geometry", () => {
    assert.deepStrictEqual(ownBoxes(rect("a", 1, 2, 3, 4)), [
      {x: 1, y: 2, width: 3, height: 4},
    ]);
    assert.deepStrictEqual(
      ownBoxes({type: "circle", key: "c", cx: 10, cy: 10, r: 5}),
      [{x: 5, y: 5, width: 10, height: 10}],
    );
    assert.deepStrictEqual(
      ownBoxes({type: "group", key: "g", children: []}),
      [],
    );
  });

  it("mapper composes transforms outermost first", () => {
    const map = mapper([
      {x: 100, y: 0, scale: 2},
      {x: 10, y: 5},
    ]);
    assert.deepStrictEqual(map([1, 1]), [122, 12]);
  });

  it("mapBox maps a box's corners", () => {
    const box = mapBox({x: 0, y: 0, width: 10, height: 5}, p => [
      p[0] * 2 + 1,
      p[1] + 3,
    ]);
    assert.deepStrictEqual(box, {x: 1, y: 3, width: 20, height: 5});
  });
});

describe("focusTargets", () => {
  it("visits the chart's marks, skipping chrome and duplicates", () => {
    const shared = {row: 1};
    const nodes = [
      cells(
        rect("bar", 0, 0, 10, 10),
        rect("bar::hit", 0, 0, 20, 20),
        rect("inert", 20, 0, 10, 10, {interactive: false}),
        rect("hidden", 40, 0, 10, 10, {aria: {hidden: true}}),
        rect("nodatum", 60, 0, 10, 10, {datum: undefined}),
        rect("invisible", 80, 0, 10, 10, {paint: {opacity: 0}}),
        {type: "text", key: "label", x: 0, y: 0, datum: {key: "label"}},
        {
          type: "group",
          key: "axis",
          interactionGroup: "axis",
          children: [rect("tick", 0, 50, 1, 5)],
        },
        rect("trend", 0, 60, 5, 5, {interactionGroup: "trend"}),
        rect("dupA", 100, 0, 10, 10, {datum: {data: shared}}),
        rect("dupB", 100, 0, 10, 10, {datum: shared}),
      ),
      {
        type: "group",
        key: "viz-colorScale",
        children: [rect("swatch", 0, 0, 5, 5)],
      },
      {
        type: "group",
        key: "viz-timeline",
        children: [rect("tl", 0, 0, 5, 5)],
      },
      {
        type: "group",
        key: "viz-legend",
        children: [rect("legend", 0, 300, 5, 5)],
      },
    ];
    const targets = focusTargets(nodes);
    assert.deepStrictEqual(ids(targets), ["bar", "dupA", "legend"]);
    assert.deepStrictEqual(
      targets.map(t => t.group),
      ["shape", "shape", "legend"],
    );
  });

  it("maps marks through the zoom and chart transforms", () => {
    const nodes = [
      cells({
        type: "group",
        key: "viz-zoom",
        transform: {x: 5, y: 0, scale: 2},
        children: [
          {
            type: "group",
            key: "viz-chart-body",
            transform: {x: 10, y: 20},
            children: [rect("a", 0, 0, 10, 10)],
          },
        ],
      }),
    ];
    const [t] = focusTargets(nodes);
    assert.deepStrictEqual(t.box, {x: 25, y: 40, width: 20, height: 20});
    assert.deepStrictEqual(t.center, [35, 50]);
    assert.strictEqual(t.chain.length, 2);
  });

  it("expands a series into one target per point, each point once", () => {
    const p = [{v: 1}, {v: 2}];
    const points = [
      {x: 0, y: 10, datum: p[0], index: 0},
      {x: 50, y: 20, datum: p[1], index: 1},
    ];
    const nodes = [
      cells({
        type: "group",
        key: "body",
        transform: {x: 100, y: 0},
        children: [
          {
            type: "line",
            key: "A",
            points: [],
            datum: {id: "A"},
            interactionPoints: points,
          },
          {
            type: "area",
            key: "A-area",
            topline: [],
            baseline: [],
            datum: {id: "A"},
            interactionPoints: points,
          },
        ],
      }),
    ];
    const targets = focusTargets(nodes);
    assert.deepStrictEqual(ids(targets), ["A@0", "A@1"]);
    assert.deepStrictEqual(targets[1].center, [150, 20]);
    assert.strictEqual(targets[1].pointIndex, 1);
    assert.strictEqual(targets[1].box.width, 0);
  });

  it("skips marks a rectangular clip hides", () => {
    const nodes = [
      {
        type: "group",
        key: "viz-chart-cells",
        clip: {type: "rect", x: 0, y: 0, width: 100, height: 100},
        children: [rect("in", 10, 10, 10, 10), rect("out", 200, 10, 10, 10)],
      },
    ];
    assert.deepStrictEqual(ids(focusTargets(nodes)), ["in"]);
  });

  it("centers a path on its outline", () => {
    const [t] = focusTargets([
      cells({type: "path", key: "p", d: "M0,0L10,0L10,10L0,10Z", datum: {}}),
    ]);
    assert.ok(t.center[0] > 0 && t.center[0] < 10);
    assert.ok(t.center[1] > 0 && t.center[1] < 10);
  });

  it("returns nothing for an empty scene", () => {
    assert.deepStrictEqual(focusTargets([]), []);
  });
});

describe("readingOrder", () => {
  const t = (id, x, y) => ({id, box: {x, y, width: 1, height: 1}});
  it("sorts by left edge, then top", () => {
    const order = readingOrder([t("c", 20, 0), t("b", 0, 10), t("a", 0, 0)]);
    assert.deepStrictEqual(ids(order), ["a", "b", "c"]);
  });
  it("leaves the input untouched", () => {
    const list = [t("b", 5, 0), t("a", 0, 0)];
    readingOrder(list);
    assert.deepStrictEqual(ids(list), ["b", "a"]);
  });
});

describe("nextTarget", () => {
  const box = (id, x, y, width = 10, height = 10, extra = {}) => ({
    id,
    box: {x, y, width, height},
    center: [x + width / 2, y + height / 2],
    ...extra,
  });
  // A 3×3 grid of 10px cells with 10px gaps.
  const grid = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) grid.push(box(`${r}${c}`, c * 20, r * 20));
  const at = id => grid.find(g => g.id === id);

  it("moves one cell in each direction", () => {
    assert.strictEqual(nextTarget(grid, at("11"), "right").id, "12");
    assert.strictEqual(nextTarget(grid, at("11"), "left").id, "10");
    assert.strictEqual(nextTarget(grid, at("11"), "up").id, "01");
    assert.strictEqual(nextTarget(grid, at("11"), "down").id, "21");
  });

  it("stays put at an edge", () => {
    assert.strictEqual(nextTarget(grid, at("12"), "right").id, "12");
    assert.strictEqual(nextTarget(grid, at("00"), "up").id, "00");
  });

  it("starts at the first target without a current one", () => {
    assert.strictEqual(nextTarget(grid, null, "down").id, "00");
    assert.strictEqual(nextTarget([], null, "down"), null);
  });

  it("treats bars sharing a baseline as level", () => {
    // Heights 100, 300, 120 on one baseline: Right from the first goes to
    // the second, though its center sits far higher than the third's.
    const bars = [
      box("a", 0, 200, 50, 100),
      box("b", 60, 0, 50, 300),
      box("c", 120, 180, 50, 120),
    ];
    assert.strictEqual(nextTarget(bars, bars[0], "right").id, "b");
    assert.strictEqual(nextTarget(bars, bars[1], "right").id, "c");
    assert.strictEqual(nextTarget(bars, bars[2], "left").id, "b");
  });

  it("prefers the cone, then falls back to the half-plane", () => {
    const from = box("from", 0, 0);
    const cone = box("cone", 100, 50); // 45° cone: |dy| <= dx
    const steep = box("steep", 10, 80); // nearer, but outside the cone
    assert.strictEqual(
      nextTarget([from, cone, steep], from, "right").id,
      "cone",
    );
    assert.strictEqual(nextTarget([from, steep], from, "right").id, "steep");
  });

  it("follows a series along its own axis", () => {
    const line = {
      interactionPoints: [
        {x: 0, y: 10},
        {x: 50, y: 30},
      ],
    };
    const other = {interactionPoints: [{x: 0, y: 0}]};
    const point = (id, node, x, y) => ({
      ...box(id, x, y, 0, 0),
      node,
      pointIndex: 0,
    });
    const a0 = point("a0", line, 0, 10);
    const a1 = point("a1", line, 50, 30);
    const b1 = point("b1", other, 50, 12);
    const b0 = point("b0", other, 0, 40);
    const list = [a0, a1, b1, b0];
    assert.strictEqual(nextTarget(list, a0, "right").id, "a1");
    assert.strictEqual(nextTarget(list, a0, "down").id, "b0");
  });
});

describe("focusRingNode", () => {
  const style = {stroke: "#000", strokeWidth: 2, padding: 3, halo: "#fff"};
  const target = (node, extra = {}) => ({
    id: "t",
    node,
    center: [15, 25],
    box: {x: 10, y: 20, width: 10, height: 10},
    chain: [],
    ...extra,
  });

  it("pads a rectangle around a rect-like mark, over a halo", () => {
    const ring = focusRingNode(target(rect("a", 0, 0, 1, 1)), style);
    assert.strictEqual(ring.key, "viz-focus");
    assert.strictEqual(ring.interactive, false);
    const [halo, stroke] = ring.children;
    assert.deepStrictEqual(
      [stroke.x, stroke.y, stroke.width, stroke.height],
      [7, 17, 16, 16],
    );
    assert.strictEqual(stroke.paint.stroke, "#000");
    assert.strictEqual(stroke.paint.fill, "none");
    assert.strictEqual(halo.paint.stroke, "#fff");
    assert.strictEqual(halo.paint.strokeWidth, 4);
  });

  it("circles a circle and a series point", () => {
    const circle = focusRingNode(
      target({type: "circle", key: "c", cx: 0, cy: 0, r: 5}),
      style,
    );
    assert.strictEqual(circle.children[1].type, "circle");
    assert.strictEqual(circle.children[1].r, 8);
    const point = focusRingNode(
      target({type: "line", key: "l"}, {pointIndex: 2}),
      style,
    );
    assert.strictEqual(point.children[1].type, "circle");
    assert.deepStrictEqual(
      [point.children[1].cx, point.children[1].cy],
      [15, 25],
    );
  });

  it("outlines a path through its transforms", () => {
    const ring = focusRingNode(
      target(
        {
          type: "path",
          key: "p",
          d: "M0,0L1,1",
          transform: {x: 5},
          paint: {fill: "red"},
        },
        {chain: [{x: 1}, {scale: 2}]},
      ),
      style,
    );
    const outer = ring.children[0];
    assert.deepStrictEqual(outer.transform, {x: 1});
    const inner = outer.children[0].children[0];
    assert.deepStrictEqual(inner.transform, {x: 5});
    assert.strictEqual(inner.children[1].d, "M0,0L1,1");
  });

  it("boxes a stroke-only path", () => {
    const ring = focusRingNode(
      target({type: "path", key: "p", d: "M0,0L1,1", paint: {fill: "none"}}),
      style,
    );
    assert.strictEqual(ring.children[1].type, "rect");
  });
});

describe("host naming", () => {
  const translate = s => `t(${s})`;
  it("plainText strips tags and collapses whitespace", () => {
    assert.strictEqual(
      plainText("<b>Sales</b>\n by  <i>Region</i>"),
      "Sales by Region",
    );
    assert.strictEqual(plainText(undefined), "");
  });

  it("chartName prefers svgTitle, then title, then a translated fallback", () => {
    assert.strictEqual(
      chartName({schema: {svgTitle: "Doc", title: () => "T", translate}}),
      "Doc",
    );
    assert.strictEqual(
      chartName({schema: {title: data => `T${data.length}`, translate}}),
      "T0",
    );
    assert.strictEqual(chartName({schema: {translate}}), "t(Chart)");
    const throws = () => {
      throw new Error("no data");
    };
    assert.strictEqual(
      chartName({schema: {title: throws, translate}}),
      "t(Chart)",
    );
  });
});

/** A minimal chart for the host lifecycle: a root svg in a div, one painted bar. */
function fakeViz(container, extra = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.top = "4px";
  svg.style.left = "6px";
  container.appendChild(svg);
  const events = [];
  const children = [cells(rect("a", 0, 0, 10, 10), rect("b", 20, 0, 10, 10))];
  const viz = {
    _uuid: "u1",
    _select: {node: () => svg},
    _paintedScene: {root: {type: "group", key: "viz-root", children}},
    _chartScene: [],
    schema: {
      keyboardNav: true,
      keyboardNavConfig: {},
      colorDefaults,
      width: 300,
      height: 200,
      translate: s => s,
      ...extra,
    },
    _drawLabel: d => `label ${d.key}`,
    _routeSceneEvent: e => events.push(e),
    _scheduleSceneRepaint: () => events.push({type: "repaint"}),
  };
  return {viz, events, children};
}

describe("host lifecycle", () => {
  jsdomit("createKeyboardNavHost builds a focusable application", () => {
    const div = document.createElement("div");
    const {host, desc, live} = createKeyboardNavHost(div, "u9");
    assert.strictEqual(host.parentNode, div);
    assert.strictEqual(host.getAttribute("tabindex"), "0");
    assert.strictEqual(host.getAttribute("role"), "application");
    assert.strictEqual(host.style.pointerEvents, "none");
    assert.strictEqual(desc.id, "u9-keyboard-desc");
    assert.strictEqual(live.getAttribute("aria-live"), "polite");
  });

  jsdomit("updateKeyboardNavHost names, describes and places the host", () => {
    const div = document.createElement("div");
    const {viz} = fakeViz(div, {svgTitle: "Sales", svgDesc: "About"});
    const els = createKeyboardNavHost(div, viz._uuid);
    updateKeyboardNavHost(viz, els);
    const {host, desc} = els;
    assert.strictEqual(host.getAttribute("aria-label"), "Sales");
    assert.strictEqual(
      host.getAttribute("aria-roledescription"),
      "interactive chart",
    );
    assert.strictEqual(
      host.getAttribute("aria-describedby"),
      "u1-desc u1-keyboard-desc",
    );
    assert.strictEqual(desc.textContent, KEYBOARD_NAV_INSTRUCTIONS);
    assert.deepStrictEqual(
      [host.style.top, host.style.left, host.style.width, host.style.height],
      ["4px", "6px", "300px", "200px"],
    );
  });

  jsdomit("syncKeyboardNav installs the host, teardown removes it", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const {viz} = fakeViz(div);
    syncKeyboardNav(viz);
    const host = div.querySelector(".d3plus-keyboard-nav");
    assert.ok(host);
    syncKeyboardNav(viz);
    assert.strictEqual(div.querySelectorAll(".d3plus-keyboard-nav").length, 1);
    teardownKeyboardNav(viz);
    assert.strictEqual(div.querySelector(".d3plus-keyboard-nav"), null);
    assert.strictEqual(viz._keyboardNav, undefined);
    viz.schema.keyboardNav = true;
    syncKeyboardNav(viz);
    viz.schema.keyboardNav = false;
    syncKeyboardNav(viz);
    assert.strictEqual(div.querySelector(".d3plus-keyboard-nav"), null);
  });

  jsdomit("focus and arrow keys replay pointer events over the marks", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const {viz, events} = fakeViz(div);
    syncKeyboardNav(viz);
    const host = div.querySelector(".d3plus-keyboard-nav");
    host.focus();
    assert.strictEqual(viz._keyboardNav.current, "a");
    assert.deepStrictEqual(
      events.map(e => e.type),
      ["mouseenter", "mousemove", "repaint"],
    );
    assert.strictEqual(events[0].pick.node.key, "a");
    assert.deepStrictEqual(events[0].point, [5, 5]);
    assert.strictEqual(
      host.querySelector("[aria-live]").textContent,
      "label a",
    );
    events.length = 0;
    host.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight"}));
    assert.deepStrictEqual(
      events.map(e => [e.type, e.nativeEvent?.type]),
      [
        ["mouseleave", "mousemove"],
        ["mouseenter", "mouseenter"],
        ["mousemove", "mousemove"],
        ["repaint", undefined],
      ],
    );
    events.length = 0;
    host.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter"}));
    assert.deepStrictEqual(
      events.map(e => e.type),
      ["mousemove", "click"],
    );
    events.length = 0;
    host.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}));
    assert.strictEqual(viz._keyboardNav.current, null);
    assert.deepStrictEqual(
      events.map(e => [e.type, e.nativeEvent?.type]),
      [
        ["mouseleave", "mouseleave"],
        ["repaint", undefined],
      ],
    );
    teardownKeyboardNav(viz);
  });

  jsdomit("replayed events wait for a running transition", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const {viz, events} = fakeViz(div);
    syncKeyboardNav(viz);
    viz._transitionEndsAt = Date.now() + 30;
    div.querySelector(".d3plus-keyboard-nav").focus();
    assert.deepStrictEqual(events, []);
    await new Promise(r => setTimeout(r, 80));
    assert.deepStrictEqual(
      events.map(e => e.type),
      ["mouseenter", "mousemove", "repaint"],
    );
    teardownKeyboardNav(viz);
  });

  jsdomit(
    "appendFocusRing rings the focused mark, or falls back to the first",
    () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const {viz, children} = fakeViz(div);
      syncKeyboardNav(viz);
      const scene = [...children];
      appendFocusRing(viz, scene);
      assert.strictEqual(scene.length, 1, "no ring without a focused mark");
      viz._keyboardNav.current = "b";
      appendFocusRing(viz, scene);
      assert.strictEqual(scene[1].key, "viz-focus");
      assert.strictEqual(scene[1].children[1].x, 18);
      viz._keyboardNav.current = "gone";
      const again = [...children];
      appendFocusRing(viz, again);
      assert.strictEqual(viz._keyboardNav.current, "a");
      assert.strictEqual(viz._keyboardNav.stale, true);
      teardownKeyboardNav(viz);
    },
  );
});

describe("labels and ring style", () => {
  const viz = {
    schema: {
      colorDefaults,
      keyboardNavConfig: {},
      shapeConfig: {
        ariaLabel: (d, i) => `row ${d.v} #${i}`,
        Line: {ariaLabel: d => `point ${d.v}`},
      },
    },
    _drawLabel: d => `drawn ${d.v}`,
  };
  const node = {type: "rect", key: "r", datum: {v: 1}, index: 0};

  it("targetLabel reads a mark's aria-label, else its drawn label", () => {
    assert.strictEqual(
      targetLabel(viz, {node: {...node, aria: {label: "aria 1"}}}),
      "aria 1",
    );
    assert.strictEqual(targetLabel(viz, {node}), "drawn 1");
  });

  it("targetLabel labels a series point with the shape's ariaLabel", () => {
    const line = {
      type: "line",
      key: "l",
      shapeType: "Line",
      datum: {v: "series"},
      interactionPoints: [{x: 0, y: 0, datum: {data: {v: 7}, i: 3}, index: 0}],
    };
    assert.strictEqual(
      targetLabel(viz, {node: line, pointIndex: 0}),
      "point 7",
    );
    const area = {...line, shapeType: "Area"};
    assert.strictEqual(
      targetLabel(viz, {node: area, pointIndex: 0}),
      "row 7 #3",
    );
  });

  it("focusRingStyle defaults to the background ink, with config overrides", () => {
    const style = focusRingStyle(viz, {node});
    assert.strictEqual(style.strokeWidth, 2);
    assert.strictEqual(style.padding, 2);
    assert.ok(style.stroke);
    assert.strictEqual(style.halo, "rgb(255, 255, 255)");
    const custom = focusRingStyle(
      {
        ...viz,
        schema: {
          ...viz.schema,
          keyboardNavConfig: {
            stroke: d => `c${d.v}`,
            strokeWidth: 4,
            padding: 0,
          },
        },
      },
      {node},
    );
    assert.deepStrictEqual(
      [custom.stroke, custom.strokeWidth, custom.padding],
      ["c1", 4, 0],
    );
  });
});
