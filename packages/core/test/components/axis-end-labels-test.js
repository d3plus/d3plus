import assert from "assert";
import {Axis} from "../../es/index.js";
import {scaleLinear} from "d3-scale";
import {
  END_LABEL_MIN_SPACING,
  END_LABEL_MIN_TICKS,
  addDomainEnds,
  crowdsEndLabel,
  isNegative,
} from "../../es/src/components/Axis/axisEndLabels.js";
import it from "../jsdom.js";

const identity = d => d;
const year = d => (d instanceof Date ? d.getFullYear() : d);

/** Renders a standalone axis and returns its label and tick values. */
function layout(axis, width = 600) {
  window.SVGElement.prototype.getTotalLength = () => 0;
  window.SVGElement.prototype.getPointAtLength = () => ({x: 0, y: 0});
  axis.width(width).render();
  return {
    labels: axis._getLabels().map(year),
    ticks: axis._getTicks().map(year),
  };
}

it("crowdsEndLabel — thresholds", () => {
  assert.strictEqual(END_LABEL_MIN_SPACING, 0.5);
  assert.strictEqual(END_LABEL_MIN_TICKS, 3);
  const regular = [60, 70, 80];
  assert.strictEqual(
    crowdsEndLabel(59, regular, identity),
    true,
    "close start end is crowded",
  );
  assert.strictEqual(
    crowdsEndLabel(52, regular, identity),
    false,
    "far start end keeps its label",
  );
  assert.strictEqual(
    crowdsEndLabel(86, regular, identity),
    false,
    "far finish end keeps its label",
  );
  assert.strictEqual(
    crowdsEndLabel(83, regular, identity),
    true,
    "close finish end is crowded",
  );
  assert.strictEqual(
    crowdsEndLabel(55, regular, identity),
    true,
    "exactly half the spacing is crowded",
  );
  assert.strictEqual(
    crowdsEndLabel(54.9, regular, identity),
    false,
    "just past half keeps its label",
  );
  assert.strictEqual(
    crowdsEndLabel(52, regular, identity, 0.9),
    true,
    "minSpacing is respected",
  );
});

it("crowdsEndLabel — inverted, negative, and uneven positions", () => {
  const inverted = d => 600 - d * 5;
  assert.strictEqual(
    crowdsEndLabel(59, [80, 70, 60], inverted),
    true,
    "inverted range, close end",
  );
  assert.strictEqual(
    crowdsEndLabel(52, [80, 70, 60], inverted),
    false,
    "inverted range, far end",
  );
  const negative = [-1.2e6, -8e5, -4e5, 0, 4e5, 8e5, 1.2e6];
  assert.strictEqual(
    crowdsEndLabel(-1.4e6, negative, identity),
    true,
    "negative end at half spacing",
  );
  assert.strictEqual(
    crowdsEndLabel(1.4e6, negative, identity),
    true,
    "positive end at half spacing",
  );
  assert.strictEqual(
    crowdsEndLabel(-10500, [-10000, -9000, -8000], identity),
    true,
    "negative domain",
  );
  // spacing is measured between the two regular ticks nearest the end
  const log = d => Math.log10(d) * 100;
  assert.strictEqual(
    crowdsEndLabel(120000, [10, 100, 1e3, 1e4, 1e5], log),
    true,
    "log, close end",
  );
  assert.strictEqual(
    crowdsEndLabel(3, [10, 100, 1e3, 1e4, 1e5], log),
    false,
    "log, far end",
  );
});

it("crowdsEndLabel — too few ticks or unmeasurable positions keep the label", () => {
  assert.strictEqual(
    crowdsEndLabel(59, [60, 70], identity),
    false,
    "two regular ticks",
  );
  assert.strictEqual(
    crowdsEndLabel(59, [60], identity),
    false,
    "one regular tick",
  );
  assert.strictEqual(
    crowdsEndLabel(59, [], identity),
    false,
    "no regular ticks",
  );
  assert.strictEqual(
    crowdsEndLabel(59, [60, 60, 60], identity),
    false,
    "zero spacing",
  );
  assert.strictEqual(
    crowdsEndLabel(0, [1, 10, 100], Math.log10),
    false,
    "non-finite position",
  );
});

it("isNegative — catches -0", () => {
  assert.strictEqual(isNegative(-1), true);
  assert.strictEqual(isNegative(-0), true);
  assert.strictEqual(isNegative(0), false);
  assert.strictEqual(isNegative(1), false);
});

