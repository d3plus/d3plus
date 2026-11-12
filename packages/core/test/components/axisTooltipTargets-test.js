import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft} from "../../index.ts";
import {
  axisTooltipTarget,
  inertAxis,
  labelCut,
  stampTickTooltips,
  stampTitleTooltip,
  tickRank,
} from "../../src/components/Axis/axisTooltipTargets.ts";

useJsdom();

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

it("stampTickTooltips — a rank orders the indices, whatever order the labels come in", () => {
  const nodes = [6, 4, 2, 0].map(id => tickLabel(id, `${id}`));
  stampTickTooltips(nodes, "note", value => value);
  const index = node => axisTooltipTarget(node.children[1]).index;
  assert.deepStrictEqual(nodes.map(index), [3, 2, 1, 0]);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["6-label", "4-label", "2-label", "0-label"],
    "the labels stay where they were",
  );
});

it("tickRank — a value or time axis counts up from its lowest value", () => {
  const axis = scale => ({schema: {scale}, _givenDomain: () => [100, 0]});
  for (const scale of ["linear", "log", "pow", "sqrt", "time"]) {
    const rank = tickRank(axis(scale));
    assert.ok(rank(0.1) < rank(10), scale);
    assert.ok(rank(-10) < rank(0.1), scale);
  }
  const time = tickRank(axis("time"));
  assert.ok(time(new Date(2020, 0, 1)) < time(new Date(2021, 0, 1)));
  assert.ok(time(new Date(2020, 0, 1)) < time(+new Date(2021, 0, 1)));
});

it("tickRank — a categorical axis counts from its domain's first category", () => {
  for (const scale of ["band", "point", "ordinal"]) {
    const rank = tickRank({
      schema: {scale},
      _givenDomain: () => ["B", "A", "C"],
    });
    assert.deepStrictEqual(["A", "B", "C", "?"].map(rank), [1, 0, 2, 3], scale);
  }
  const dates = [new Date(2021, 0, 1), new Date(2020, 0, 1)];
  const byDate = tickRank({schema: {scale: "band"}, _givenDomain: () => dates});
  assert.strictEqual(byDate(new Date(2020, 0, 1)), 1, "a date by its time");
});

it("tickRank — an axis holding its domain end first counts from its last category", () => {
  const domain = ["Sea", "Bee", "Ann"];
  const rank = tickRank({
    schema: {scale: "band"},
    _domainEndFirst: true,
    _givenDomain: () => domain,
  });
  assert.deepStrictEqual(["Ann", "Bee", "Sea"].map(rank), [0, 1, 2]);
  assert.deepStrictEqual(domain, ["Sea", "Bee", "Ann"], "the domain is kept");
});

/** A laid-out axis's tick labels as `[value, index]`, in the order drawn along its range. */
function drawn(axis) {
  axis.tickTooltip("note").renderMode("compute").select(null).render();
  const targets = new Set();
  const walk = nodes =>
    nodes.forEach(node => {
      const target = axisTooltipTarget(node);
      if (target && target.part === "tick") targets.add(target);
      walk(node.children ?? []);
    });
  walk(axis.toScene().children);
  return Array.from(targets)
    .sort((a, b) => axis._getPosition(a.value) - axis._getPosition(b.value))
    .map(target => [+target.value || target.value, target.index]);
}

const bottom = config =>
  drawn(new AxisBottom().width(600).height(100).config(config));
const left = config =>
  drawn(new AxisLeft().width(100).height(400).config(config));

/** `[value, index]` pairs counting up from `values`' first. */
const counted = values => values.map((value, index) => [value, index]);

it("tick index — a horizontal value axis counts from its left label", () => {
  const ticks = [0, 20, 40, 60, 80, 100];
  assert.deepStrictEqual(
    bottom({domain: [0, 100], labels: ticks}),
    counted(ticks),
  );
});

it("tick index — a vertical value axis counts from its lowest value", () => {
  const ticks = [0, 25, 50, 75, 100];
  // A Plot hands its y axes their domain from the top: 0 is drawn last, at the bottom.
  assert.deepStrictEqual(
    left({domain: [100, 0], labels: ticks}),
    counted(ticks).reverse(),
  );
  assert.deepStrictEqual(
    left({domain: [0, 100], labels: ticks}),
    counted(ticks),
    "at the top when the axis runs downward",
  );
});

it("tick index — a log axis counts from its lowest value", () => {
  assert.deepStrictEqual(
    left({domain: [1000, 1], scale: "log", labels: [1, 10, 100, 1000]}),
    counted([1, 10, 100, 1000]).reverse(),
  );
});

