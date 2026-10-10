import assert from "assert";
import {Axis, ColorScale, LinePlot, Plot} from "../../es/index.js";
import {axisIsYearLike, formatYear, isYearLike} from "../../es/src/components/Axis/yearValues.js";
import {axisValue} from "../../es/src/charts/Plot/sharedTooltip.js";
import it from "../jsdom.js";

/** The labels an axis draws for its visible ticks with its default formatter. */
const tickLabels = axis => axis._visibleTicks.map(axis._labelFormat);

it("isYearLike — whole numbers from 1000 through 2999", () => {
  assert.strictEqual(isYearLike([1990, 2000, 2020]), true);
  assert.strictEqual(isYearLike([2024]), true);
  assert.strictEqual(isYearLike([1000, 2999]), true, "both bounds count");
  assert.strictEqual(isYearLike([999]), false, "below the range");
  assert.strictEqual(isYearLike([3000]), false, "above the range");
  assert.strictEqual(isYearLike([12000]), false);
  assert.strictEqual(isYearLike([1500.5]), false, "a fractional value");
  assert.strictEqual(isYearLike([-1990, -1980]), false, "negative values");
  assert.strictEqual(isYearLike([999, 1000]), false, "mixed: one out of range");
  assert.strictEqual(isYearLike([1990, 12000]), false, "mixed: one out of range");
  assert.strictEqual(isYearLike([1990, 1990.5]), false, "mixed: one fractional");
  assert.strictEqual(isYearLike([0, 1990]), false, "mixed: a zero baseline");
  assert.strictEqual(isYearLike([]), false, "an empty set");
  assert.strictEqual(isYearLike(["1990", 2000]), false, "strings");
  assert.strictEqual(isYearLike([new Date(1990, 0, 1)]), false, "Dates");
  assert.strictEqual(isYearLike([NaN, 1990]), false);
  assert.strictEqual(isYearLike([null, 1990]), false);
});

it("axisIsYearLike — year data inside a domain within the year range", () => {
  const axis = (domain, data = []) => ({schema: {domain}, _scaleData: data});
  assert.strictEqual(axisIsYearLike(axis([1970, 1982])), true, "a year domain with no data");
  assert.strictEqual(
    axisIsYearLike(axis([1989.0000000000002, 2021.0333], [1990, 2005, 2020])),
    true,
    "a padded domain around year data",
  );
  assert.strictEqual(axisIsYearLike(axis([1970.5, 1982])), false, "a fractional domain with no data");
  assert.strictEqual(axisIsYearLike(axis([0, 2000], [1500, 1800])), false, "a domain from a zero baseline");
  assert.strictEqual(axisIsYearLike(axis([1000, 3000], [1500, 2500])), false, "a domain past the range");
  assert.strictEqual(axisIsYearLike(axis([1000, 2000], [1500.5, 1800])), false, "fractional data");
  assert.strictEqual(axisIsYearLike(axis([1990, 2020], [1990, 12000])), false, "mixed data");
  assert.strictEqual(axisIsYearLike(axis([-2000, -1000])), false, "negative values");
  assert.strictEqual(axisIsYearLike(axis([])), false, "an empty domain");
  assert.strictEqual(axisIsYearLike(axis(["a", "b"], [1990])), false, "a category domain");
});

it("formatYear — the number in full, with no separator or suffix", () => {
  assert.strictEqual(formatYear(1990), "1990");
  assert.strictEqual(formatYear(2024), "2024");
  assert.strictEqual(formatYear(1000), "1000");
  assert.strictEqual(formatYear(12000), "12000");
  assert.strictEqual(formatYear(1500.5), "1500.5", "keeps decimals");
  assert.strictEqual(formatYear(1989.0000000000002), "1989", "drops float noise");
  assert.strictEqual(formatYear(-1990), "-1990");
  assert.strictEqual(formatYear(2019.5, "es-ES"), "2019,5", "uses the locale's decimal mark");
});

it("Axis — labels a year domain in full", () => {
  const years = new Axis().domain([1970, 1982]).render();
  assert.deepStrictEqual(
    tickLabels(years),
    ["1970", "1971", "1972", "1973", "1974", "1975", "1976", "1977", "1978", "1979", "1980", "1981", "1982"],
  );

  const data = new Axis().domain([1950, 2020]).render();
  assert.ok(
    tickLabels(data).every(d => /^(19|20)\d\d$/.test(d)),
    `ticks print as years: ${tickLabels(data)}`,
  );
});

it("Axis — still abbreviates thousands outside a year domain", () => {
  const counts = new Axis().domain([0, 2000]).render();
  assert.ok(tickLabels(counts).includes("1.6k"), `a zero-based domain: ${tickLabels(counts)}`);
  assert.ok(tickLabels(counts).includes("2k"));

  const wide = new Axis().domain([1000, 12000]).render();
  assert.ok(tickLabels(wide).includes("12k"), `a domain past the year range: ${tickLabels(wide)}`);

  const fractional = new Axis().domain([1500.5, 2500]).render();
  assert.ok(
    tickLabels(fractional).some(d => /k$/.test(d)),
    `a fractional domain: ${tickLabels(fractional)}`,
  );

  const custom = new Axis().domain([1970, 1982]).tickFormat(d => `y${d}`).render();
  assert.strictEqual(tickLabels(custom)[0], "y1970", "a tickFormat still wins");
});

it("ColorScale — bucket labels print years in full", () => {
  const years = [1990, 1995, 2000, 2005, 2010, 2015, 2020];
  const format = new ColorScale().bucketFormat();
  assert.strictEqual(format(2020, 2, [1990, 2005, 2020], years), "2020");
  assert.strictEqual(format(1990, 0, [1990, 2005, 2020], years), "1990 - 2000");

  const counts = [1200, 1500, 1800, 2400];
  assert.strictEqual(format(2400, 1, [1200, 2400], [0, ...counts]), "2.4k", "counts still abbreviate");
});

it("Plot tooltip values — a continuous year axis prints years in full", () => {
  const viz = new Plot().discrete("y");
  viz._xAxis = new Axis().domain([1989.5, 2020.5]);
  viz._xAxis._scaleData = [1990, 2005, 2020];
  viz._yAxis = new Axis().domain([0, 2000]);
  viz._yAxis._scaleData = [1500];
  assert.strictEqual(axisValue(viz, "x", 1990), "1990");
  assert.strictEqual(axisValue(viz, "y", "A"), "A", "the discrete axis prints as-is");

  const line = new LinePlot();
  line._yAxis = new Axis().domain([0, 2000]);
  line._yAxis._scaleData = [1500];
  assert.strictEqual(axisValue(line, "y", 1500), "1.5k", "a value axis still abbreviates");
});
