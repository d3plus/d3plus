import {it, vi} from "vitest";
import assert from "assert";
import {
  bindAccessors,
  handleAxisTooltip,
  isAxisTooltipDatum,
  resolveAxisTooltip,
} from "../../src/charts/features/axisTooltip.ts";
import constant from "../../src/utils/constant.ts";

/** A hovered label. */
const target = (overrides = {}) => ({
  part: "tick",
  value: "A",
  index: 2,
  text: "A long label",
  truncated: false,
  option: undefined,
  ...overrides,
});

it("bindAccessors — every function, at any depth, is called with the given arguments", () => {
  const seen = [];
  const config = {
    title: (...args) => (seen.push(args), "t"),
    tbody: [["Row", (...args) => (seen.push(args), "cell")]],
    titleStyle: {color: (...args) => (seen.push(args), "red")},
    footer: "plain",
    offset: 5,
    arrow: null,
  };
  const bound = bindAccessors(config, ["value", 3]);
  assert.strictEqual(bound.title({some: "datum"}, 0), "t");
  assert.strictEqual(bound.tbody[0][1]({some: "datum"}), "cell");
  assert.strictEqual(bound.titleStyle.color(), "red");
  assert.deepStrictEqual(seen, [
    ["value", 3],
    ["value", 3],
    ["value", 3],
  ]);
  assert.deepStrictEqual(
    [bound.tbody[0][0], bound.footer, bound.offset, bound.arrow],
    ["Row", "plain", 5, null],
  );
  assert.notStrictEqual(bound, config, "a copy");
  assert.strictEqual(
    typeof config.title({}),
    "string",
    "the original is untouched",
  );
});

it("bindAccessors — keeps the caller's `this`", () => {
  const self = {};
  const bound = bindAccessors(function () {
    return this;
  }, []);
  assert.strictEqual(bound.call(self), self);
});

it("resolveAxisTooltip — a string is the body", () => {
  assert.deepStrictEqual(
    resolveAxisTooltip(target({part: "title", option: "Constant 2015 US$"})),
    {title: false, body: "Constant 2015 US$"},
  );
});

it("resolveAxisTooltip — a title function receives the title", () => {
  const option = vi.fn(title => `About ${title}`);
  const content = resolveAxisTooltip(
    target({part: "title", value: "GDP", index: 0, option}),
  );
  assert.deepStrictEqual(content, {title: false, body: "About GDP"});
  assert.deepStrictEqual(option.mock.calls, [["GDP"]]);
});

it("resolveAxisTooltip — a tick function receives the value and index, with the given `this`", () => {
  const self = {};
  let context;
  const option = vi.fn(function (value, index) {
    context = this;
    return `${value} is #${index}`;
  });
  const content = resolveAxisTooltip(target({option}), true, self);
  assert.deepStrictEqual(content, {title: false, body: "A is #2"});
  assert.deepStrictEqual(option.mock.calls, [["A", 2]]);
  assert.strictEqual(context, self);
});

it("resolveAxisTooltip — a function returning nothing shows nothing", () => {
  for (const empty of [undefined, null, false, ""])
    assert.strictEqual(resolveAxisTooltip(target({option: () => empty})), null);
  assert.deepStrictEqual(
    resolveAxisTooltip(target({option: () => 0})),
    {title: false, body: "0"},
    "zero is text",
  );
});

it("resolveAxisTooltip — an object is a tooltip config bound to the label", () => {
  const body = vi.fn((value, index) => `${value}/${index}`);
  const content = resolveAxisTooltip(target({option: {body, footer: "f"}}));
  assert.strictEqual(content.title, false);
  assert.strictEqual(content.body, false);
  assert.strictEqual(content.config.footer, "f");
  assert.strictEqual(content.config.body({a: "datum"}, 9), "A/2");

  const title = resolveAxisTooltip(
    target({part: "title", value: "GDP", option: {body}}),
  );
  title.config.body();
  assert.deepStrictEqual(body.mock.calls.at(-1), ["GDP"]);
});

