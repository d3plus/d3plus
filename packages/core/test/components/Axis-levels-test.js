import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../index.ts";
import TextBox from "../../src/components/TextBox.ts";
import {
  configureLevelBox,
  defaultLevelFormat,
  groupSpan,
  hasLevels,
  innerLevel,
  innerLevelOf,
  layoutAxisLevels,
  levelDates,
  levelFormatter,
  levelDividers,
  levelGroups,
  levelPath,
  levelText,
} from "../../src/components/Axis/axisLevels.ts";
import {levelNodes} from "../../src/components/Axis/axisScene.ts";
import {
  axisTooltipTarget,
  stampLevelTooltips,
} from "../../src/components/Axis/axisTooltipTargets.ts";

/**
    Multi-level category axes (`levels`): each tick is labeled with its
    innermost level, and each run of neighboring categories sharing an
    outer level is labeled once, centered across the run, in a row of its
    own past the tick labels, with a divider between neighboring runs.
*/

useJsdom();

const split = d => `${d}`.split("|");
const quarters = [
  "2020|Q1",
  "2020|Q2",
  "2020|Q3",
  "2020|Q4",
  "2021|Q1",
  "2021|Q2",
];

/** Lays out and paints a standalone category axis over `domain`. */
function draw(Type, domain = quarters, config = {}) {
  return new Type()
    .renderMode("compute")
    .select(null)
    .width(400)
    .height(300)
    .scale("point")
    .domain(domain)
    .levels(split)
    .config(config)
    .render();
}

/** Every text node of an axis's scene, by key. */
function texts(axis) {
  const out = new Map();
  const walk = n => {
    if (n.type === "text") out.set(n.key, n);
    (n.children || []).forEach(walk);
  };
  walk(axis.toScene());
  return out;
}

it("levelPath reads a category's labels as a list", () => {
  assert.deepStrictEqual(levelPath(split, "a|b"), ["a", "b"]);
  assert.deepStrictEqual(
    levelPath(() => "a", "x"),
    ["a"],
  );
});

it("levelText writes a level's value as text, nothing for none", () => {
  assert.strictEqual(levelText(2020), "2020");
  assert.strictEqual(levelText("Q1"), "Q1");
  assert.strictEqual(levelText(undefined), "");
  assert.strictEqual(levelText(null), "");
  assert.strictEqual(levelText(0), "0");
});

it("levelGroups groups neighboring categories by each outer level", () => {
  assert.deepStrictEqual(levelGroups(quarters, split), [
    [
      {value: "2020", first: 0, last: 3},
      {value: "2021", first: 4, last: 5},
    ],
  ]);
  const three = ["a|x|1", "a|x|2", "a|y|1", "b|y|1", "b|y|2"];
  assert.deepStrictEqual(levelGroups(three, split), [
    // The middle level splits where an outer one does, even with the same label.
    [
      {value: "x", first: 0, last: 1},
      {value: "y", first: 2, last: 2},
      {value: "y", first: 3, last: 4},
    ],
    [
      {value: "a", first: 0, last: 2},
      {value: "b", first: 3, last: 4},
    ],
  ]);
});

it("levelGroups draws no rows for one level, and empty labels for missing ones", () => {
  assert.deepStrictEqual(levelGroups(["a", "b"], split), []);
  assert.deepStrictEqual(levelGroups(["a|1", "2"], split), [
    [
      {value: "a", first: 0, last: 0},
      {value: "2", first: 1, last: 1},
    ],
  ]);
  assert.deepStrictEqual(levelGroups([], split), []);
});

it("levelDividers reach out through the outermost row a group starts in", () => {
  const rows = levelGroups(["a|x|1", "a|x|2", "a|y|1", "b|y|1"], split);
  assert.deepStrictEqual(
    [...levelDividers(rows)].sort((a, b) => a[0] - b[0]),
    [
      [2, 0],
      [3, 1],
    ],
  );
  assert.strictEqual(levelDividers([]).size, 0);
});

it("groupSpan spans half a step past its first and last categories, within the range", () => {
  const centers = [10, 30, 50, 70];
  assert.deepStrictEqual(
    groupSpan({first: 1, last: 2}, centers, 20, [0, 80]),
    [20, 60],
  );
  assert.deepStrictEqual(
    groupSpan({first: 0, last: 3}, centers, 20, [5, 75]),
    [5, 75],
  );
  // A reversed axis places the first category last.
  assert.deepStrictEqual(
    groupSpan({first: 0, last: 1}, [70, 50, 30, 10], 20, [0, 80]),
    [40, 80],
  );
});

