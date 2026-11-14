import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {BumpChart} from "../../index.ts";
import {
  BAND_SCALE_PADDING,
  bumpBandAxisPadding,
  bumpBandMax,
  bumpBandThickness,
  bumpBandValue,
  bumpChartDef,
  bumpRankStep,
  bumpSharedTooltipValue,
  bumpSizeName,
  bumpSizeText,
  bumpSizeTooltipRows,
} from "../../internal.ts";
import {fieldAccessor} from "../../src/utils/fieldAccessor.ts";

useJsdom();

/** A stand-in viz holding what the band helpers read. */
const fake = ({schema = {}, ...rest} = {}) => ({
  schema: {
    locale: "en-US",
    translate: d => (d === "Value" ? "Valor" : d),
    bandPadding: 0.25,
    ...schema,
  },
  ctx: {},
  _size: fieldAccessor("hours"),
  _sizeKey: "hours",
  ...rest,
});

it("bumpBandValue reads a Plot row's size, 0 when missing or negative", () => {
  const viz = fake();
  assert.strictEqual(bumpBandValue(viz, {data: {hours: 12}, i: 0}), 12);
  assert.strictEqual(bumpBandValue(viz, {hours: "7"}), 7, "an unwrapped row");
  assert.strictEqual(bumpBandValue(viz, {data: {hours: -3}}), 0);
  assert.strictEqual(bumpBandValue(viz, {data: {hours: "n/a"}}), 0);
  assert.strictEqual(bumpBandValue(viz, {data: {}}), 0);
  assert.strictEqual(bumpBandValue(fake({_size: undefined}), {hours: 4}), 0);
});

it("bumpRankStep is the smallest gap between rank positions", () => {
  assert.strictEqual(bumpRankStep([10, 50, 30, 30, 90], 400), 20);
  assert.strictEqual(bumpRankStep([90, 10], 400), 80);
  assert.strictEqual(bumpRankStep([42], 120), 120, "one rank");
  assert.strictEqual(bumpRankStep([], -60), 60);
  assert.strictEqual(bumpRankStep([NaN, 5, 15], 400), 10);
});

it("bumpBandThickness is linear from zero, the largest filling its slot less bandPadding", () => {
  const t = bumpBandThickness(200, 40, 0.25);
  assert.strictEqual(t(200), 30);
  assert.strictEqual(t(100), 15);
  assert.strictEqual(t(0), 0);
  assert.strictEqual(t(-5), 0);
  assert.strictEqual(t(400), 30, "capped at the slot");
  assert.strictEqual(bumpBandThickness(10, 40, 0)(10), 40);
  assert.strictEqual(
    bumpBandThickness(10, 40, 2)(10),
    0,
    "padding clamps to 1",
  );
  assert.strictEqual(bumpBandThickness(10, 40, -1)(10), 40, "and to 0");
  assert.strictEqual(bumpBandThickness(10, 40, NaN)(10), 40);
  assert.strictEqual(bumpBandThickness(0, 40, 0.25)(10), 0, "nothing sized");
});

it("bumpBandMax reads the shared small-multiples scale, else the rows", () => {
  const rows = [{data: {hours: 3}}, {data: {hours: 9}}, {data: {hours: -20}}];
  assert.strictEqual(bumpBandMax(fake(), rows), 9);
  const shared = fake({
    _plotFacetScales: {size: scaleLinear().domain([1, 50])},
  });
  assert.strictEqual(bumpBandMax(shared, rows), 50);
  assert.strictEqual(bumpBandMax(fake(), []), 0);
});

it("bumpBandAxisPadding pads the rank axes while bands draw, and takes it back off", () => {
  const viz = fake({_yConfig: {tickFormat: String}, _y2Config: undefined});
  bumpBandAxisPadding(viz);
  assert.strictEqual(viz._yConfig.scalePadding, BAND_SCALE_PADDING);
  assert.strictEqual(viz._y2Config.scalePadding, BAND_SCALE_PADDING);
  assert.strictEqual(typeof viz._yConfig.tickFormat, "function");
  viz._size = undefined;
  bumpBandAxisPadding(viz);
  assert.ok(!("scalePadding" in viz._yConfig), "lines draw unpadded");
  assert.ok(!("scalePadding" in viz._y2Config));

  const user = fake({_yConfig: {scalePadding: 0.1}, _y2Config: {}});
  bumpBandAxisPadding(user);
  assert.strictEqual(
    user._yConfig.scalePadding,
    0.1,
    "the user's padding stays",
  );
  user._size = undefined;
  bumpBandAxisPadding(user);
  assert.strictEqual(user._yConfig.scalePadding, 0.1);
  assert.ok(!("scalePadding" in user._y2Config));
});

it("bumpSizeName and bumpSizeText name and format a row's size", () => {
  assert.strictEqual(bumpSizeName(fake()), "hours");
  assert.strictEqual(bumpSizeName(fake({_sizeKey: undefined})), "Valor");
  const viz = fake();
  assert.strictEqual(bumpSizeText(viz, {hours: 1250}, 0), "1.25k");
  assert.strictEqual(bumpSizeText(viz, {hours: -4}, 0), "-4");
  assert.strictEqual(bumpSizeText(viz, {hours: null}, 0), undefined);
  assert.strictEqual(bumpSizeText(viz, {hours: ""}, 0), undefined);
  assert.strictEqual(bumpSizeText(viz, {}, 0), undefined);
  assert.strictEqual(
    bumpSizeText(fake({_size: undefined}), {hours: 1}, 0),
    undefined,
  );
  assert.strictEqual(bumpSizeText(viz, null, 0), undefined);
});

it("bumpSharedTooltipValue titles the shared column by the size key", () => {
  assert.strictEqual(
    bumpSharedTooltipValue(fake({_size: undefined})),
    undefined,
  );
  const own = bumpSharedTooltipValue(fake());
  assert.strictEqual(own.title, "hours");
  assert.strictEqual(own.value({hours: 30}, 0), "30");
  assert.strictEqual(own.value({}, 0), "");
});

it("bumpSizeTooltipRows lists a band's size under its key", () => {
  assert.deepStrictEqual(bumpSizeTooltipRows(fake(), {hours: 5}, 0), [
    ["hours", "5"],
  ]);
  assert.deepStrictEqual(bumpSizeTooltipRows(fake(), {}, 0), []);
  assert.deepStrictEqual(
    bumpSizeTooltipRows(fake({_size: undefined}), {hours: 5}, 0),
    [],
  );
});

it("BumpChart draws Lines, or Areas once size is set", () => {
  const chart = new BumpChart();
  assert.strictEqual(chart.shape()({}, 0), "Line");
  chart.size("value");
  assert.strictEqual(chart.shape()({}, 0), "Area");
  chart.size(false);
  assert.strictEqual(chart.shape()({}, 0), "Line");
  assert.strictEqual(chart.bandPadding(), 0.25);
  assert.deepStrictEqual(chart.tooltipConfig().tbody({value: 1}, 0), []);
  chart.size("value");
  assert.deepStrictEqual(chart.tooltipConfig().tbody({value: 1}, 0), [
    ["value", "1"],
  ]);
  assert.strictEqual(chart._sharedTooltipValue().title, "value");
  assert.strictEqual(bumpChartDef.name, "BumpChart");
});