it("resolveAxisTooltip — a cut label heads the tooltip with its whole text", () => {
  assert.deepStrictEqual(resolveAxisTooltip(target({truncated: true})), {
    title: "A long label",
    body: false,
  });
  assert.deepStrictEqual(
    resolveAxisTooltip(target({truncated: true, option: () => "note"})),
    {title: "A long label", body: "note"},
  );
  assert.strictEqual(
    resolveAxisTooltip(target({truncated: true, option: {footer: "f"}})).title,
    "A long label",
  );
});

it("resolveAxisTooltip — a label drawn whole with no option shows nothing", () => {
  assert.strictEqual(resolveAxisTooltip(target()), null);
});

it("resolveAxisTooltip — false shows nothing, cut or not", () => {
  assert.strictEqual(resolveAxisTooltip(target({option: false})), null);
  assert.strictEqual(
    resolveAxisTooltip(target({option: false, truncated: true})),
    null,
  );
});

it("resolveAxisTooltip — without `fullText` a cut label shows only what its option gives", () => {
  assert.strictEqual(
    resolveAxisTooltip(target({truncated: true}), false),
    null,
  );
  assert.deepStrictEqual(
    resolveAxisTooltip(target({truncated: true, option: "note"}), false),
    {title: false, body: "note"},
  );
});

/** A stand-in Tooltip: fluent setters over a plain `schema`. */
const fakeTooltip = () => {
  let data = [];
  const tip = {
    schema: {
      title: "mark title",
      tbody: [["a", "b"]],
      titleStyle: {color: "red"},
    },
    rendered: [],
    data(_) {
      if (!arguments.length) return data;
      data = _;
      return tip;
    },
    config(_) {
      Object.assign(tip.schema, _);
      return tip;
    },
    render() {
      tip.rendered.push({data, schema: {...tip.schema}});
      return tip;
    },
  };
  for (const key of [
    "title",
    "body",
    "footer",
    "thead",
    "tbody",
    "position",
    "titleStyle",
  ])
    tip[key] = _ => ((tip.schema[key] = _), tip);
  return tip;
};

/** A stand-in chart around a Tooltip. */
const fakeViz = (overrides = {}) => ({
  schema: {tooltip: constant(true), tooltipConfig: {background: "navy"}},
  _tooltipClass: fakeTooltip(),
  ...overrides,
});

/** A pointer event over `node`. */
const event = (type, node) => ({
  type,
  point: [10, 20],
  pick: node ? {node, datum: node.datum, index: 0} : null,
  nativeEvent: {clientX: 110, clientY: 220},
});

const label = stamp => ({
  type: "text",
  key: "l",
  lines: [],
  axisTooltip: stamp,
});

it("handleAxisTooltip — shows the tooltip at the pointer and puts the tooltip's settings back", () => {
  const viz = fakeViz();
  const before = {...viz._tooltipClass.schema};
  const shown = handleAxisTooltip(
    viz,
    event("mousemove", label(target({option: "note"}))),
  );
  assert.strictEqual(shown, true);
  const [{data, schema}] = viz._tooltipClass.rendered;
  assert.deepStrictEqual(data, [
    {part: "tick", value: "A", index: 2, text: "A long label"},
  ]);
  assert.strictEqual(isAxisTooltipDatum(data[0]), true);
  assert.deepStrictEqual(
    [schema.title, schema.body, schema.footer, schema.thead, schema.tbody],
    [false, "note", false, [], []],
  );
  assert.deepStrictEqual(schema.position, [110, 220]);
  assert.strictEqual(schema.background, "navy", "the chart's tooltipConfig");
  assert.deepStrictEqual(viz._tooltipClass.schema, before, "settings restored");
});

it("handleAxisTooltip — a config object lays over the chart's tooltipConfig", () => {
  const viz = fakeViz();
  handleAxisTooltip(
    viz,
    event(
      "mouseenter",
      label(
        target({option: {background: "white", body: (v, i) => `${v}${i}`}}),
      ),
    ),
  );
  const [{schema}] = viz._tooltipClass.rendered;
  assert.strictEqual(schema.background, "white");
  assert.strictEqual(schema.body({}, 0), "A2");
});

