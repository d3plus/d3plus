import {it} from "vitest";
import assert from "assert";
import {
  axisTooltipTarget,
  labelCut,
  stampTickTooltips,
  stampTitleTooltip,
} from "../../src/components/Axis/axisTooltipTargets.ts";

/** A laid-out text node drawing `lines`. */
const text = (lines, extra = {}) => ({
  type: "text",
  key: "t",
  lines: lines.map(t => ({text: t, x: 0, y: 0, width: 10})),
  ...extra,
});

/** A tick label's nodes: its text and hitbox share the label record. */
const tickLabel = (id, drawn, truncated = false, label = `${id}`) => {
  const datum = {__d3plus__: true, data: {id, text: label, tick: true}};
  return {
    type: "group",
    key: `${id}-label`,
    children: [
      {type: "rect", key: `${id}-hit`, x: 0, y: 0, width: 1, height: 1, datum},
      text([drawn], {key: `${id}_0`, datum, ...(truncated ? {truncated} : {})}),
    ],
  };
};

it("labelCut — a truncated text node whose lines hold less than the text", () => {
  assert.strictEqual(
    labelCut(
      text(["A rather long..."], {truncated: true}),
      "A rather long name",
    ),
    true,
  );
  assert.strictEqual(
    labelCut(text(["A rather long name"]), "A rather long name"),
    false,
    "drawn whole",
  );
  assert.strictEqual(
    labelCut(text(["A rather long..."]), "A rather long name"),
    false,
    "not flagged by its layout",
  );
});

it("labelCut — a wrapped label that still spells the whole text is not cut", () => {
  const wrapped = text(["A rather", "long name"], {truncated: true});
  assert.strictEqual(labelCut(wrapped, "A rather long name"), false);
});

it("labelCut — only text nodes are labels", () => {
  const rect = {type: "rect", key: "r", x: 0, y: 0, width: 1, height: 1};
  assert.strictEqual(labelCut(rect, "anything"), false);
});

it("axisTooltipTarget — reads a node's stamp, or nothing", () => {
  const target = {part: "tick", value: 1, index: 0, text: "1"};
  assert.strictEqual(
    axisTooltipTarget({type: "text", axisTooltip: target}),
    target,
  );
  assert.strictEqual(axisTooltipTarget(text(["1"])), undefined);
  assert.strictEqual(axisTooltipTarget(null), undefined);
  assert.strictEqual(axisTooltipTarget(undefined), undefined);
});

it("stampTickTooltips — stamps each label's nodes with its value, text and index", () => {
  const option = d => `note ${d}`;
  const nodes = [tickLabel("A", "A"), tickLabel(2020, "2,020", false, "2,020")];
  stampTickTooltips(nodes, option);
  const [first, second] = nodes.map(n => n.children.map(axisTooltipTarget));
  assert.deepStrictEqual(first[1], {
    part: "tick",
    value: "A",
    index: 0,
    text: "A",
    truncated: false,
    option,
  });
  assert.strictEqual(first[0], first[1], "the hitbox carries the same target");
  assert.deepStrictEqual(
    [second[1].value, second[1].index, second[1].text],
    [2020, 1, "2,020"],
  );
});

it("stampTickTooltips — unset, only cut labels are stamped", () => {
  const nodes = [
    tickLabel("Short", "Short"),
    tickLabel("x", "A long...", true, "A long label"),
  ];
  stampTickTooltips(nodes, undefined);
  assert.strictEqual(axisTooltipTarget(nodes[0].children[1]), undefined);
  const cut = axisTooltipTarget(nodes[1].children[1]);
  assert.deepStrictEqual(
    [cut.truncated, cut.text, cut.index, cut.option],
    [true, "A long label", 1, undefined],
  );
});

it("stampTickTooltips — false stamps nothing, cut labels included", () => {
  const nodes = [tickLabel("x", "A long...", true, "A long label")];
  stampTickTooltips(nodes, false);
  assert.strictEqual(axisTooltipTarget(nodes[0].children[1]), undefined);
});

it("stampTickTooltips — skips nodes that are not tick labels", () => {
  const other = text(["Title"], {datum: {text: "Title"}});
  const bare = text(["bare"]);
  stampTickTooltips([other, bare], () => "note");
  assert.strictEqual(axisTooltipTarget(other), undefined);
  assert.strictEqual(axisTooltipTarget(bare), undefined);
});

it("stampTitleTooltip — stamps the title's nodes with the title", () => {
  const node = text(["Population"], {datum: {text: "Population"}});
  const group = {type: "group", key: "g", children: [node]};
  stampTitleTooltip([group], "Population", "People, 2020");
  assert.deepStrictEqual(axisTooltipTarget(node), {
    part: "title",
    value: "Population",
    index: 0,
    text: "Population",
    truncated: false,
    option: "People, 2020",
  });
  assert.strictEqual(axisTooltipTarget(group), undefined, "not its group");
});

it("stampTitleTooltip — unset, only a cut title is stamped", () => {
  const whole = text(["Population"], {datum: {text: "Population"}});
  stampTitleTooltip([whole], "Population", undefined);
  assert.strictEqual(axisTooltipTarget(whole), undefined);

  const cut = text(["Popul..."], {
    datum: {text: "Population"},
    truncated: true,
  });
  stampTitleTooltip([cut], "Population", undefined);
  assert.strictEqual(axisTooltipTarget(cut).truncated, true);
});

it("stampTitleTooltip — false stamps nothing", () => {
  const cut = text(["Popul..."], {
    datum: {text: "Population"},
    truncated: true,
  });
  stampTitleTooltip([cut], "Population", false);
  assert.strictEqual(axisTooltipTarget(cut), undefined);
});
