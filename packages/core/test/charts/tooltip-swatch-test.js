import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  leadTitleWithSwatch,
  nodeColor,
  nodeSwatch,
  pickSwatch,
  tooltipSwatch,
  visibleColor,
  withSwatch,
} from "../../src/charts/features/tooltipSwatch.ts";
import Tooltip from "../../src/components/Tooltip.ts";

useJsdom();

/** Parses swatch HTML into its root element. */
const parse = html => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstElementChild;
};

it("tooltipSwatch — a Line is a stroke through a dot", () => {
  const sw = parse(tooltipSwatch("red", "Line"));
  assert.ok(sw.classList.contains("d3plus-tooltip-swatch"));
  assert.ok(sw.classList.contains("d3plus-tooltip-swatch-line"));
  const [stroke, dot] = sw.children;
  assert.strictEqual(stroke.style.background, "red", "the stroke");
  assert.strictEqual(stroke.style.height, "2px");
  assert.strictEqual(dot.style.background, "red", "the dot");
  assert.strictEqual(dot.style.borderRadius, "50%");
  assert.strictEqual(stroke.style.left, "0px", "the stroke spans the swatch");
  assert.strictEqual(stroke.style.right, "0px");
  assert.ok(
    parseFloat(sw.style.width) > parseFloat(dot.style.width),
    "and pokes out either side of the dot",
  );
});

it("tooltipSwatch — every shape is the same size, so swatches line up", () => {
  const sizes = ["Line", "Circle", "Rect"].map(shape => {
    const sw = parse(tooltipSwatch("red", shape));
    return [sw.style.width, sw.style.height];
  });
  assert.deepStrictEqual(sizes, [
    ["10px", "10px"],
    ["10px", "10px"],
    ["10px", "10px"],
  ]);
});

it("withSwatch — centers the swatch on its text", () => {
  const el = parse(withSwatch(tooltipSwatch("red", "Rect"), "Alpha"));
  assert.strictEqual(el.style.display, "inline-flex");
  assert.strictEqual(el.style.alignItems, "center");
  assert.ok(
    el.firstElementChild.classList.contains("d3plus-tooltip-swatch"),
    "swatch first",
  );
  assert.strictEqual(el.lastElementChild.textContent, "Alpha", "then the text");
  assert.strictEqual(
    withSwatch("", "Alpha"),
    "Alpha",
    "just the text without a swatch",
  );
  assert.strictEqual(withSwatch("", 42), "42");
});

it("tooltipSwatch — a Circle is a dot, everything else a square", () => {
  const dot = parse(tooltipSwatch("blue", "Circle"));
  assert.strictEqual(dot.style.borderRadius, "50%");
  assert.strictEqual(dot.style.background, "blue");
  for (const shape of ["Rect", "Bar", "Area", "Path", "Box", undefined]) {
    const square = parse(tooltipSwatch("blue", shape));
    assert.strictEqual(
      square.style.borderRadius,
      "1px",
      `${shape} is a square`,
    );
    assert.ok(!square.classList.contains("d3plus-tooltip-swatch-line"));
  }
});

it("tooltipSwatch — nothing without a color", () => {
  assert.strictEqual(tooltipSwatch(undefined, "Line"), "");
  assert.strictEqual(tooltipSwatch("", "Rect"), "");
});

it("visibleColor", () => {
  assert.strictEqual(visibleColor("red"), "red");
  assert.strictEqual(visibleColor("none"), undefined);
  assert.strictEqual(visibleColor("transparent"), undefined);
  assert.strictEqual(visibleColor(undefined), undefined);
  assert.strictEqual(visibleColor(3), undefined);
});

