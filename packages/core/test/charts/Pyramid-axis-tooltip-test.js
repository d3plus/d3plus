import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {TextBox} from "../../index.ts";
import {axisTooltipTarget} from "../../src/components/Axis/axisTooltipTargets.ts";
import {
  gutterLabelNodes,
  gutterLabels,
} from "../../src/charts/Pyramid/gutter.ts";

useJsdom();

/**
    Pyramid's gutter labels as the category axis's tick labels: each is
    stamped with the axis tooltip target its `tickTooltip` shows for, and
    only a stamped label takes the pointer.
*/

const font = {family: "sans-serif", size: 12, weight: 400, padding: 5};
const LONG = "A category name far too long for the box it is given";

/** A gutter label for `category`, in a box `width` wide. */
const gutterLabel = (category, i, width = 200, text = `${category}`) => ({
  id: `pyramid-category-${i}`,
  text,
  x: 100,
  y: i * 20,
  width,
  height: 18,
  font,
  data: {id: category, text, tick: true},
});

/** Every node of a scene subtree, the subtree's root first. */
const flat = node => [node, ...(node.children ?? []).flatMap(flat)];

/** The text nodes of the gutter's scene, as `[node, target]` pairs in drawing order. */
const labelsOf = nodes =>
  nodes
    .flatMap(flat)
    .filter(n => n.type === "text")
    .map(n => [n, axisTooltipTarget(n)]);

/** Each stamped label's `[value, index]`. */
const places = nodes =>
  labelsOf(nodes)
    .filter(([, target]) => target)
    .map(([, target]) => [target.value, target.index]);

it("Pyramid gutterLabelNodes draws plain labels as inert chrome", () => {
  const nodes = gutterLabelNodes(
    new TextBox(),
    [gutterLabel("0-9", 0), gutterLabel("10-19", 1)],
    "#444",
  );
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].key, "pyramid-categories");
  const all = nodes.flatMap(flat);
  assert.ok(
    all.every(n => n.interactionGroup === "axis"),
    "every node is axis chrome",
  );
  const labels = labelsOf(nodes);
  assert.deepStrictEqual(
    labels.map(([n]) => n.lines.map(l => l.text).join("")),
    ["0-9", "10-19"],
  );
  assert.ok(
    labels.every(([n, target]) => !target && n.interactive === false),
    "a whole label with no tooltip option is inert",
  );
});

it("Pyramid gutterLabelNodes stamps every label with the axis's tickTooltip", () => {
  const note = (value, index) => `${value} ${index}`;
  const labels = [
    gutterLabel("20-29", 0),
    gutterLabel("10-19", 1, 200, "Ages 10-19"),
    gutterLabel("0-9", 2),
  ];
  const order = ["0-9", "10-19", "20-29"];
  const nodes = gutterLabelNodes(new TextBox(), labels, "#444", note, value =>
    order.indexOf(value),
  );
  const stamped = labelsOf(nodes);
  assert.deepStrictEqual(
    stamped.map(([, t]) => [t.part, t.value, t.index, t.text, t.truncated]),
    [
      ["tick", "20-29", 2, "20-29", false],
      ["tick", "10-19", 1, "Ages 10-19", false],
      ["tick", "0-9", 0, "0-9", false],
    ],
    "the category is the value, the label's text the text, the rank the index",
  );
  assert.ok(
    stamped.every(
      ([n, t]) =>
        t.option === note &&
        n.interactive !== false &&
        n.interactionGroup === "axis",
    ),
    "a stamped label takes the pointer, as axis chrome",
  );
  assert.deepStrictEqual(
    places(gutterLabelNodes(new TextBox(), labels, "#444", "note")),
    [
      ["20-29", 0],
      ["10-19", 1],
      ["0-9", 2],
    ],
    "without a rank, labels are indexed in drawing order",
  );
});

