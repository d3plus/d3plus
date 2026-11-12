import {it} from "vitest";
import assert from "assert";
import {Axis, ColorScale} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/*
    An axis with `rounding: "inside"` narrows its domain to round values
    inside the data and marks the two ends as open: "< " before the lowest
    value and "+" after the highest. The ends are the lowest and highest
    values the axis labels, so a custom `ticks` list leaves the affixes on
    the end labels wherever its own ticks stop. An end label the data does
    not reach is not open.
*/

/** The axis's painted label text, in value order. */
function labelText(axis) {
  const found = [];
  const walk = node => {
    if (node.type === "text")
      found.push([
        node.datum.data.id,
        node.lines.map(line => line.text).join(" "),
      ]);
    (node.children || []).forEach(walk);
  };
  walk(axis.toScene());
  return found.sort((a, b) => a[0] - b[0]).map(d => d[1]);
}

/** Renders a 600px axis over data running 120 to 1,040, rounded inside to 200 and 1,000. */
function axisLabels(config = {}) {
  const axis = new Axis().config({
    domain: [120, 1040],
    rounding: "inside",
    width: 600,
    height: 100,
    ...config,
  });
  axis.render();
  return labelText(axis);
}

const hundreds = ["300", "400", "500", "600", "700", "800", "900"];
const open = ["< 200", ...hundreds, "1k+"];

it("Axis rounding inside — the scale's own ticks open both ends", () => {
  assert.deepStrictEqual(axisLabels(), open);
});

it("Axis rounding inside — ticks ending below the last label leave its + alone", () => {
  assert.deepStrictEqual(
    axisLabels({ticks: [200, 400, 600, 800, 900]}),
    open,
    "900 is not the end while 1k is labeled",
  );
});

it("Axis rounding inside — ticks starting above the first label leave its prefix alone", () => {
  assert.deepStrictEqual(
    axisLabels({ticks: [300, 500, 700, 1000]}),
    open,
    "300 is not the end while 200 is labeled",
  );
});

it("Axis rounding inside — ticks ending at the last label keep its +", () => {
  assert.deepStrictEqual(axisLabels({ticks: [200, 400, 600, 800, 1000]}), open);
});

it("Axis rounding inside — a tick past the end labels leaves their affixes alone", () => {
  assert.deepStrictEqual(
    axisLabels({ticks: [200, 400, 600, 800, 1200]}),
    open,
    "1k is still the last label",
  );
  assert.deepStrictEqual(
    axisLabels({ticks: [0, 500, 1500]}),
    open,
    "both ends",
  );
});

it("Axis rounding inside — labels ending inside the data are open-ended", () => {
  const values = [200, 400, 600, 800, 900];
  assert.deepStrictEqual(axisLabels({ticks: values, labels: values}), [
    "< 200",
    "400",
    "600",
    "800",
    "900+",
  ]);
});

it("Axis rounding inside — labels past the data are not open-ended", () => {
  const above = [200, 400, 600, 800, 1200];
  assert.deepStrictEqual(
    axisLabels({ticks: above, labels: above}),
    ["< 200", "400", "600", "800", "1.2k"],
    "nothing reaches 1.2k",
  );
  const wide = [0, 500, 1500];
  assert.deepStrictEqual(
    axisLabels({ticks: wide, labels: wide}),
    ["0", "500", "1.5k"],
    "nothing reaches 0 or 1.5k",
  );
  const ends = [120, 500, 1040];
  assert.deepStrictEqual(
    axisLabels({ticks: ends, labels: ends}),
    ["< 120", "500", "1.04k+"],
    "labels at the data's own ends stay open",
  );
});

it("Axis rounding inside — the end labels are open-ended with ticks beyond them", () => {
  assert.deepStrictEqual(axisLabels({labels: [400, 600]}), ["< 400", "600+"]);
  assert.deepStrictEqual(
    axisLabels({labels: [200, 400, 600, 800]}),
    ["< 200", "400", "600", "800+"],
    "an unlabeled tick at 1k",
  );
});

it("Axis rounding inside — a descending domain opens the same labels", () => {
  assert.deepStrictEqual(
    axisLabels({domain: [1040, 120], ticks: [200, 400, 600, 800, 900]}),
    open,
  );
});