it("hasLevels and innerLevel read a category axis given levels", () => {
  const axis = new AxisBottom().scale("point").levels(split);
  assert.strictEqual(hasLevels(axis), true);
  assert.strictEqual(innerLevel(axis, "2020|Q3"), "Q3");
  axis.scale("linear");
  assert.strictEqual(hasLevels(axis), false);
  assert.strictEqual(innerLevel(axis, "2020|Q3"), "2020|Q3");
  axis.scale("band").levels(false);
  assert.strictEqual(hasLevels(axis), false);
});

it("configureLevelBox starts from the tick labels' font, under levelConfig", () => {
  const axis = new AxisBottom()
    .shapeConfig({labelConfig: {fontSize: 14, fontFamily: "monospace"}})
    .levelConfig({fontWeight: 700});
  const box = configureLevelBox(new TextBox(), axis);
  assert.strictEqual(box.fontSize()({}, 0), 14);
  assert.strictEqual(box.fontFamily()({}, 0), "monospace");
  assert.strictEqual(box.fontWeight()({}, 0), 700);
  assert.strictEqual(box.textAnchor()({}, 0), "middle");
  assert.strictEqual(box.verticalAlign()({}, 0), "top");
  assert.strictEqual(box.maxLines()({}, 0), 2);
  const left = configureLevelBox(new TextBox(), new AxisLeft());
  assert.strictEqual(left.verticalAlign()({}, 0), "middle");
  assert.strictEqual(left.maxLines()({}, 0), null);
  const top = configureLevelBox(new TextBox(), new AxisTop());
  assert.strictEqual(top.verticalAlign()({}, 0), "bottom");
});

it("layoutAxisLevels lays out a row per outer level, past the labels", () => {
  const axis = draw(AxisBottom);
  const layout = axis._levelLayout;
  assert.ok(layout, "lays out the levels");
  assert.strictEqual(layout.rows.length, 1);
  const [row] = layout.rows;
  assert.deepStrictEqual(
    row.boxes.map(b => b.text),
    ["2020", "2021"],
  );
  // Each label spans its group: 2020 holds four quarters, 2021 two.
  const [a, b] = row.boxes;
  assert.ok(Math.abs((a.hi - a.lo) / (b.hi - b.lo) - 2) < 0.01);
  assert.strictEqual(a.hi, b.lo);
  assert.ok(row.text > 0 && row.depth === row.text + axis.schema.padding);
  assert.strictEqual(layout.room, row.depth);
  assert.strictEqual(layout.dividers.length, 1);
  assert.strictEqual(layout.dividers[0].at, a.hi);
});

it("layoutAxisLevels lays out nothing without levels to draw", () => {
  const flat = new AxisBottom()
    .renderMode("compute")
    .select(null)
    .scale("point")
    .domain(["a", "b"])
    .render();
  assert.strictEqual(flat._levelLayout, undefined);
  assert.strictEqual(layoutAxisLevels(flat, ["a", "b"], 8), undefined);
  // Levels with no labels shown (a small-multiples panel's inner axis).
  const bare = draw(AxisBottom, quarters, {labels: []});
  assert.strictEqual(bare._levelLayout, undefined);
  // One level only.
  const one = draw(AxisBottom, ["a", "b"]);
  assert.strictEqual(one._levelLayout, undefined);
});

/** The tick labels an axis draws, once each (a Line tick lists each twice). */
const tickLabels = axis =>
  axis._tickShape._data
    .filter(d => d.text)
    .slice(0, quarters.length)
    .map(d => d.text);

it("an axis with levels labels its ticks with their innermost level", () => {
  assert.deepStrictEqual(tickLabels(draw(AxisBottom)), [
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Q1",
    "Q2",
  ]);
  // A tickFormat receives the innermost level.
  const formatted = draw(AxisBottom, quarters, {tickFormat: d => `${d}!`});
  assert.deepStrictEqual(tickLabels(formatted), [
    "Q1!",
    "Q2!",
    "Q3!",
    "Q4!",
    "Q1!",
    "Q2!",
  ]);
});

