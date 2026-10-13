import assert from "assert";
import it from "../jsdom.js";
import {baselineDomainAxis, hasUserDomain, userAxisDomain, userDomainBreaksBaseline} from "../../es/internal.js";
import {AreaPlot, BarChart, Histogram, LinePlot, RESET} from "../../es/index.js";

/**
    A set `baseline` fills the open end of the value domain, like
    `yDomain([n])` (see `Plot/baselineDomain.ts`); the chart's own baseline
    (`schema.baseline`, where bars start) is left alone.
*/

const stub = (schema, extra = {}) => ({
  schema: {baseline: 0, discrete: "x", ...schema},
  _userBaseline: 980,
  _xConfig: {},
  _yConfig: {},
  ...extra,
});

it("baselineDomainAxis is the value axis, once a baseline is set", () => {
  assert.strictEqual(baselineDomainAxis(stub({})), "y");
  assert.strictEqual(baselineDomainAxis(stub({discrete: "y"})), "x", "horizontal charts bound x");
  assert.strictEqual(baselineDomainAxis(stub({}, {_swarm: {axis: "x"}})), "x", "a swarm's value axis");
  assert.strictEqual(baselineDomainAxis(stub({}, {_userBaseline: undefined})), undefined, "only the chart's own baseline");
  assert.strictEqual(baselineDomainAxis(stub({baseline: undefined}, {_userBaseline: undefined})), undefined, "no baseline");
  assert.strictEqual(baselineDomainAxis(stub({}, {_userBaseline: NaN})), undefined, "not a number");
  assert.strictEqual(baselineDomainAxis(stub({}, {_yTime: true})), undefined, "a time axis");
  assert.strictEqual(baselineDomainAxis(stub({ySort: () => 0})), undefined, "a sorted axis");
  assert.strictEqual(baselineDomainAxis(stub({}, {_userBaseline: 0, _yConfig: {scale: "log"}})), undefined, "log can't reach 0");
  assert.strictEqual(baselineDomainAxis(stub({}, {_yConfig: {scale: "log"}})), "y", "log can reach 980");
});

it("hasUserDomain counts a domain or a set baseline", () => {
  assert.strictEqual(hasUserDomain(stub({}), "y"), true);
  assert.strictEqual(hasUserDomain(stub({}), "x"), false);
  assert.strictEqual(hasUserDomain(stub({xDomain: [0, 1]}), "x"), true);
  assert.strictEqual(hasUserDomain(stub({}, {_userBaseline: undefined}), "y"), false);
});

it("userAxisDomain fills the minimum, or the maximum when the data sits below the baseline", () => {
  assert.deepStrictEqual(userAxisDomain(stub({}), "y", [990, 1024]), [980], "data above");
  assert.deepStrictEqual(userAxisDomain(stub({}), "y", [960, 1024]), [980], "data crossing");
  const below = userAxisDomain(stub({}), "y", [900, 970]);
  assert.strictEqual(below[1], 980, "data below");
  assert.strictEqual(below[0], undefined);
  const reaching = userAxisDomain(stub({}), "y", [900, 980]);
  assert.strictEqual(reaching[1], 980, "data reaching it from below");
  assert.strictEqual(reaching[0], undefined);
  assert.deepStrictEqual(userAxisDomain(stub({yDomain: [990]}), "y", [990, 1024]), [990], "a user minimum wins");
  assert.deepStrictEqual(userAxisDomain(stub({yDomain: [undefined, 1100]}), "y", [990, 1024]), [980, 1100], "a user maximum stays");
  assert.strictEqual(userAxisDomain(stub({}), "x", [0, 3]), undefined, "the discrete axis");
  assert.strictEqual(userAxisDomain(stub({}, {_userBaseline: undefined}), "y", [990, 1024]), undefined, "only the chart's own baseline");
  const user = [990];
  userAxisDomain(stub({yDomain: user}), "y", [990, 1024]);
  assert.deepStrictEqual(user, [990], "the user's array is never mutated");
});

it("userDomainBreaksBaseline reads the domain a set baseline filled in", () => {
  const viz = stub({baselineBreak: true});
  assert.strictEqual(userDomainBreaksBaseline(viz, "y", "linear"), false, "no yDomain as given");
  assert.strictEqual(userDomainBreaksBaseline(viz, "y", "linear", [980]), true, "the filled-in minimum breaks back to 0");
  assert.strictEqual(userDomainBreaksBaseline(viz, "y", "linear", [undefined, -80]), true, "a filled-in maximum breaks up to 0");
});

it("baseline() stores the user's baseline apart from the chart's own", () => {
  const bars = new BarChart();
  bars._defaultConfig();
  assert.strictEqual(bars.baseline(), 0, "BarChart's own baseline");
  assert.strictEqual(bars._userBaseline, undefined, "the chart's own baseline isn't the user's");
  assert.strictEqual(bars.baseline(980), bars, "chainable");
  assert.strictEqual(bars.baseline(), 980);
  assert.strictEqual(bars._userBaseline, 980);
  assert.strictEqual(bars.schema.baseline, 0, "bars still start at the chart's own 0");
  bars.config({baseline: RESET});
  assert.strictEqual(bars.baseline(), 0, "RESET restores the chart's own baseline");
  assert.strictEqual(bars._userBaseline, undefined, "RESET clears the user's baseline");
  bars.config({baseline: 0});
  assert.strictEqual(bars._userBaseline, 0, "config() sets it");
  bars.baseline(RESET);
  assert.strictEqual(bars._userBaseline, undefined, "a direct RESET clears it too");
  bars.baseline(5).baseline(undefined);
  assert.strictEqual(bars._userBaseline, undefined, "undefined clears it");
  assert.strictEqual(bars.baseline(), 0);
  assert.strictEqual(new AreaPlot().baseline(), 0);
  assert.strictEqual(new Histogram().baseline(), 0);
  assert.strictEqual(new LinePlot().baseline(), undefined, "LinePlot has no baseline of its own");
  assert.strictEqual(new LinePlot().baseline(5).config().baseline, 5, "config() reads it back");
});
