import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {
  configOpenDomain,
  hasOpenUserEnd,
  hasUserDomain,
  isOneSided,
  openEnd,
  openEndAxisConfig,
  roundedDomain,
  roundOpenEnd,
  roundPlotOpenEnds,
  userAxisDomain,
} from "../../internal.ts";
import {Axis} from "../../index.ts";

useJsdom();

/**
    A one-sided user domain pins only the end the user set; Plot fills the
    other from the data and rounds it where the axis would with no user
    domain (see `Plot/openDomainEnds.ts`).
*/

const stub = (schema = {}, extra = {}) => ({
  schema: {baseline: 0, discrete: "x", ...schema},
  _xConfig: {},
  _yConfig: {},
  ...extra,
});

it("roundedDomain rounds exactly as an Axis does", () => {
  assert.deepStrictEqual(
    roundedDomain([0, 1024], "outside", "linear"),
    [0, 1030],
  );
  assert.deepStrictEqual(
    roundedDomain([990, 1024], "outside", "linear"),
    [950, 1050],
  );
  assert.deepStrictEqual(
    roundedDomain([0, 1024], "inside", "linear"),
    [0, 1020],
  );
  assert.deepStrictEqual(
    roundedDomain([-124, -90], "outside", "linear"),
    [-130, -90],
  );
  assert.deepStrictEqual(
    roundedDomain([100, 5000], "outside", "log"),
    [100, 10000],
  );
  assert.strictEqual(
    roundedDomain([0, 1024], "outside", "time"),
    undefined,
    "time axes aren't rounded",
  );
  for (const [domain, rounding] of [
    [[0, 1024], "outside"],
    [[990, 1024], "outside"],
    [[0, 1024], "inside"],
    [[0.12, 0.87], "outside"],
  ]) {
    const axis = new Axis()
      .domain(domain)
      .rounding(rounding)
      .range([0, 400])
      .measure();
    assert.deepStrictEqual(
      roundedDomain(domain, rounding, "linear"),
      axis._d3Scale.domain(),
      `${domain} ${rounding}`,
    );
  }
});

it("isOneSided is true only when exactly one end is set", () => {
  assert.strictEqual(isOneSided([980]), true);
  assert.strictEqual(isOneSided([undefined, -80]), true);
  assert.strictEqual(isOneSided([null, 5]), true);
  assert.strictEqual(isOneSided([980, 1024]), false);
  assert.strictEqual(isOneSided([undefined, undefined]), false);
  assert.strictEqual(isOneSided([]), false);
  assert.strictEqual(isOneSided(["A", "B", "C"]), false, "a category list");
  assert.strictEqual(isOneSided(undefined), false);
});

it("configOpenDomain reads a one-sided axis-config domain, low end first", () => {
  // `yConfig` stores its domain reversed: `yConfig({domain: [980, undefined]})` keeps `[undefined, 980]`.
  assert.deepStrictEqual(
    configOpenDomain(stub({}, {_yConfig: {domain: [undefined, 980]}}), "y"),
    [980, undefined],
  );
  assert.deepStrictEqual(
    configOpenDomain(stub({}, {_yConfig: {domain: [980]}}), "y"),
    [980],
  );
  assert.deepStrictEqual(
    configOpenDomain(stub({discrete: "y"}, {_xConfig: {domain: [980]}}), "x"),
    [980],
  );
  assert.strictEqual(
    configOpenDomain(stub({}, {_yConfig: {domain: [1100, 960]}}), "y"),
    undefined,
    "a full domain",
  );
  assert.strictEqual(
    configOpenDomain(stub({}, {_xConfig: {domain: [2017]}}), "x"),
    undefined,
    "the discrete axis",
  );
  assert.strictEqual(
    configOpenDomain(stub({}, {_y2Config: {domain: [980]}}), "y2"),
    undefined,
    "only x and y",
  );
});

it("hasOpenUserEnd: a one-sided domain or a baseline alone leaves an end open", () => {
  assert.strictEqual(hasOpenUserEnd(stub({yDomain: [980]}), "y"), true);
  assert.strictEqual(
    hasOpenUserEnd(stub({yDomain: [undefined, -80]}), "y"),
    true,
  );
  assert.strictEqual(hasOpenUserEnd(stub({yDomain: [980, 1024]}), "y"), false);
  assert.strictEqual(
    hasOpenUserEnd(stub({}, {_userBaseline: 980}), "y"),
    true,
    "a baseline",
  );
  assert.strictEqual(
    hasOpenUserEnd(stub({}, {_yConfig: {domain: [980]}}), "y"),
    true,
    "a one-sided yConfig domain",
  );
  assert.strictEqual(
    hasOpenUserEnd(
      stub({yDomain: [980]}, {_yConfig: {domain: [1100, 960]}}),
      "y",
    ),
    false,
    "a full yConfig domain wins",
  );
  assert.strictEqual(hasOpenUserEnd(stub(), "y"), false);
  assert.strictEqual(
    hasUserDomain(stub({}, {_yConfig: {domain: [980]}}), "y"),
    true,
    "a one-sided yConfig domain is a user domain",
  );
  assert.deepStrictEqual(
    userAxisDomain(stub({}, {_yConfig: {domain: [980]}}), "y", [990, 1024]),
    [980],
  );
});

