import assert from "assert";
import {AxisBottom} from "../../es/index.js";
import {labelSets} from "../../es/src/components/Axis/axisLayoutScale.js";
import it from "../jsdom.js";

/**
    An axis given a list of label lists (from the most labels to the fewest)
    labels the first list whose labels all fit whole without crowding, else
    the last one, thinned; its ticks follow the chosen list unless `ticks` is
    set. A `tickFormat` reads the axis it labels as `this`.
*/

const values = Array.from({length: 40}, (_, i) => i);
const every = n => values.filter(v => v % n === 0);

/** Renders a standalone point axis over `values` with `config`. */
function draw(width, config = {}) {
  document.body.innerHTML = "";
  const axis = new AxisBottom().scale("point").domain(values).width(width).height(100).duration(0).config(config);
  axis.render();
  return axis;
}

it("labelSets reads a list of label lists, and nothing else", () => {
  const sets = [[1, 2], [1]];
  assert.strictEqual(labelSets({schema: {labels: sets}}), sets);
  assert.strictEqual(labelSets({schema: {labels: [1, 2]}}), undefined);
  assert.strictEqual(labelSets({schema: {labels: []}}), undefined);
  assert.strictEqual(labelSets({schema: {labels: [[1], 2]}}), undefined);
  assert.strictEqual(labelSets({schema: {}}), undefined);
});

it("Axis labels the first label list that fits, with its ticks", () => {
  const sets = [values, every(5), every(10)];
  const wide = draw(1200, {labels: sets});
  assert.strictEqual(wide._labelSet, 0, "every value fits at 1200px");
  assert.deepStrictEqual(wide._shownLabels, values);

  const narrow = draw(220, {labels: sets});
  assert.strictEqual(narrow._labelSet, 1, "every 5th fits at 220px");
  assert.deepStrictEqual(narrow._shownLabels, every(5));
  assert.deepStrictEqual(narrow._availableTicks, every(5), "the ticks follow the chosen list");
  assert.deepStrictEqual(narrow._visibleTicks, every(5));

  const ticked = draw(220, {labels: sets, ticks: every(2)});
  assert.strictEqual(ticked._labelSet, 1);
  assert.deepStrictEqual(ticked._availableTicks, every(2), "a set `ticks` stays");
});

it("Axis thins the last label list when none fits", () => {
  const axis = draw(40, {labels: [every(5), every(10)]});
  assert.strictEqual(axis._labelSet, 1);
  assert.strictEqual(axis._shownLabels[0], 0, "the first label stays");
  assert.ok(axis._shownLabels.length < every(10).length, `thinned (got ${axis._shownLabels})`);
  assert.ok(axis._shownLabels.every(v => v % 10 === 0), "from the last list");
});

it("Axis keeps a flat labels list as given", () => {
  const axis = draw(220, {labels: every(10)});
  assert.strictEqual(axis._labelSet, 0);
  assert.deepStrictEqual(axis._shownLabels, every(10));
});

it("Axis calls tickFormat with the axis as this", () => {
  const seen = new Set();
  const axis = draw(600, {
    labels: every(10),
    tickFormat(d) {
      seen.add(this);
      return `${d}`;
    },
  });
  assert.deepStrictEqual([...seen], [axis]);
  assert.strictEqual(axis._labelFormat(20), "20");
});