it("Pyramid gutterLabelNodes stamps a label drawn cut short, unless tickTooltip is false", () => {
  const labels = [gutterLabel(LONG, 0, 90), gutterLabel("0-9", 1, 90)];
  const nodes = gutterLabelNodes(new TextBox(), labels, "#444");
  const [[cut, target], [whole, none]] = labelsOf(nodes);
  const drawn = cut.lines.map(l => l.text).join("");
  assert.ok(
    drawn.length && drawn.length < LONG.length,
    `the long label is drawn cut short ("${drawn}")`,
  );
  assert.deepStrictEqual(
    target && [target.part, target.value, target.text, target.truncated],
    ["tick", LONG, LONG, true],
    "and carries its whole text",
  );
  assert.strictEqual(target.option, undefined);
  assert.notStrictEqual(cut.interactive, false, "it takes the pointer");
  assert.ok(!none && whole.interactive === false, "a whole label stays inert");

  const off = labelsOf(gutterLabelNodes(new TextBox(), labels, "#444", false));
  assert.ok(
    off.every(([n, t]) => !t && n.interactive === false),
    "`false` keeps every label inert, cut or whole",
  );
});

/**
    A drawn chart's state, as `gutterLabels` reads it: categories "a" to "e"
    handed top first on a Plot's y axis, `step` pixels apart.
*/
const drawn = ({
  tickTooltip,
  step = 40,
  endFirst = true,
  yConfig = {},
} = {}) => {
  const domain = ["e", "d", "c", "b", "a"];
  return {
    _yFunc: c => 20 + domain.indexOf(c) * step,
    _plotArea: {x: 0, y: 0, width: 400, height: step * domain.length},
    _yConfig: yConfig,
    _yAxis: {
      domain: () => domain,
      _givenDomain: () => domain,
      _domainEndFirst: endFirst,
      schema: {scale: "point", tickTooltip},
      shapeConfig: () => ({
        labelConfig: {fontColor: "#444", fontSize: 12, padding: 5},
      }),
    },
  };
};

it("Pyramid gutterLabels takes the category axis's tickTooltip, indexed from the bottom row", () => {
  const note = value => `${value}`;
  const nodes = gutterLabels(
    drawn({tickTooltip: note, yConfig: {tickFormat: d => `Row ${d}`}}),
    new TextBox(),
    [150, 250],
  );
  const stamped = labelsOf(nodes);
  assert.deepStrictEqual(
    stamped.map(([n, t]) => [
      n.lines.map(l => l.text).join(""),
      t.value,
      t.index,
      t.text,
    ]),
    [
      ["Row e", "e", 4, "Row e"],
      ["Row d", "d", 3, "Row d"],
      ["Row c", "c", 2, "Row c"],
      ["Row b", "b", 1, "Row b"],
      ["Row a", "a", 0, "Row a"],
    ],
    "the value is the category, the text what `tickFormat` gives, index 0 the bottom row",
  );
  assert.ok(stamped.every(([, t]) => t.option === note));
});

it("Pyramid gutterLabels indexes as the category axis ranks its domain", () => {
  assert.deepStrictEqual(
    places(
      gutterLabels(
        drawn({tickTooltip: "t", endFirst: false}),
        new TextBox(),
        [150, 250],
      ),
    ),
    [
      ["e", 0],
      ["d", 1],
      ["c", 2],
      ["b", 3],
      ["a", 4],
    ],
    "an axis handed its domain start first counts from the top",
  );
  assert.deepStrictEqual(
    places(
      gutterLabels(
        drawn({tickTooltip: "t", step: 13}),
        new TextBox(),
        [150, 250],
      ),
    ),
    [
      ["e", 2],
      ["c", 1],
      ["a", 0],
    ],
    "thinned labels are indexed among the ones drawn",
  );
});

it("Pyramid gutterLabels leaves labels inert without a tickTooltip, and for `false`", () => {
  for (const tickTooltip of [undefined, false]) {
    const labels = labelsOf(
      gutterLabels(drawn({tickTooltip}), new TextBox(), [150, 250]),
    );
    assert.strictEqual(labels.length, 5);
    assert.ok(
      labels.every(([n, t]) => !t && n.interactive === false),
      `tickTooltip: ${tickTooltip}`,
    );
  }
  assert.deepStrictEqual(
    gutterLabels(drawn({tickTooltip: "t"}), new TextBox(), [200, 200]),
    [],
    "no gutter, no labels",
  );
});
