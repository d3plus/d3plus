import {it} from "vitest";
import assert from "assert";
import {
  stampSwatchLabels,
  swatchTooltips,
} from "../../src/components/ColorScale/colorScaleSwatchTooltips.ts";

/** Two swatch rows and their buckets. */
const low = {id: "0 - 19", _isColorScaleBucket: true};
const high = {id: "20 - 49", _isColorScaleBucket: true};
const buckets = () =>
  new Map([
    [low, {value: 0, index: 0}],
    [high, {value: 20, index: 1}],
  ]);

/** A swatch label's text node drawing `drawn` for `row`. */
const label = (row, drawn = row.id, truncated = false) => ({
  type: "text",
  key: `${row.id}_0`,
  lines: drawn.split("|").map(t => ({text: t, x: 0, y: 0, width: 10})),
  truncated,
  interactive: false,
  datum: {data: {data: row, id: row.id, label: row.id}},
});

/** A swatch's rect for `row`. */
const swatch = row => ({
  type: "rect",
  key: row.id,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  datum: {data: row, id: row.id},
});

const titleDatum = {text: "Score"};

/** A legend scene: a title, two swatches, and their labels. */
const legend = (titleTruncated = false, lows = label(low)) => ({
  type: "group",
  key: "Legend",
  children: [
    {
      type: "group",
      key: "textBox-group",
      children: [
        {
          type: "text",
          key: "0",
          lines: [{text: titleTruncated ? "Sc..." : "Score", x: 0, y: 0}],
          truncated: titleTruncated,
          interactive: true,
          datum: titleDatum,
        },
      ],
    },
    {type: "group", key: "Rect-group", children: [swatch(low), swatch(high)]},
    lows,
    label(high),
  ],
});

/** Every leaf of `scene`, by key. */
const leaves = scene => {
  const out = {};
  const walk = node =>
    node.type === "group"
      ? node.children.forEach(walk)
      : (out[node.key] = node);
  walk(scene);
  return out;
};

const options = (extra = {}) => ({
  title: "Score",
  titleDatum,
  titleTooltip: undefined,
  tickTooltip: undefined,
  buckets: buckets(),
  ...extra,
});

it("stampSwatchLabels — the bucket's tick, its place from the lowest, and the whole label", () => {
  const nodes = [label(high), label(low)];
  stampSwatchLabels(nodes, "Note", buckets());
  assert.deepStrictEqual(
    nodes.map(node => node.axisTooltip),
    [
      {
        part: "tick",
        value: 20,
        index: 1,
        text: "20 - 49",
        truncated: false,
        option: "Note",
      },
      {
        part: "tick",
        value: 0,
        index: 0,
        text: "0 - 19",
        truncated: false,
        option: "Note",
      },
    ],
  );
});

it("stampSwatchLabels — unset, only a cut label is stamped", () => {
  const nodes = [label(low, "0 -...", true), label(high)];
  stampSwatchLabels(nodes, undefined, buckets());
  assert.strictEqual(nodes[0].axisTooltip.truncated, true);
  assert.strictEqual(nodes[0].axisTooltip.text, "0 - 19");
  assert.strictEqual(nodes[1].axisTooltip, undefined);
});

it("stampSwatchLabels — false stamps nothing, cut labels included", () => {
  const nodes = [label(low, "0 -...", true)];
  stampSwatchLabels(nodes, false, buckets());
  assert.strictEqual(nodes[0].axisTooltip, undefined);
});

it("stampSwatchLabels — skips nodes that draw no swatch's bucket", () => {
  const nodes = [label({id: "other"}), swatch(low)];
  stampSwatchLabels(nodes, "Note", buckets());
  assert.ok(nodes.every(node => node.axisTooltip === undefined));
});

it("swatchTooltips — a stamped label and title take the pointer as axis chrome", () => {
  const out = leaves(
    swatchTooltips(
      legend(),
      options({titleTooltip: "About", tickTooltip: "Note"}),
    ),
  );
  for (const key of ["0", "0 - 19_0", "20 - 49_0"]) {
    assert.strictEqual(out[key].interactive, true, key);
    assert.strictEqual(out[key].interactionGroup, "axis", key);
  }
  assert.strictEqual(out["0"].axisTooltip.part, "title");
  assert.strictEqual(out["0 - 19_0"].axisTooltip.value, 0);
});

it("swatchTooltips — the swatches keep the pointer and their group", () => {
  const out = leaves(swatchTooltips(legend(), options({tickTooltip: "Note"})));
  for (const key of ["0 - 19", "20 - 49"]) {
    assert.strictEqual(out[key].interactive, undefined, key);
    assert.strictEqual(out[key].interactionGroup, undefined, key);
    assert.strictEqual(out[key].axisTooltip, undefined, key);
  }
});

it("swatchTooltips — unset, a whole title is chrome and whole labels stay as drawn", () => {
  const out = leaves(swatchTooltips(legend(), options()));
  assert.strictEqual(out["0"].interactive, false, "the title takes no pointer");
  assert.strictEqual(out["0"].interactionGroup, "axis");
  assert.strictEqual(out["0 - 19_0"].interactive, false);
  assert.strictEqual(out["0 - 19_0"].interactionGroup, undefined);
});

it("swatchTooltips — unset, a cut title and a cut label show their whole text", () => {
  const out = leaves(
    swatchTooltips(legend(true, label(low, "0 -...", true)), options()),
  );
  assert.strictEqual(out["0"].axisTooltip.truncated, true);
  assert.strictEqual(out["0"].interactive, true);
  assert.strictEqual(out["0 - 19_0"].axisTooltip.text, "0 - 19");
  assert.strictEqual(out["0 - 19_0"].interactive, true);
  assert.strictEqual(out["20 - 49_0"].interactive, false, "a whole label");
});

it("swatchTooltips — false shows nothing, cut labels included", () => {
  const out = leaves(
    swatchTooltips(
      legend(true, label(low, "0 -...", true)),
      options({titleTooltip: false, tickTooltip: false}),
    ),
  );
  assert.strictEqual(out["0"].axisTooltip, undefined);
  assert.strictEqual(out["0"].interactive, false);
  assert.strictEqual(out["0 - 19_0"].axisTooltip, undefined);
  assert.strictEqual(out["0 - 19_0"].interactive, false);
});

it("swatchTooltips — leaves the scene it is given as it was", () => {
  const scene = legend();
  const before = JSON.stringify(scene);
  swatchTooltips(scene, options({titleTooltip: "About", tickTooltip: "Note"}));
  assert.strictEqual(JSON.stringify(scene), before);
});
