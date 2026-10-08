import assert from "assert";
import {
  allotEndLabelWidths,
  domainEnds,
  END_LABEL_AXIS_CONFIG,
  endLabelSpace,
  labelsXEnds,
  layoutEndLabels,
} from "../../es/src/charts/features/axisEndLabels.js";

/**
    The pure helpers behind a short Plot's x-axis end labels. The browser-side
    pieces (measuring, emitting, and aligning against a real Axis) are covered
    in `plot-short-x-axis-test.js`.
*/

const measure = (labels, padding = 5, height = 17) => ({
  labels,
  padding,
  height,
});

it("axisEndLabels END_LABEL_AXIS_CONFIG hides the test axis's tick labels", () => {
  assert.deepStrictEqual(END_LABEL_AXIS_CONFIG, {labels: []});
});

it("axisEndLabels labelsXEnds labels the ends only when the x axis shows and the y axis doesn't", () => {
  const viz = {_xConfig: {}};
  assert.strictEqual(labelsXEnds(viz, true, false), true);
  assert.strictEqual(labelsXEnds(viz, true, true), false);
  assert.strictEqual(labelsXEnds(viz, false, false), false);
  assert.strictEqual(labelsXEnds({}, true, false), true);
});

it("axisEndLabels labelsXEnds defers to labels the user chose with xConfig.labels", () => {
  assert.strictEqual(
    labelsXEnds({_xConfig: {labels: [10, 20]}}, true, false),
    false,
  );
  assert.strictEqual(labelsXEnds({_xConfig: {labels: []}}, true, false), false);
  assert.strictEqual(
    labelsXEnds({_xConfig: {ticks: [0, 5]}}, true, false),
    true,
  );
});

/** A stand-in axis with a `scale` and a domain. */
const axis = (domain, scale = "linear") => ({
  schema: {scale},
  _getDomain: () => domain,
});

it("axisEndLabels domainEnds returns the first and last domain values", () => {
  assert.deepStrictEqual(domainEnds(axis([0, 30])), [0, 30]);
  assert.deepStrictEqual(
    domainEnds(axis([2018, 2019, 2020, 2021], "point")),
    [2018, 2021],
  );
  assert.deepStrictEqual(domainEnds(axis([30, 0])), [30, 0]);
});

it("axisEndLabels domainEnds gives a time scale's ends as timestamps, like its tick labels", () => {
  const a = new Date(2020, 0, 1),
    b = new Date(2024, 0, 1);
  assert.deepStrictEqual(domainEnds(axis([a, b], "time")), [+a, +b]);
});

it("axisEndLabels domainEnds keeps a discrete scale's values as they are", () => {
  const a = new Date(2020, 0, 1),
    b = new Date(2024, 0, 1);
  assert.deepStrictEqual(
    domainEnds(axis([a, new Date(2022, 0, 1), b], "point")),
    [a, b],
  );
});

it("axisEndLabels domainEnds collapses matching ends to one value and an empty domain to none", () => {
  assert.deepStrictEqual(domainEnds(axis([5, 5])), [5]);
  assert.deepStrictEqual(domainEnds(axis(["only"], "band")), ["only"]);
  const d = new Date(2020, 0, 1);
  assert.deepStrictEqual(domainEnds(axis([d, new Date(+d)], "time")), [+d]);
  assert.deepStrictEqual(domainEnds(axis([d], "point")), [d]);
  assert.deepStrictEqual(domainEnds(axis([])), []);
});

it("axisEndLabels endLabelSpace claims the padding plus the text height", () => {
  assert.strictEqual(endLabelSpace(measure([], 5, 17), 150), 22);
  assert.strictEqual(endLabelSpace(measure([], 0, 17), 150), 17);
});

it("axisEndLabels endLabelSpace claims nothing when the plot would end up shorter than the labels", () => {
  assert.strictEqual(endLabelSpace(measure([], 5, 17), 44), 22);
  assert.strictEqual(endLabelSpace(measure([], 5, 17), 43), 0);
  assert.strictEqual(endLabelSpace(measure([], 5, 17), 10), 0);
});