it("openEndAxisConfig hands the axis no rounding or one-sided domain of the user's", () => {
  assert.deepStrictEqual(
    openEndAxisConfig(
      stub({yDomain: [980]}, {_yConfig: {rounding: "inside", title: "t"}}),
      "y",
    ),
    {title: "t"},
  );
  assert.deepStrictEqual(
    openEndAxisConfig(
      stub({}, {_yConfig: {domain: [980], rounding: "none"}}),
      "y",
    ),
    {},
  );
  const full = {domain: [1100, 960], rounding: "outside"};
  assert.strictEqual(
    openEndAxisConfig(stub({}, {_yConfig: full}), "y"),
    full,
    "a full domain passes through",
  );
  const none = {rounding: "inside"};
  assert.strictEqual(
    openEndAxisConfig(stub({}, {_yConfig: none}), "y"),
    none,
    "no user domain",
  );
});

it("openEnd records the set end and the domain without one", () => {
  assert.deepStrictEqual(
    openEnd([980], [990, 1024], 0),
    {pinned: [true, false], auto: [0, 1024]},
    "stretched to the baseline",
  );
  assert.deepStrictEqual(openEnd([980], [990, 1024], undefined), {
    pinned: [true, false],
    auto: [990, 1024],
  });
  assert.deepStrictEqual(openEnd([undefined, -80], [-124, -90], undefined), {
    pinned: [false, true],
    auto: [-124, -90],
  });
  assert.deepStrictEqual(
    openEnd([undefined, -80], [-124, -90], 0).auto,
    [-124, 0],
  );
  assert.strictEqual(
    openEnd([980, 1024], [990, 1024], 0),
    undefined,
    "both ends set",
  );
  assert.strictEqual(
    openEnd(undefined, [990, 1024], 0),
    undefined,
    "no user domain",
  );
});

it("roundOpenEnd rounds only the open end, where the axis would with no domain", () => {
  const lo = {pinned: [true, false], auto: [0, 1024]};
  assert.deepStrictEqual(
    roundOpenEnd([980, 1024], lo, "outside", "linear"),
    [980, 1030],
  );
  assert.deepStrictEqual(
    roundOpenEnd([980, 1024], lo, "inside", "linear"),
    [980, 1020],
  );
  assert.deepStrictEqual(
    roundOpenEnd(
      [980, 1024],
      {pinned: [true, false], auto: [990, 1024]},
      "outside",
      "linear",
    ),
    [980, 1050],
  );
  const hi = {pinned: [false, true], auto: [-124, -90]};
  assert.deepStrictEqual(
    roundOpenEnd([-124, -80], hi, "outside", "linear"),
    [-130, -80],
  );
  assert.strictEqual(
    roundOpenEnd([1100, 1024], lo, "outside", "linear"),
    undefined,
    "never crosses the pinned end",
  );
  assert.strictEqual(
    roundOpenEnd([980, 1024], lo, "outside", "time"),
    undefined,
  );
});

it("roundPlotOpenEnds rounds the scales' open ends, honoring the axis's rounding", () => {
  const scales = () => ({
    x: scaleLinear().domain([0, 3]),
    y: scaleLinear().domain([1024, 980]),
    x2: scaleLinear(),
    y2: scaleLinear(),
  });
  const configScales = {
    xConfigScale: "linear",
    yConfigScale: "linear",
    x2ConfigScale: "linear",
    y2ConfigScale: "linear",
  };
  const plotOpenEnds = {y: {pinned: [true, false], auto: [0, 1024]}};
  const run = viz =>
    roundPlotOpenEnds({
      viz,
      plotScales: scales(),
      plotConfigScales: configScales,
      plotOpenEnds,
    }).plotScales;
  assert.deepStrictEqual(
    run(stub()).y.domain(),
    [1030, 980],
    "the y scale runs high to low",
  );
  assert.deepStrictEqual(run(stub()).x.domain(), [0, 3], "no open end on x");
  assert.deepStrictEqual(
    run(stub({}, {_yConfig: {rounding: "inside"}})).y.domain(),
    [1020, 980],
  );
  assert.deepStrictEqual(
    run(stub({}, {_yConfig: {rounding: "none"}})).y.domain(),
    [1024, 980],
    "rounding off",
  );
  const chartNone = {_plotAxisDefaults: {y: {rounding: "none"}}};
  assert.deepStrictEqual(
    run(stub({}, chartNone)).y.domain(),
    [1024, 980],
    "the chart's own rounding",
  );
  assert.deepStrictEqual(
    run(stub({}, {...chartNone, _yConfig: {rounding: "outside"}})).y.domain(),
    [1030, 980],
    "the user's rounding wins over the chart's",
  );
  const time = roundPlotOpenEnds({
    viz: stub(),
    plotScales: scales(),
    plotConfigScales: {...configScales, yConfigScale: "time"},
    plotOpenEnds,
  });
  assert.deepStrictEqual(
    time.plotScales.y.domain(),
    [1024, 980],
    "a time axis",
  );
  assert.deepStrictEqual(
    roundPlotOpenEnds({viz: stub()}),
    {},
    "nothing to round",
  );
});
