import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../index.ts";
import TextBox from "../../src/components/TextBox.ts";
import {
  configureLevelBox,
  groupSpan,
  hasLevels,
  innerLevel,
  layoutAxisLevels,
  levelDividers,
  levelGroups,
  levelPath,
  levelText,
} from "../../src/components/Axis/axisLevels.ts";
import {levelNodes} from "../../src/components/Axis/axisScene.ts";

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
