import {it} from "vitest";
import assert from "assert";
import {Legend} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A Legend measures its labels and its title at the line height their
    TextBoxes paint with: 1.2 times the font size (TextBox's default), or the
    label config's `lineHeight`. Labels were measured at 1.4 times, so each line
    claimed 2-3px more than it painted, and the title at its TextBox's
    default font size rather than the title's own.
*/

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Professional, Scientific, and Technical Services",
  "Health Care and Social Assistance",
];

function legend(config = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const group = svg.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "g"),
  );
  return new Legend()
    .renderMode("compute")
    .select(group)
    .duration(0)
    .data(names.map(id => ({id})))
    .direction("column")
    .width(400)
    .height(300)
    .config(config)
    .render();
}

/** Each label as measured, beside the label its TextBox paints. */
const labels = l => {
  const painted = new Map();
  for (const shape of l._shapes)
    for (const t of shape._labelClass._textData())
      painted.set(t.data.data.id, t);
  return l._lineData.map(d => ({d, t: painted.get(d.id)}));
};

// A `shapeConfig.lineHeight` beside the label config's doesn't reach the
// labels' TextBoxes, which paint at the label config's.
for (const [name, shapeConfig, lineHeight] of [
  ["10px labels", {}, 10 * 1.2],
  ["14px labels", {labelConfig: {fontSize: 14}}, 14 * 1.2],
  [
    "labels with a set lineHeight",
    {lineHeight: 30, labelConfig: {lineHeight: 20}},
    20,
  ],
  [
    "labels with a lineHeight function",
    {lineHeight: () => 30, labelConfig: {lineHeight: () => 18}},
    18,
  ],
]) {
  it(`Legend: ${name} are measured at the line height they paint with`, () => {
    const l = legend({shapeConfig});
    const items = labels(l);
    assert.strictEqual(items.length, names.length);
    for (const {d, t} of items) {
      assert.ok(t, `"${d.id}" paints a label`);
      assert.strictEqual(t.lH, lineHeight, `"${d.id}" paints at ${lineHeight}`);
      assert.strictEqual(d.lh, t.lH, `"${d.id}" measured at its painted lH`);
      assert.deepStrictEqual(d.lines, t.lines, `"${d.id}" lines`);
      assert.strictEqual(
        d.height,
        Math.ceil(t.lines.length * (t.lH + 1)),
        `"${d.id}" claims its painted lines and no more`,
      );
    }
  });
}

it("Legend: its title is measured at the line height it paints with", () => {
  for (const [titleConfig, lineHeight] of [
    [{}, 12 * 1.2],
    [{fontSize: 20}, 20 * 1.2],
    [{lineHeight: 30}, 30],
  ]) {
    const l = legend({title: "Industry", titleConfig});
    const [t] = l._titleClass._textData();
    const name = JSON.stringify(titleConfig);
    assert.strictEqual(t.lH, lineHeight, `${name}: paints at ${lineHeight}`);
    assert.deepStrictEqual(t.lines, ["Industry"], `${name}: one line`);
    // One line, the pixel above it, and the padding below.
    assert.strictEqual(
      l._titleHeight,
      t.lH + 1 + l.padding(),
      `${name}: claims its painted line`,
    );
  }
});
