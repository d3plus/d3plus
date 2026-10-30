import {describe, it} from "vitest";
import assert from "assert";

import {constant} from "../../index.ts";
import {
  emitOutsideLabels,
  insideFontMin,
  labelFitsInside,
  labelPositionOf,
  labelsOverCircles,
  layoutCircleLabels,
  measureLabel,
  outsideLabels,
  pointLabelSettings,
  sideAnchor,
} from "../../internal.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    The chart side of circle labels: reading `labelPosition` and
    `pointLabelConfig`, measuring and fitting text, laying a chart's circles
    out, and emitting the labels placed beside their circles.
*/

/** A stand-in chart: its schema, theme, and colors. */
const chart = (schema = {}, theme) => ({
  schema: {
    labelPosition: constant("auto"),
    pointLabelConfig: {fontMin: 10, fontSize: 11, padding: 3},
    colorDefaults: {dark: "#444444", light: "#f7f7f7"},
    ...schema,
  },
  _theme: theme,
});

const font = {family: "Arial", size: 10};

describe("charts/circleLabels labelFitsInside", () => {
  it("fits a short word in a big circle, not in a small one", () => {
    const big = {width: 120, height: 120, shape: "circle", padding: 5};
    const small = {width: 14, height: 14, shape: "circle", padding: 5};
    assert.strictEqual(labelFitsInside("Alpha", big, font), true);
    assert.strictEqual(labelFitsInside("Alpha", small, font), false);
  });
  it("judges at the given size: a box that holds 10px text may not hold 30px", () => {
    const box = {width: 60, height: 30};
    assert.strictEqual(labelFitsInside("Alpha", box, font), true);
    assert.strictEqual(
      labelFitsInside("Alpha", box, {...font, size: 30}),
      false,
    );
  });
  it("counts padding against the box", () => {
    const box = {width: 50, height: 20};
    assert.strictEqual(labelFitsInside("Alpha", box, font), true);
    assert.strictEqual(
      labelFitsInside("Alpha", {...box, padding: 10}, font),
      false,
    );
  });
  it("never fits empty text", () => {
    assert.strictEqual(
      labelFitsInside("", {width: 100, height: 100}, font),
      false,
    );
  });
});

describe("charts/circleLabels measureLabel", () => {
  it("measures one line with a pixel of slack each side", () => {
    const short = measureLabel("Hi", {size: 11});
    const long = measureLabel("Hello there, world", {size: 11});
    assert.ok(long.width > short.width + 30);
    assert.strictEqual(short.height, Math.ceil(11 * 1.2) + 1);
    assert.strictEqual(
      measureLabel("Hi", {size: 11, lineHeight: 20}).height,
      21,
    );
  });
  it("grows with the font size", () => {
    assert.ok(
      measureLabel("Alpha", {size: 20}).width >
        measureLabel("Alpha", {size: 10}).width,
    );
  });
});

describe("charts/circleLabels pointLabelSettings", () => {
  it("splits fontMin, fontSize and padding from the TextBox config", () => {
    const viz = chart({
      pointLabelConfig: {fontMin: 9, fontSize: 13, padding: 2, fontWeight: 600},
    });
    assert.deepStrictEqual(pointLabelSettings(viz), {
      fontMin: 9,
      fontSize: 13,
      padding: 2,
      text: {fontWeight: 600},
    });
  });
  it("falls back to 10 / 11 / 3", () => {
    const settings = pointLabelSettings(chart({pointLabelConfig: undefined}));
    assert.deepStrictEqual(
      [settings.fontMin, settings.fontSize, settings.padding],
      [10, 11, 3],
    );
  });
});

describe("charts/circleLabels labelPositionOf", () => {
  it("reads a constant or a per-row accessor", () => {
    assert.strictEqual(labelPositionOf(chart(), {}, 0), "auto");
    const viz = chart({labelPosition: d => (d.big ? "inside" : "outside")});
    assert.strictEqual(labelPositionOf(viz, {big: true}, 0), "inside");
    assert.strictEqual(labelPositionOf(viz, {}, 1), "outside");
  });
  it("reads anything unrecognized as auto", () => {
    assert.strictEqual(
      labelPositionOf(chart({labelPosition: constant("sideways")}), {}, 0),
      "auto",
    );
    assert.strictEqual(
      labelPositionOf(chart({labelPosition: undefined}), {}, 0),
      "auto",
    );
  });
});