it("Axis rounding inside — the configured affixes land on the end labels", () => {
  assert.deepStrictEqual(
    axisLabels({
      ticks: [300, 500, 900],
      roundingInsideMinPrefix: "",
      roundingInsideMinSuffix: " or less",
      roundingInsideMaxPrefix: "over ",
      roundingInsideMaxSuffix: "",
    }),
    ["200 or less", ...hundreds, "over 1k"],
  );
});

it("Axis — other rounding modes add no affix", () => {
  for (const rounding of ["none", "outside"]) {
    const labels = axisLabels({rounding, ticks: [200, 400, 600, 800, 900]});
    assert.strictEqual(
      labels.some(text => /[<+]/.test(text)),
      false,
      `${rounding}: ${labels.join(", ")}`,
    );
  }
});

const values = [120, 300, 450, 640, 800, 950, 1040];

/** Renders a 600px ColorScale over `values` and returns its axis's labels. */
async function scaleLabels(config = {}, axisConfig = {}) {
  const scale = new ColorScale().config({
    data: values.map(value => ({value})),
    duration: 0,
    width: 600,
    height: 100,
    ...config,
    axisConfig: {rounding: "inside", ...axisConfig},
  });
  await new Promise(done => scale.render(done));
  return labelText(scale._axisClass);
}

it("ColorScale gradient — ticks alone keep the affixes on the end labels", async () => {
  const gradient = {scale: "linear"};
  assert.deepStrictEqual(await scaleLabels(gradient), open);
  assert.deepStrictEqual(
    await scaleLabels(gradient, {ticks: [200, 400, 600, 800, 900]}),
    open,
    "ticks ending below the last label",
  );
  assert.deepStrictEqual(
    await scaleLabels(gradient, {ticks: [200, 400, 600, 800, 1000]}),
    open,
    "ticks ending at the last label",
  );
  assert.deepStrictEqual(
    await scaleLabels(gradient, {ticks: [200, 400, 600, 800, 1200]}),
    open,
    "a tick past the last label",
  );
});

it("ColorScale gradient — ticks and labels together open the labels the data reaches", async () => {
  const gradient = {scale: "linear"};
  const below = [200, 400, 600, 800, 900];
  assert.deepStrictEqual(
    await scaleLabels(gradient, {ticks: below, labels: below}),
    ["< 200", "400", "600", "800", "900+"],
  );
  const above = [200, 400, 600, 800, 1200];
  assert.deepStrictEqual(
    await scaleLabels(gradient, {ticks: above, labels: above}),
    ["< 200", "400", "600", "800", "1.2k"],
  );
});

it("ColorScale gradient — a vertical scale opens the same labels", async () => {
  assert.deepStrictEqual(
    await scaleLabels(
      {scale: "linear", orient: "right", width: 100, height: 600},
      {ticks: [200, 400, 600, 800, 900]},
    ),
    open,
  );
});

it("ColorScale bucketAxis — ticks alone keep the affixes on the end buckets", async () => {
  const jenks = {scale: "jenks", bucketAxis: true};
  const jenksLabels = ["< 120", "300", "640", "800", "950+"];
  assert.deepStrictEqual(await scaleLabels(jenks), jenksLabels);
  const buckets = {scale: "buckets", bucketAxis: true};
  const bucketLabels = ["< 120", "350", "580", "810", "1.04k+"];
  assert.deepStrictEqual(await scaleLabels(buckets), bucketLabels);
  const inside = [200, 400, 600, 800, 900];
  assert.deepStrictEqual(
    await scaleLabels(jenks, {ticks: inside}),
    jenksLabels,
    "jenks, ticks ending below the last bucket",
  );
  assert.deepStrictEqual(
    await scaleLabels(buckets, {ticks: inside}),
    bucketLabels,
    "buckets, ticks ending below the last bucket",
  );
  for (const ticks of [
    [200, 400, 600, 800, 1000],
    [120, 400, 600, 800, 1040],
  ]) {
    assert.deepStrictEqual(
      await scaleLabels(jenks, {ticks}),
      jenksLabels,
      `jenks, a tick past the last bucket's label: ${ticks}`,
    );
    assert.deepStrictEqual(
      await scaleLabels(buckets, {ticks}),
      bucketLabels,
      `buckets, ticks up to the last label: ${ticks}`,
    );
  }
});