it("nodeColor — a Line's stroke, otherwise the fill", () => {
  const viz = {_chartScene: []};
  assert.strictEqual(
    nodeColor(viz, {shapeType: "Line", paint: {stroke: "red", fill: "none"}}),
    "red",
  );
  assert.strictEqual(
    nodeColor(viz, {shapeType: "Rect", paint: {stroke: "black", fill: "blue"}}),
    "blue",
  );
  assert.strictEqual(
    nodeColor(viz, {shapeType: "Rect", paint: {stroke: "black", fill: "none"}}),
    "black",
    "unfilled marks use the stroke",
  );
  assert.strictEqual(
    nodeColor(viz, {shapeType: "Rect"}),
    undefined,
    "no paint",
  );
  assert.strictEqual(nodeColor(viz, undefined), undefined, "no node");
});

it("nodeColor — a transparent hover target reads its visible sibling", () => {
  const line = {
    type: "path",
    key: "Alpha",
    shapeType: "Line",
    paint: {stroke: "green", fill: "none"},
  };
  const viz = {_chartScene: [{type: "group", key: "lines", children: [line]}]};
  const hit = {
    type: "path",
    key: "Alpha::hit",
    shapeType: "Line",
    paint: {stroke: "transparent", fill: "none"},
  };
  assert.strictEqual(nodeColor(viz, hit), "green");
  const orphan = {...hit, key: "Missing::hit"};
  assert.strictEqual(nodeColor(viz, orphan), undefined, "no sibling to read");
  assert.strictEqual(nodeColor({}, orphan), undefined, "no scene");
});

it("pickSwatch — the picked mark's own color and shape", () => {
  const node = {
    type: "circle",
    key: "Alpha",
    shapeType: "Circle",
    paint: {fill: "red"},
    datum: {id: "Alpha"},
  };
  const sw = parse(pickSwatch({}, {node, d: node.datum}));
  assert.strictEqual(sw.style.background, "red");
  assert.strictEqual(sw.style.borderRadius, "50%");
  assert.strictEqual(pickSwatch({}, null), "", "no pick");
});

it("pickSwatch — a label reads the mark it belongs to", () => {
  const row = {id: "Alpha"};
  const rect = {
    type: "rect",
    key: "Alpha",
    shapeType: "Rect",
    paint: {fill: "blue"},
    datum: {__d3plus__: true, data: row},
  };
  const text = {
    type: "text",
    key: "Alpha-label",
    datum: {__d3plus__: true, data: {__d3plus__: true, data: row}},
  };
  const viz = {_paintedScene: {root: {type: "group", children: [rect, text]}}};
  const sw = parse(pickSwatch(viz, {node: text, d: text.datum.data}));
  assert.strictEqual(sw.style.background, "blue");
  assert.strictEqual(
    pickSwatch(viz, {node: text, d: {id: "Other"}}),
    "",
    "no matching mark",
  );
  assert.strictEqual(
    pickSwatch({}, {node: text, d: row}),
    "",
    "no painted scene",
  );
});

it("pickSwatch — legend and chart marks stay apart", () => {
  const row = {id: "Alpha"};
  const chart = {
    type: "rect",
    key: "a",
    shapeType: "Rect",
    paint: {fill: "blue"},
    datum: row,
  };
  const legend = {
    type: "rect",
    key: "b",
    shapeType: "Rect",
    paint: {fill: "green"},
    datum: row,
    interactionGroup: "legend",
  };
  const text = {
    type: "text",
    key: "c",
    datum: {__d3plus__: true, data: row},
    interactionGroup: "legend",
  };
  const viz = {
    _paintedScene: {root: {type: "group", children: [chart, legend, text]}},
  };
  assert.strictEqual(
    parse(pickSwatch(viz, {node: text, d: row, isLegend: true})).style
      .background,
    "green",
  );
  assert.strictEqual(
    parse(pickSwatch(viz, {node: text, d: row})).style.background,
    "blue",
  );
});