it("addDomainEnds — tick and label passes", () => {
  const stub = (schema = {}, negative = null) => ({
    schema: {domainTicks: true, scale: "linear", ...schema},
    _d3ScaleNegative: negative,
  });
  const scale = scaleLinear().domain([59, 86]).range([0, 600]);
  const domain = [59, 86];
  assert.deepStrictEqual(
    addDomainEnds(stub(), [60, 70, 80], domain, scale, false),
    [59, 60, 70, 80, 86],
    "the tick pass always adds both ends",
  );
  assert.deepStrictEqual(
    addDomainEnds(stub(), [60, 70, 80], domain, scale, true),
    [60, 70, 80, 86],
    "the label pass leaves out the crowded end",
  );
  assert.deepStrictEqual(
    addDomainEnds(stub({ticks: [59, 70]}), [60, 70, 80], domain, scale, true),
    [59, 60, 70, 80, 86],
    "an end the user lists in ticks keeps its label",
  );
  assert.deepStrictEqual(
    addDomainEnds(
      stub({domainTicks: false}),
      [60, 70, 80],
      domain,
      scale,
      true,
    ),
    [60, 70, 80],
    "domainTicks(false) adds nothing",
  );
  const nice = scaleLinear().domain([60, 80]).range([0, 600]);
  assert.deepStrictEqual(
    addDomainEnds(stub(), [60, 70, 80], [60, 80], nice, true),
    [60, 70, 80],
    "ends already on a tick are not repeated",
  );
  const inverted = scaleLinear().domain([86, 59]).range([0, 600]);
  assert.deepStrictEqual(
    addDomainEnds(stub(), [80, 70, 60], [86, 59], inverted, true),
    [86, 80, 70, 60],
    "inverted domains judge each end against its own neighbor",
  );
  const positive = scaleLinear().domain([-5, 1000]).range([0, 600]);
  assert.deepStrictEqual(
    addDomainEnds(
      stub({}, positive),
      [10, 100, 1000],
      [-5, 1000],
      positive,
      false,
    ),
    [10, 100, 1000],
    "a split scale's half only receives ends of its own sign",
  );
});

it("Axis — a crowded domain end keeps its tick but drops its label", () => {
  const {labels, ticks} = layout(new Axis().domain([59, 86]));
  assert.ok(!labels.includes(59), `59 has no label (${labels})`);
  assert.ok(labels.includes(60), "the nice neighbor keeps its label");
  assert.ok(ticks.includes(59), "59 keeps its tick mark");
  assert.ok(
    !labels.includes(86) && ticks.includes(86),
    "86 sits half a spacing from 84",
  );
});

it("Axis — a domain end far from its neighbor keeps its label", () => {
  const {labels} = layout(new Axis().domain([-12, 100]));
  assert.deepStrictEqual(labels, [-12, 0, 20, 40, 60, 80, 100]);
});

it("Axis — both ends of a symmetric domain", () => {
  const {labels, ticks} = layout(new Axis().domain([-1.4e6, 1.4e6]));
  assert.deepStrictEqual(labels, [-1.2e6, -8e5, -4e5, 0, 4e5, 8e5, 1.2e6]);
  assert.ok(
    ticks.includes(-1.4e6) && ticks.includes(1.4e6),
    "both ends keep their ticks",
  );
});

it("Axis — inverted and negative domains", () => {
  const inverted = layout(new Axis().domain([86, 59]));
  assert.deepStrictEqual(inverted.labels, [84, 80, 76, 72, 68, 64, 60]);
  assert.ok(
    inverted.ticks.includes(86) && inverted.ticks.includes(59),
    "inverted ends keep ticks",
  );

  const negative = layout(new Axis().domain([-10500, -1000]));
  assert.strictEqual(
    negative.labels[0],
    -10000,
    "the nice tick wins over -10500",
  );
  assert.ok(negative.ticks.includes(-10500), "-10500 keeps its tick");
});

it("Axis — log and time scales", () => {
  const log = layout(new Axis().domain([3, 120000]).scale("log"));
  assert.deepStrictEqual(log.labels, [3, 10, 100, 1000, 10000, 100000]);
  assert.ok(log.ticks.includes(120000), "120000 keeps its tick");

  const logNegative = layout(new Axis().domain([-120000, -3]).scale("log"));
  assert.deepStrictEqual(
    logNegative.labels,
    [-100000, -10000, -1000, -100, -10, -3],
  );

  const years = Array.from({length: 17}, (_, i) => new Date(2004 + i, 0, 1));
  const time = layout(
    new Axis().domain([years[0], years[16]]).data(years).scale("time"),
    300,
  );
  assert.deepStrictEqual(time.labels, [2005, 2010, 2015, 2020]);
  assert.ok(time.ticks.includes(2004), "2004 keeps its tick");
});

it("Axis — domains that end on nice ticks are untouched", () => {
  const {labels} = layout(new Axis().domain([0, 100]));
  assert.deepStrictEqual(labels, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  const band = new Axis()
    .domain(["a", "b", "c"])
    .scale("band")
    .width(600)
    .render();
  const bandLabels = band._tickShape._data.filter(d => d.text).map(d => d.id);
  assert.deepStrictEqual(
    [...new Set(bandLabels)],
    ["a", "b", "c"],
    "discrete scales are untouched",
  );
});

it("Axis — user-supplied ticks and labels are respected", () => {
  const userTicks = layout(
    new Axis().domain([59, 86]).ticks([59, 60, 70, 80, 86]),
  );
  assert.ok(
    userTicks.labels.includes(59) && userTicks.labels.includes(86),
    "user ticks keep their labels",
  );

  const axis = new Axis().domain([59, 86]).labels([59, 60, 70, 80]);
  layout(axis);
  const shown = axis._tickShape._data.filter(d => d.text).map(d => d.id);
  assert.deepStrictEqual(
    [...new Set(shown)],
    [59, 60, 70, 80],
    "user labels are drawn as given",
  );
});

it("Axis — domainTicks(false) and too few regular ticks", () => {
  const off = layout(new Axis().domain([59, 86]).domainTicks(false));
  assert.ok(
    !off.labels.includes(59) && !off.ticks.includes(59),
    "no forced ends at all",
  );

  const few = layout(new Axis().domain([3, 120]).scale("log"));
  assert.deepStrictEqual(
    few.labels,
    [3, 10, 100, 120],
    "two regular ticks keep both ends",
  );
});