it("outer level rows take room between the labels and the title", () => {
  for (const Type of [AxisBottom, AxisTop, AxisLeft, AxisRight]) {
    const plain = new Type()
      .renderMode("compute")
      .select(null)
      .width(400)
      .height(300)
      .scale("point")
      .domain(quarters)
      .tickFormat(d => split(d)[1])
      .title("Quarter")
      .render();
    const leveled = draw(Type, quarters, {title: "Quarter"});
    const {orient} = leveled.schema;
    const room = leveled._levelLayout.room;
    assert.strictEqual(
      Math.round(leveled._labelSpace - plain._labelSpace),
      Math.round(room),
      `${orient}: claims the rows' room`,
    );
    // The title keeps its room, past the rows.
    assert.strictEqual(
      leveled._margin[orient],
      plain._margin[orient],
      `${orient}: the title's room`,
    );
    assert.strictEqual(
      leveled._levelLayout.start,
      leveled._labelSpace - room + 8,
      `${orient}: rows start past the labels`,
    );
  }
});

it("levelNodes paints each outer label and divider", () => {
  for (const Type of [AxisBottom, AxisTop, AxisLeft, AxisRight]) {
    const axis = draw(Type);
    const nodes = levelNodes(axis);
    const lines = nodes.filter(n => n.type === "line");
    const labels = nodes.filter(n => n.type === "text");
    const {orient} = axis.schema;
    assert.strictEqual(lines.length, 1, `${orient}: one divider`);
    assert.deepStrictEqual(
      labels.map(n => n.lines.map(l => l.text).join(" ")),
      ["2020", "2021"],
      `${orient}: one label per year`,
    );
    const [divider] = lines;
    const along = ["top", "bottom"].includes(orient) ? 0 : 1;
    const across = 1 - along;
    // The divider stands across the axis at the boundary between the years.
    assert.strictEqual(divider.points[0][along], divider.points[1][along]);
    assert.strictEqual(
      divider.points[0][along],
      axis._levelLayout.dividers[0].at,
    );
    // It runs outward from the axis line, past the tick labels.
    const reach = Math.abs(
      divider.points[1][across] - divider.points[0][across],
    );
    assert.ok(reach > axis._levelLayout.start, `${orient}: ${reach}`);
    // Each label sits across its year: centered along a horizontal axis,
    // within its span along a vertical one (which aligns it in the middle).
    const year = labels[0];
    const box = axis._levelLayout.rows[0].boxes[0];
    const t = year.transform;
    if (along) assert.ok(t.y > box.lo && t.y < box.hi, orient);
    else {
      const center = t.x + year.width / 2;
      assert.ok(Math.abs(center - (box.lo + box.hi) / 2) < 0.5, orient);
    }
  }
});

it("levelNodes styles dividers as the axis line, under levelDividerConfig", () => {
  const plain = levelNodes(
    draw(AxisBottom, quarters, {barConfig: {stroke: "red"}}),
  );
  assert.strictEqual(plain.find(n => n.type === "line").paint.stroke, "red");
  const styled = levelNodes(
    draw(AxisBottom, quarters, {levelDividerConfig: {stroke: "blue"}}),
  );
  assert.strictEqual(styled.find(n => n.type === "line").paint.stroke, "blue");
  assert.deepStrictEqual(levelNodes(new AxisBottom()), []);
});

it("an axis's scene includes its level labels", () => {
  const keys = [...texts(draw(AxisBottom)).keys()];
  assert.ok(keys.includes("level-0-0") && keys.includes("level-0-1"), keys);
});

it("a narrow group's horizontal label wraps to two lines at most", () => {
  const domain = ["A very long region name indeed|a", "Short|b", "Short|c"];
  const axis = draw(AxisBottom, domain);
  const [row] = axis._levelLayout.rows;
  const box = new TextBox().renderMode("compute");
  configureLevelBox(box, axis);
  const lH = box.lineHeight()({}, 0) || 12 * 1.2;
  assert.ok(row.text <= Math.ceil(2 * lH), `${row.text}`);
});

/** Year and month categories ("2020|3") whose levels are Dates. */
const dated = d => {
  const [year, month] = `${d}`.split("|").map(Number);
  return [new Date(year, 0, 1), new Date(year, month - 1, 1)];
};
const months = ["2020|11", "2020|12", "2021|1", "2021|2"];

it("innerLevelOf reads a category's innermost level and its index", () => {
  const axis = new AxisBottom().scale("point").levels(split);
  assert.deepStrictEqual(innerLevelOf(axis, "a|b|c"), {value: "c", level: 2});
  assert.deepStrictEqual(innerLevelOf(axis, "a"), {value: "a", level: 0});
});