describe("charts/circleLabels layoutCircleLabels", () => {
  const bounds = {x: 0, y: 0, width: 400, height: 300};
  const item = (key, x, y, r, text, extra = {}) => ({
    key,
    datum: {id: key},
    index: 0,
    x,
    y,
    r,
    text,
    ...extra,
  });

  it("keeps a fitting label inside, moves a small circle's beside it", () => {
    const layout = layoutCircleLabels(
      chart(),
      [item("big", 100, 150, 60, "Alpha"), item("small", 300, 150, 4, "Beta")],
      bounds,
    );
    assert.strictEqual(layout.get("big").position, "inside");
    assert.strictEqual(layout.get("big").mode, "auto");
    const small = layout.get("small");
    assert.strictEqual(small.position, "outside");
    assert.strictEqual(small.side, "right");
    assert.strictEqual(small.text, "Beta");
    // The gap is pointLabelConfig.padding.
    assert.strictEqual(small.box.x, 300 + 4 + 3);
  });

  it("follows labelPosition per row", () => {
    const viz = chart({
      labelPosition: d => (d.id === "big" ? "outside" : "inside"),
    });
    const layout = layoutCircleLabels(
      viz,
      [item("big", 100, 150, 60, "Alpha"), item("small", 300, 150, 4, "Beta")],
      bounds,
    );
    assert.strictEqual(layout.get("big").position, "outside");
    assert.strictEqual(layout.get("small").position, "inside");
    assert.strictEqual(layout.get("small").mode, "inside");
  });

  it("leaves unlabeled circles out of the result, but in the way", () => {
    // An unlabeled circle sits right of the labeled one, so its label goes left.
    const layout = layoutCircleLabels(
      chart(),
      [item("a", 200, 150, 4, "Gamma"), item("b", 222, 150, 15, undefined)],
      bounds,
    );
    assert.deepStrictEqual([...layout.keys()], ["a"]);
    assert.strictEqual(layout.get("a").side, "left");
  });

  it("labels numbers, and skips empty and non-text labels", () => {
    const layout = layoutCircleLabels(
      chart(),
      [
        item("n", 100, 100, 4, 42),
        item("e", 200, 100, 4, "  "),
        item("f", 300, 100, 4, false),
      ],
      bounds,
    );
    assert.deepStrictEqual([...layout.keys()], ["n"]);
    assert.strictEqual(layout.get("n").text, "42");
  });

  it("judges inside fit at pointLabelConfig.fontMin", () => {
    // A 40px circle holds "Delta" at 10px, but not at 30px.
    const items = [item("c", 200, 150, 20, "Delta")];
    assert.strictEqual(
      layoutCircleLabels(chart(), items, bounds).get("c").position,
      "inside",
    );
    const strict = chart({
      pointLabelConfig: {fontMin: 30, fontSize: 11, padding: 3},
    });
    assert.strictEqual(
      layoutCircleLabels(strict, items, bounds).get("c").position,
      "outside",
    );
  });
});

describe("charts/circleLabels sideAnchor", () => {
  it("anchors toward the circle", () => {
    assert.strictEqual(sideAnchor("right"), "start");
    assert.strictEqual(sideAnchor("top-right"), "start");
    assert.strictEqual(sideAnchor("left"), "end");
    assert.strictEqual(sideAnchor("bottom-left"), "end");
    assert.strictEqual(sideAnchor("top"), "middle");
    assert.strictEqual(sideAnchor("bottom"), "middle");
  });
});

describe("charts/circleLabels outsideLabels", () => {
  it("keeps only the labels placed beside their circles", () => {
    const box = {x: 1, y: 2, width: 3, height: 4};
    const layout = new Map([
      ["a", {position: "inside", mode: "auto", text: "A"}],
      ["b", {position: "outside", side: "left", box, mode: "auto", text: "B"}],
      ["c", {position: "hidden", mode: "outside", text: "C"}],
    ]);
    assert.deepStrictEqual(
      outsideLabels(layout, k => ({id: `id-${k}`, datum: {k}})),
      [{id: "id-b", datum: {k: "b"}, text: "B", side: "left", box}],
    );
  });
});

describe("charts/circleLabels insideFontMin", () => {
  const viz = chart();
  it("raises an auto inside label's floor to pointLabelConfig.fontMin", () => {
    const placed = {position: "inside", mode: "auto", text: "A"};
    assert.strictEqual(insideFontMin(viz, placed, 1), 10);
    assert.strictEqual(insideFontMin(viz, placed, 14), 14);
  });
  it("leaves inside-mode and unplaced labels alone", () => {
    assert.strictEqual(
      insideFontMin(viz, {position: "inside", mode: "inside", text: "A"}, 1),
      1,
    );
    assert.strictEqual(insideFontMin(viz, undefined, 8), 8);
  });
});

describe("charts/circleLabels emitOutsideLabels", () => {
  const label = {
    id: "lbl",
    datum: {id: "alpha"},
    text: "Alpha",
    side: "left",
    box: {x: 10, y: 20, width: 40, height: 15},
  };

  it("draws one inert line per label, in the chart's ink, at fontSize", () => {
    const [node] = emitOutsideLabels(chart({}, {text: "#123456"}), [label]);
    assert.strictEqual(node.type, "text");
    assert.strictEqual(node.key, "lbl_0");
    // Like a shape label, the node carries its label record, wrapping the row.
    assert.deepStrictEqual(node.datum.data, {id: "alpha"});
    assert.strictEqual(node.interactive, false);
    assert.strictEqual(node.paint.fill, "#123456");
    assert.strictEqual(node.font.size, 11);
    assert.strictEqual(node.font.anchor, "end");
    assert.deepStrictEqual(
      node.lines.map(l => l.text),
      ["Alpha"],
    );
    assert.strictEqual(node.transform.x, 10);
    // Centered on its line, within the box.
    assert.ok(Math.abs(node.transform.y - 20) < 2);
  });

  it("lets pointLabelConfig style the text", () => {
    const viz = chart({
      pointLabelConfig: {fontSize: 11, fontColor: "red", fontWeight: 700},
    });
    const [node] = emitOutsideLabels(viz, [label]);
    assert.strictEqual(node.paint.fill, "red");
    assert.strictEqual(node.font.weight, 700);
  });

  it("emits nothing for no labels", () => {
    assert.deepStrictEqual(emitOutsideLabels(chart(), []), []);
  });
});

describe("charts/circleLabels labelsOverCircles", () => {
  it("lifts text above the highest-ranked circle", () => {
    const nodes = [
      {type: "circle", key: "a", z: 0},
      {type: "circle", key: "b", z: 4},
      {type: "text", key: "t"},
    ];
    const out = labelsOverCircles(nodes);
    assert.strictEqual(out[2].z, 5);
    assert.strictEqual(out[0], nodes[0]);
  });
  it("leaves an unranked group as it is", () => {
    const nodes = [
      {type: "circle", key: "a"},
      {type: "text", key: "t"},
    ];
    assert.strictEqual(labelsOverCircles(nodes), nodes);
  });
});
