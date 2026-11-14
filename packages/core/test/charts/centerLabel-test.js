import {describe, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {near} from "~test/helpers.js";
import {
  CENTER_LABEL_KEY,
  centerLabelBoxes,
  centerLabelDefaults,
  centerLabelLayout,
  centerLabelNodes,
  centerLabelStyle,
  centerLabelText,
  centerLabelTotal,
} from "../../src/charts/features/centerLabel.ts";
import {pieDef} from "../../src/charts/Pie/index.ts";
import {sunburstDef} from "../../src/charts/Sunburst/index.ts";
import {radialBarDef} from "../../src/charts/RadialBar/index.ts";

const rows = [
  {id: "a", value: 1200},
  {id: "b", value: 300},
  {id: "c", value: "not a number"},
];
const value = d => d.value;

describe("centerLabelTotal", () => {
  it("sums the values, leaving out values that aren't numbers", () => {
    assert.strictEqual(centerLabelTotal(rows, value), 1500);
  });
  it("is 0 for no rows", () => {
    assert.strictEqual(centerLabelTotal([], value), 0);
  });
  it("passes each row's index to the accessor", () => {
    const seen = [];
    centerLabelTotal(rows, (d, i) => seen.push(i));
    assert.deepStrictEqual(seen, [0, 1, 2]);
  });
});

describe("centerLabelText", () => {
  it("formats the total for true", () => {
    assert.strictEqual(centerLabelText(true, rows, 1500, "en-US"), "1.5k");
  });
  it("follows the locale", () => {
    assert.strictEqual(centerLabelText(true, rows, 1500, "es-ES"), "1,5k");
  });
  it("draws a string as given", () => {
    assert.strictEqual(centerLabelText("Total", rows, 1500), "Total");
  });
  it("passes the rows and total to a function", () => {
    let args;
    const text = centerLabelText(
      (data, total) => {
        args = [data, total];
        return `${data.length} rows, ${total}`;
      },
      rows,
      1500,
    );
    assert.strictEqual(text, "3 rows, 1500");
    assert.strictEqual(args[0], rows);
    assert.strictEqual(args[1], 1500);
  });
  it("draws a function's number, including 0", () => {
    assert.strictEqual(
      centerLabelText(() => 0, rows, 1500),
      "0",
    );
  });
  it("is empty for a falsy setting or return value", () => {
    for (const setting of [false, undefined, null, ""])
      assert.strictEqual(centerLabelText(setting, rows, 1500), "");
    for (const out of [false, null, undefined, ""])
      assert.strictEqual(
        centerLabelText(() => out, rows, 1500),
        "",
      );
  });
});

describe("centerLabelBoxes", () => {
  it("is the whole circle, wrapped to it, for a full hole", () => {
    assert.deepStrictEqual(centerLabelBoxes({radius: 50}), [
      {x: -50, y: -50, width: 100, height: 100, shape: "circle"},
    ]);
    assert.strictEqual(
      centerLabelBoxes({
        radius: 50,
        startAngle: 1,
        endAngle: 1 + Math.PI * 2,
      })[0].shape,
      "circle",
    );
  });
  it("is empty without a hole", () => {
    assert.deepStrictEqual(centerLabelBoxes({radius: 0}), []);
    assert.deepStrictEqual(centerLabelBoxes({radius: NaN}), []);
    assert.deepStrictEqual(
      centerLabelBoxes({radius: 50, startAngle: 0, endAngle: 0}),
      [],
    );
  });
  it("fits boxes inside a half circle's slice", () => {
    const r = 100;
    const boxes = centerLabelBoxes({
      radius: r,
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    });
    assert.strictEqual(boxes.length, 3);
    for (const b of boxes) {
      assert.strictEqual(b.shape, "square");
      // Above the center line, centered on the bisector, inside the circle.
      assert.ok(b.y + b.height <= 1e-6, "above the center");
      near(b.x + b.width / 2, 0, 1e-6, "centered");
      assert.ok(Math.hypot(b.width / 2, b.y) <= r + 1e-6, "inside the arc");
    }
    // The 2:1 box is the largest rectangle a half circle holds: r√2 × r/√2.
    const wide = boxes[1];
    near(wide.width, r * Math.SQRT2, 0.01, "width");
    near(wide.height, r / Math.SQRT2, 0.01, "height");
  });
});

describe("centerLabelStyle", () => {
  it("centers the text, resizes it, and lets the pointer through", () => {
    const style = centerLabelStyle({fontMax: 40});
    assert.strictEqual(style.textAnchor, "middle");
    assert.strictEqual(style.verticalAlign, "middle");
    assert.strictEqual(style.fontResize, true);
    assert.strictEqual(style.pointerEvents, "none");
    assert.strictEqual(style.fontMax, 40);
  });
  it("fixes a set fontSize unless fontResize says otherwise", () => {
    assert.strictEqual(centerLabelStyle({fontSize: 20}).fontResize, false);
    assert.strictEqual(
      centerLabelStyle({fontSize: 20, fontResize: true}).fontResize,
      true,
    );
  });
  it("keeps the user's alignment", () => {
    assert.strictEqual(
      centerLabelStyle({verticalAlign: "top"}).verticalAlign,
      "top",
    );
  });
});

describe("centerLabelDefaults", () => {
  it("sizes from 10 to 40 pixels in the chart's text color", () => {
    const defaults = centerLabelDefaults({schema: {}});
    assert.strictEqual(defaults.fontMin, 10);
    assert.strictEqual(defaults.fontMax, 40);
    assert.strictEqual(defaults.padding, 5);
    assert.strictEqual(typeof defaults.fontColor, "function");
  });
});

describe("chart fields", () => {
  for (const def of [pieDef, sunburstDef, radialBarDef])
    it(`${def.name} declares centerLabel (off) and a merged centerLabelConfig`, () => {
      const label = def.fields.find(f => f.key === "centerLabel");
      const config = def.fields.find(f => f.key === "centerLabelConfig");
      assert.strictEqual(label.default, false);
      assert.strictEqual(config.merge, true);
      assert.strictEqual(config.factory, centerLabelDefaults);
    });
});

describe("centerLabelNodes", () => {
  useJsdom();
  const mockViz = (centerLabel, config = {}) => ({
    _filteredData: rows,
    schema: {
      centerLabel,
      centerLabelConfig: {fontMin: 10, fontMax: 40, padding: 5, ...config},
      locale: "en-US",
    },
  });
  const texts = nodes =>
    nodes.flatMap(g => g.children.flatMap(n => n.lines.map(l => l.text)));

  it("draws nothing when centerLabel is off", () => {
    assert.deepStrictEqual(
      centerLabelNodes(mockViz(false), {radius: 80}, value),
      [],
    );
  });
  it("draws nothing without a hole", () => {
    assert.deepStrictEqual(
      centerLabelNodes(mockViz(true), {radius: 0}, value),
      [],
    );
  });
  it("draws the total in one inert group, with no datum", () => {
    const nodes = centerLabelNodes(mockViz(true), {radius: 80}, value);
    assert.strictEqual(nodes.length, 1);
    const [group] = nodes;
    assert.strictEqual(group.type, "group");
    assert.strictEqual(group.key, CENTER_LABEL_KEY);
    assert.strictEqual(group.interactive, false);
    assert.deepStrictEqual(texts(nodes), ["1.5k"]);
    for (const n of group.children) {
      assert.strictEqual(n.type, "text");
      assert.strictEqual(n.datum, undefined);
      assert.strictEqual(n.interactive, false);
    }
  });
  it("grows the text to the hole, up to fontMax", () => {
    const size = r =>
      centerLabelNodes(mockViz(true), {radius: r}, value)[0].children[0].font
        .size;
    assert.ok(size(30) < size(60), "a larger hole draws larger text");
    assert.ok(size(400) <= 40, "never past fontMax");
  });
  it("wraps a long string onto several lines", () => {
    const nodes = centerLabelNodes(
      mockViz("Total population of every region"),
      {radius: 90},
      value,
    );
    assert.ok(texts(nodes).length > 1, JSON.stringify(texts(nodes)));
  });
  it("draws nothing when the text can't fit whole", () => {
    assert.deepStrictEqual(
      centerLabelNodes(
        mockViz("A label far too long to fit in so small a hole"),
        {radius: 14},
        value,
      ),
      [],
    );
  });
  it("draws a fixed fontSize as given", () => {
    const nodes = centerLabelNodes(
      mockViz(true, {fontSize: 13}),
      {radius: 80},
      value,
    );
    assert.strictEqual(nodes[0].children[0].font.size, 13);
  });
  it("styles the text from centerLabelConfig", () => {
    const nodes = centerLabelNodes(
      mockViz("Total", {fontColor: "rgb(255, 0, 0)", fontWeight: 700}),
      {radius: 80},
      value,
    );
    const [text] = nodes[0].children;
    assert.strictEqual(text.paint.fill, "rgb(255, 0, 0)");
    assert.strictEqual(text.font.weight, 700);
  });
  it("centers the text on the hole", () => {
    const [text] = centerLabelNodes(mockViz(true), {radius: 80}, value)[0]
      .children;
    const size = text.font.size;
    const line = text.lines[0];
    // The glyphs run from 0.8em above the baseline to 0.2em below it.
    const mid = text.transform.y + line.y - 0.3 * size;
    near(mid, 0, 1, "vertical middle");
    assert.strictEqual(text.font.anchor, "middle");
  });
  it("fits a partial sweep's hole above its center", () => {
    const nodes = centerLabelNodes(
      mockViz(true),
      {radius: 80, startAngle: -Math.PI / 2, endAngle: Math.PI / 2},
      value,
    );
    const [text] = nodes[0].children;
    assert.ok(text.transform.y + text.lines[0].y <= 0, "baseline above 0");
  });
});

describe("centerLabelLayout", () => {
  useJsdom();
  const mockViz = centerLabel => ({
    _filteredData: rows,
    schema: {
      centerLabel,
      centerLabelConfig: {fontMin: 10, fontMax: 40, padding: 5},
      locale: "en-US",
    },
  });
  const half = {radius: 80, startAngle: -Math.PI / 2, endAngle: Math.PI / 2};

  it("returns the nodes and the box the text fits", () => {
    const out = centerLabelLayout(mockViz(true), half, value);
    assert.strictEqual(out.nodes[0].key, CENTER_LABEL_KEY);
    assert.ok(out.box.y + out.box.height <= 1e-6, "above the baseline");
  });
  it("keeps the reserved height free at each box's bottom", () => {
    const plain = centerLabelLayout(mockViz(true), half, value);
    const kept = centerLabelLayout(mockViz(true), half, value, 16);
    assert.ok(kept.box.height < plain.box.height);
    assert.strictEqual(kept.box.shape, "square");
    const boxes = centerLabelBoxes(half);
    assert.ok(
      boxes.some(
        b =>
          Math.abs(b.y + b.height - 16 - (kept.box.y + kept.box.height)) < 1e-6,
      ),
      "a hole box less its bottom strip",
    );
  });
  it("is null when off, or with no room", () => {
    assert.strictEqual(centerLabelLayout(mockViz(false), half, value), null);
    assert.strictEqual(
      centerLabelLayout(mockViz(true), {radius: 10}, value, 40),
      null,
    );
  });
});