it("levelDates lists a level's Dates in order, once each", () => {
  const dates = levelDates(["2021|1", "2020|2", "2020|1"], dated, 0);
  assert.deepStrictEqual(dates.map(Number), [
    +new Date(2020, 0, 1),
    +new Date(2021, 0, 1),
  ]);
  assert.deepStrictEqual(levelDates(quarters, split, 0), []);
});

it("defaultLevelFormat writes Dates as tick labels do, other values as text", () => {
  const axis = draw(AxisBottom, months, {levels: dated});
  const format = defaultLevelFormat(axis);
  assert.strictEqual(format(new Date(2020, 0, 1), 0), "2020");
  assert.strictEqual(format(new Date(2021, 0, 1), 0), "2021");
  const month = format(new Date(2020, 11, 1), 1);
  assert.ok(month && !/GMT|00:00/.test(month), month);
  assert.strictEqual(format("Q1", 1), "Q1");
  assert.strictEqual(format(undefined, 0), "");
});

it("levelFormatter calls levelFormat with the value, its level, and the axis", () => {
  const calls = [];
  const axis = new AxisBottom()
    .scale("point")
    .levels(split)
    .levelFormat(function (value, level) {
      calls.push([value, level, this]);
      return `<${value}>`;
    });
  assert.strictEqual(levelFormatter(axis)("2020", 0), "<2020>");
  assert.deepStrictEqual(calls, [["2020", 0, axis]]);
  axis.levelFormat(undefined);
  assert.strictEqual(levelFormatter(axis)("2020", 0), "2020");
});

it("an axis of Dates writes its outer labels and ticks as dates", () => {
  const axis = draw(AxisBottom, months, {levels: dated});
  assert.deepStrictEqual(
    axis._levelLayout.rows[0].boxes.map(b => b.text),
    ["2020", "2021"],
  );
  for (const label of tickLabels(axis).slice(0, months.length))
    assert.ok(!/GMT|00:00/.test(label), label);
});

it("levelFormat writes the outer labels, and tickFormat the ticks", () => {
  const axis = draw(AxisBottom, quarters, {
    levelFormat: (value, level) => `FY${value}:${level}`,
  });
  assert.deepStrictEqual(
    axis._levelLayout.rows[0].boxes.map(b => b.text),
    ["FY2020:0", "FY2021:0"],
  );
  assert.deepStrictEqual(tickLabels(axis).slice(0, 2), ["Q1", "Q2"]);
  const nodes = levelNodes(axis).filter(n => n.type === "text");
  assert.deepStrictEqual(
    nodes.map(n => n.lines.map(l => l.text).join(" ")),
    ["FY2020:0", "FY2021:0"],
  );
});

/** A text node as a TextBox draws a level label. */
const levelNode = (lines, text, truncated, extra = {}) => ({
  type: "text",
  key: "level-0-0",
  lines: lines.map(t => ({text: t})),
  truncated,
  datum: {text, value: 2020, level: 0, ...extra},
});

it("stampLevelTooltips stamps outer labels drawn cut short with their whole text", () => {
  const cut = levelNode(["North…"], "North America", true);
  const whole = levelNode(["Europe"], "Europe", false);
  const tick = {...levelNode(["Q1…"], "Q1 2020", true), datum: {text: "x"}};
  stampLevelTooltips([cut, whole, tick], undefined);
  assert.deepStrictEqual(axisTooltipTarget(cut), {
    part: "level",
    value: 2020,
    index: 0,
    text: "North America",
    truncated: true,
    option: undefined,
  });
  assert.strictEqual(axisTooltipTarget(whole), undefined);
  assert.strictEqual(axisTooltipTarget(tick), undefined);
  const off = levelNode(["North…"], "North America", true);
  stampLevelTooltips([off], false);
  assert.strictEqual(axisTooltipTarget(off), undefined);
});

it("a cut outer label carries its whole text for the axis tooltip", () => {
  const long =
    "A region name far too long to fit under its two narrow categories in two lines";
  const axis = draw(AxisBottom, [
    `${long}|a`,
    `${long}|b`,
    "Short|c",
    "Short|d",
    "Short|e",
    "Short|f",
    "Short|g",
    "Short|h",
  ]);
  const labels = levelNodes(axis).filter(n => n.type === "text");
  const target = axisTooltipTarget(labels[0]);
  assert.ok(target, "the cut label is stamped");
  assert.strictEqual(target.text, long);
  assert.strictEqual(target.part, "level");
  assert.strictEqual(axisTooltipTarget(labels[1]), undefined);
});