it("handleAxisTooltip — a title alone drops the gap under it", () => {
  const viz = fakeViz();
  handleAxisTooltip(viz, event("mousemove", label(target({truncated: true}))));
  const [{schema}] = viz._tooltipClass.rendered;
  assert.strictEqual(schema.title, "A long label");
  assert.deepStrictEqual(schema.titleStyle, {"margin-bottom": "0"});
  assert.deepStrictEqual(viz._tooltipClass.schema.titleStyle, {color: "red"});
});

it("handleAxisTooltip — hides its tooltip when the pointer moves off or leaves", () => {
  for (const next of [
    event("mousemove", {type: "rect", key: "bar"}),
    event("mousemove", null),
    event("mouseleave", null),
  ]) {
    const viz = fakeViz();
    handleAxisTooltip(viz, event("mousemove", label(target({option: "note"}))));
    assert.strictEqual(handleAxisTooltip(viz, next), false);
    assert.deepStrictEqual(viz._tooltipClass.data(), []);
    assert.strictEqual(viz._tooltipClass.rendered.length, 2);
  }
});

it("handleAxisTooltip — leaves another tooltip alone", () => {
  const viz = fakeViz();
  const mark = {id: "alpha"};
  viz._tooltipClass.data([mark]);
  assert.strictEqual(isAxisTooltipDatum(mark), false);
  assert.strictEqual(handleAxisTooltip(viz, event("mousemove", null)), false);
  assert.strictEqual(handleAxisTooltip(viz, event("mouseleave", null)), false);
  assert.deepStrictEqual(viz._tooltipClass.data(), [mark]);
  assert.strictEqual(viz._tooltipClass.rendered.length, 0);
});

it("handleAxisTooltip — ignores clicks, unstamped labels, and labels with nothing to show", () => {
  const viz = fakeViz();
  const stamped = label(target({option: "note"}));
  assert.strictEqual(handleAxisTooltip(viz, event("click", stamped)), false);
  assert.strictEqual(
    handleAxisTooltip(viz, event("mousemove", label())),
    false,
  );
  assert.strictEqual(
    handleAxisTooltip(
      viz,
      event("mousemove", label(target({option: () => {}}))),
    ),
    false,
  );
  assert.strictEqual(viz._tooltipClass.rendered.length, 0);
});

it("handleAxisTooltip — a chart with tooltips off shows only what an axis option gives", () => {
  const viz = fakeViz({
    schema: {tooltip: constant(false), tooltipConfig: {}},
  });
  const cut = target({truncated: true});
  assert.strictEqual(
    handleAxisTooltip(viz, event("mousemove", label(cut))),
    false,
  );
  assert.strictEqual(
    handleAxisTooltip(viz, event("mousemove", label({...cut, option: "note"}))),
    true,
  );
  assert.strictEqual(viz._tooltipClass.rendered[0].schema.title, false);
});

it("handleAxisTooltip — shows nothing while a transition is in flight", () => {
  const viz = fakeViz({_transitionEndsAt: Date.now() + 10000});
  const stamped = label(target({option: "note"}));
  assert.strictEqual(
    handleAxisTooltip(viz, event("mousemove", stamped)),
    false,
  );
  viz._transitionEndsAt = Date.now() - 1;
  assert.strictEqual(handleAxisTooltip(viz, event("mousemove", stamped)), true);
});

it("handleAxisTooltip — a touch anchors the tooltip at its first point", () => {
  const viz = fakeViz();
  const touch = {
    ...event("mousemove", label(target({option: "note"}))),
    nativeEvent: {touches: [{clientX: 7, clientY: 9}]},
  };
  handleAxisTooltip(viz, touch);
  assert.deepStrictEqual(viz._tooltipClass.rendered[0].schema.position, [7, 9]);
});

it("handleAxisTooltip — does nothing without a tooltip", () => {
  assert.strictEqual(
    handleAxisTooltip({schema: {}}, event("mousemove", label(target()))),
    false,
  );
});

it("isAxisTooltipDatum — only the data of axis tooltips shown", () => {
  assert.strictEqual(isAxisTooltipDatum(undefined), false);
  assert.strictEqual(isAxisTooltipDatum("text"), false);
  assert.strictEqual(isAxisTooltipDatum({part: "tick"}), false);
});