it("tick index — a time axis counts from its earliest label", () => {
  const years = [2020, 2021, 2022, 2023].map(year => +new Date(year, 0, 1));
  const config = {
    domain: [new Date(2020, 0, 1), new Date(2023, 0, 1)],
    labels: years,
    scale: "time",
  };
  assert.deepStrictEqual(bottom(config), counted(years));
  assert.deepStrictEqual(
    bottom({...config, reverse: true}),
    counted(years).reverse(),
    "reversed, the earliest label is drawn last and still counts first",
  );
});

it("tick index — a band or point axis counts from its domain's first category", () => {
  const domain = ["Bee", "Ann", "Sea"];
  for (const scale of ["band", "point"]) {
    assert.deepStrictEqual(bottom({domain, scale}), counted(domain), scale);
    assert.deepStrictEqual(left({domain, scale}), counted(domain), scale);
  }
});

it("tick index — a reversed axis keeps each label's index", () => {
  const ticks = [0, 20, 40, 60, 80, 100];
  assert.deepStrictEqual(
    bottom({domain: [0, 100], labels: ticks, reverse: true}),
    counted(ticks).reverse(),
    "a value axis: 0 is drawn at the right and still counts first",
  );
  assert.deepStrictEqual(
    bottom({domain: [100, 0], labels: ticks}),
    counted(ticks).reverse(),
    "a descending domain counts the same way",
  );
  assert.deepStrictEqual(
    left({domain: [100, 0], labels: ticks, reverse: true}),
    counted(ticks),
    "a Plot's reversed y axis: 0 is drawn at the top",
  );
  const domain = ["Bee", "Ann", "Sea"];
  assert.deepStrictEqual(
    bottom({domain, scale: "band", reverse: true}),
    counted(domain).reverse(),
    "a category axis: the first category is drawn last",
  );
});

it("tick index — a Plot's y axis counts its categories from the bottom", () => {
  // A Plot hands a y axis its categories from the top and says so.
  const axis = () => {
    const axis = new AxisLeft().width(100).height(400);
    axis._domainEndFirst = true;
    return axis;
  };
  assert.deepStrictEqual(
    drawn(axis().config({domain: ["Sea", "Bee", "Ann"], scale: "band"})),
    [
      ["Sea", 2],
      ["Bee", 1],
      ["Ann", 0],
    ],
  );
  assert.deepStrictEqual(
    drawn(
      axis().config({
        domain: ["Sea", "Bee", "Ann"],
        scale: "band",
        reverse: true,
      }),
    ),
    [
      ["Ann", 0],
      ["Bee", 1],
      ["Sea", 2],
    ],
    "reversed, the bottom category is drawn at the top",
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

it("inertAxis — only the nodes stamped with a tooltip target stay in hit-testing", () => {
  const labels = [
    tickLabel("Short", "Short"),
    tickLabel("x", "A long...", true, "A long label"),
  ];
  stampTickTooltips(labels, undefined);
  const grid = {type: "line", key: "grid-0", points: []};
  const axis = {type: "group", key: "axis", children: [grid, ...labels]};
  const inert = inertAxis(axis);

  const flags = node =>
    node.type === "group" ? node.children.map(flags) : node.interactive;
  assert.deepStrictEqual(flags(inert), [
    false,
    [false, false],
    [undefined, undefined],
  ]);
  assert.strictEqual(inert.interactive, undefined, "a group keeps its own");
  assert.strictEqual(
    axisTooltipTarget(inert.children[2].children[1]).text,
    "A long label",
    "the target stays on its node",
  );
});

it("inertAxis — every node joins the axis interaction group", () => {
  const axis = {
    type: "group",
    key: "axis",
    children: [
      {type: "group", key: "ticks", children: [text(["1"], {key: "tick"})]},
      text(["Title"], {key: "title", interactionGroup: "other"}),
    ],
  };
  const groups = node => [
    node.interactionGroup,
    ...(node.children ?? []).flatMap(groups),
  ];
  assert.deepStrictEqual(groups(inertAxis(axis)), [
    "axis",
    "axis",
    "axis",
    "axis",
  ]);
});

it("inertAxis — leaves the scene it is given as it was", () => {
  const leaf = text(["1"], {key: "tick"});
  const axis = {type: "group", key: "axis", children: [leaf]};
  const inert = inertAxis(axis);
  assert.notStrictEqual(inert, axis);
  assert.deepStrictEqual(axis, {type: "group", key: "axis", children: [leaf]});
  assert.deepStrictEqual(leaf, text(["1"], {key: "tick"}));
  assert.strictEqual(inert.children[0].interactive, false);
});