it("pickSwatch — a legend entry reads as the shape it names", () => {
  const entry = {
    __d3plus__: true,
    id: "Alpha",
    shape: "Line",
    data: {id: "Alpha"},
  };
  const dot = {
    type: "circle",
    key: "d",
    shapeType: "Circle",
    paint: {fill: "red"},
    datum: entry,
    interactionGroup: "legend",
  };
  const hit = {
    type: "rect",
    key: "d::hit",
    shapeType: "Circle",
    paint: {fill: "transparent"},
    datum: entry,
    interactionGroup: "legend",
  };
  const label = {
    type: "text",
    key: "t",
    datum: {__d3plus__: true, data: entry},
    interactionGroup: "legend",
  };
  const viz = {
    _paintedScene: {root: {type: "group", children: [hit, dot, label]}},
  };
  for (const node of [dot, hit, label]) {
    const sw = parse(pickSwatch(viz, {node, d: entry.data, isLegend: true}));
    assert.ok(
      sw.classList.contains("d3plus-tooltip-swatch-line"),
      `from the ${node.type}`,
    );
    assert.strictEqual(sw.lastElementChild.style.background, "red");
  }
});

it("pickSwatch — a circle emitted without a shape type is a dot", () => {
  const node = {
    type: "circle",
    key: "Alpha",
    paint: {fill: "red"},
    datum: {id: "Alpha"},
  };
  assert.strictEqual(
    parse(pickSwatch({}, {node, d: node.datum})).style.borderRadius,
    "50%",
  );
});

it("withSwatch — no swatch on an empty title", () => {
  const sw = tooltipSwatch("red", "Rect");
  assert.strictEqual(withSwatch(sw, ""), "");
  assert.strictEqual(withSwatch(sw, undefined), "");
  assert.strictEqual(withSwatch(sw, false), "");
});

it("leadTitleWithSwatch — leads whichever title is set", () => {
  const tip = new Tooltip().title(d => `Custom ${d.id}`);
  leadTitleWithSwatch(tip, tooltipSwatch("red", "Rect"));
  const el = parse(tip.title()({id: "Alpha"}, 0));
  assert.ok(el.firstElementChild.classList.contains("d3plus-tooltip-swatch"));
  assert.strictEqual(el.textContent, "Custom Alpha");
  const plain = new Tooltip().title(() => "Plain");
  leadTitleWithSwatch(plain, "");
  assert.strictEqual(
    plain.title()({}, 0),
    "Plain",
    "untouched without a swatch",
  );
});

it("leadTitleWithSwatch — off when the tooltip's titleSwatch is false", () => {
  const tip = new Tooltip().title(() => "Plain");
  assert.strictEqual(tip.titleSwatch(), true, "on by default");
  leadTitleWithSwatch(tip.titleSwatch(false), tooltipSwatch("red", "Rect"));
  assert.strictEqual(tip.title()({}, 0), "Plain");
});

it("tooltipSwatch — outlined by its mark's stroke", () => {
  const sw = parse(
    tooltipSwatch({color: "blue", outline: {stroke: "red", strokeWidth: 1}}),
  );
  assert.strictEqual(sw.style.background, "blue");
  assert.strictEqual(sw.style.borderStyle, "solid");
  assert.strictEqual(sw.style.borderColor, "red");
  assert.strictEqual(sw.style.borderWidth, "1px");
  assert.strictEqual(sw.style.boxSizing, "border-box", "inside its 10px");
  assert.strictEqual(sw.style.width, "10px");
  const thick = parse(
    tooltipSwatch(
      {color: "blue", outline: {stroke: "red", strokeWidth: 6}},
      "Circle",
    ),
  );
  assert.strictEqual(thick.style.borderWidth, "2px", "a fifth of the swatch");
  assert.strictEqual(thick.style.borderRadius, "50%");
  assert.strictEqual(
    parse(tooltipSwatch({color: "blue"})).style.borderStyle,
    "",
    "no outline without a stroke",
  );
});

it("tooltipSwatch — a Line's swatch takes no outline", () => {
  const sw = parse(
    tooltipSwatch(
      {color: "red", outline: {stroke: "black", strokeWidth: 1}},
      "Line",
    ),
  );
  assert.ok(sw.classList.contains("d3plus-tooltip-swatch-line"));
  assert.strictEqual(sw.style.borderStyle, "");
  assert.strictEqual(tooltipSwatch({}, "Rect"), "", "nothing without a color");
});