it("axisEndLabels endLabelSpace claims nothing for labels with no text", () => {
  assert.strictEqual(endLabelSpace(measure([], 5, 0), 150), 0);
});

it("axisEndLabels allotEndLabelWidths gives fitting labels room to their natural widths", () => {
  // span 100, gap 5: each box spans everything the other label doesn't need.
  assert.deepStrictEqual(allotEndLabelWidths(20, 30, 100, 5), [65, 75]);
  assert.deepStrictEqual(allotEndLabelWidths(45, 50, 100, 5), [45, 50]);
});

it("axisEndLabels allotEndLabelWidths keeps the narrow label whole and truncates the other", () => {
  assert.deepStrictEqual(allotEndLabelWidths(20, 200, 100, 5), [20, 75]);
  assert.deepStrictEqual(allotEndLabelWidths(200, 20, 100, 5), [75, 20]);
});

it("axisEndLabels allotEndLabelWidths halves the span when both labels are too wide", () => {
  assert.deepStrictEqual(allotEndLabelWidths(200, 300, 100, 4), [48, 48]);
  assert.deepStrictEqual(allotEndLabelWidths(10, 10, 0, 5), [0, 0]);
});

it("axisEndLabels layoutEndLabels anchors the start left and the end right, below the plot", () => {
  const boxes = layoutEndLabels(
    measure([
      {value: 0, text: "0", width: 7},
      {value: 30, text: "30", width: 14},
    ]),
    [10, 410],
    100,
  );
  assert.deepStrictEqual(boxes, [
    {
      value: 0,
      text: "0",
      x: 10,
      y: 105,
      width: 381,
      height: 17,
      textAnchor: "start",
    },
    {
      value: 30,
      text: "30",
      x: 22,
      y: 105,
      width: 388,
      height: 17,
      textAnchor: "end",
    },
  ]);
  // The start box starts at the plot's left edge; the end box ends at its right edge.
  assert.strictEqual(boxes[1].x + boxes[1].width, 410);
});

it("axisEndLabels layoutEndLabels centers a lone label across the plot", () => {
  const boxes = layoutEndLabels(
    measure([{value: 2020, text: "2020", width: 28}]),
    [10, 410],
    100,
  );
  assert.deepStrictEqual(boxes, [
    {
      value: 2020,
      text: "2020",
      x: 10,
      y: 105,
      width: 400,
      height: 17,
      textAnchor: "middle",
    },
  ]);
});

it("axisEndLabels layoutEndLabels swaps the anchors on a right-to-left page", () => {
  const boxes = layoutEndLabels(
    measure([
      {value: 0, text: "0", width: 7},
      {value: 30, text: "30", width: 14},
    ]),
    [0, 100],
    50,
    true,
  );
  assert.deepStrictEqual(
    boxes.map(b => b.textAnchor),
    ["end", "start"],
  );
});

it("axisEndLabels layoutEndLabels returns no boxes without labels or text height", () => {
  assert.deepStrictEqual(layoutEndLabels(measure([]), [0, 100], 50), []);
  assert.deepStrictEqual(
    layoutEndLabels(
      measure(
        [
          {value: 0, text: "", width: 0},
          {value: 1, text: "", width: 0},
        ],
        5,
        0,
      ),
      [0, 100],
      50,
    ),
    [],
  );
});

it("axisEndLabels layoutEndLabels uses the labels' padding as their gap and the truncation room", () => {
  const boxes = layoutEndLabels(
    measure(
      [
        {value: "a", text: "a".repeat(40), width: 300},
        {value: "b", text: "b".repeat(40), width: 300},
      ],
      10,
    ),
    [0, 210],
    0,
  );
  assert.deepStrictEqual(
    boxes.map(b => [b.x, b.y, b.width]),
    [
      [0, 10, 100],
      [110, 10, 100],
    ],
  );
});