it("nodeSwatch — a mark's fill outlined by its stroke", () => {
  const node = {
    type: "path",
    key: "geomap-path-a",
    shapeType: "Path",
    paint: {fill: "#eee", stroke: "#999", strokeWidth: 1},
  };
  assert.deepStrictEqual(nodeSwatch({_chartScene: [node]}, node), {
    color: "#eee",
    outline: {stroke: "#999", strokeWidth: 1},
  });
  assert.deepStrictEqual(nodeSwatch({}, undefined), {}, "no node");
});

it("nodeSwatch — a hovered mark reads its paint without the emphasis", () => {
  const drawn = {
    type: "rect",
    key: "Alpha",
    shapeType: "Rect",
    paint: {fill: "#4c6ef5", stroke: "#3b5bdb", strokeWidth: 0},
  };
  const viz = {
    _chartScene: [
      {type: "group", key: "Alpha", children: [drawn]},
      {type: "text", key: "Alpha", paint: {fill: "#000"}},
    ],
  };
  const painted = {
    ...drawn,
    paint: {...drawn.paint, stroke: "#1c3bb5", strokeWidth: 2},
  };
  assert.deepStrictEqual(
    nodeSwatch(viz, painted),
    {color: "#4c6ef5"},
    "the drawn rect, not a group or text sharing its key",
  );
  const lined = {...drawn, paint: {...drawn.paint, strokeWidth: 1}};
  assert.deepStrictEqual(
    nodeSwatch({_chartScene: [lined]}, painted).outline,
    {stroke: "#3b5bdb", strokeWidth: 1},
    "its own stroke, not the hover's",
  );
  assert.deepStrictEqual(
    nodeSwatch({_chartScene: []}, painted).outline,
    {stroke: "#1c3bb5", strokeWidth: 2},
    "the picked paint when the chart's scene lacks it",
  );
});

it("nodeSwatch — a legend swatch reads the legend's own scene", () => {
  const drawn = {
    type: "rect",
    key: "A_1_",
    shapeType: "Rect",
    paint: {fill: "blue", stroke: "red", strokeWidth: 1},
  };
  const painted = {
    ...drawn,
    interactionGroup: "legend",
    paint: {...drawn.paint, stroke: "black", strokeWidth: 2},
  };
  const chartMark = {...drawn, paint: {fill: "green"}};
  const viz = {
    _chartScene: [chartMark],
    _legendClass: {toScene: () => ({type: "group", children: [drawn]})},
  };
  assert.deepStrictEqual(nodeSwatch(viz, painted), {
    color: "blue",
    outline: {stroke: "red", strokeWidth: 1},
  });
  const hit = {
    type: "rect",
    key: "A_1_::hit",
    interactionGroup: "legend",
    paint: {fill: "transparent"},
  };
  assert.strictEqual(
    nodeSwatch(viz, hit).color,
    "blue",
    "a hover target reads its swatch",
  );
});

it("nodeSwatch — a stroke in the chart's background is no outline", () => {
  const wedge = {
    type: "path",
    key: "Alpha",
    shapeType: "Path",
    paint: {fill: "blue", stroke: "#000000", strokeWidth: 2},
  };
  const dark = {_chartScene: [wedge], _theme: {background: "#000"}};
  assert.deepStrictEqual(nodeSwatch(dark, wedge), {color: "blue"});
  const light = {_chartScene: [wedge], _theme: {background: "#fff"}};
  assert.deepStrictEqual(nodeSwatch(light, wedge).outline, {
    stroke: "#000000",
    strokeWidth: 2,
  });
});

it("pickSwatch — the picked mark's swatch carries its stroke", () => {
  const node = {
    type: "path",
    key: "geomap-path-a",
    shapeType: "Path",
    paint: {fill: "#eee", stroke: "rgb(1, 2, 3)", strokeWidth: 1},
    datum: {id: "a"},
  };
  const sw = parse(pickSwatch({_chartScene: [node]}, {node, d: node.datum}));
  assert.strictEqual(sw.style.borderColor, "rgb(1, 2, 3)");
  assert.strictEqual(sw.style.borderWidth, "1px");
});
