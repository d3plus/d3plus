import assert from "assert";
import it from "../jsdom.js";
import {baselineDomainAxis, hasUserDomain, userAxisDomain} from "../../es/internal.js";
import {AreaPlot, BarChart, Histogram, LinePlot, RESET} from "../../es/index.js";

/**
    A set `baseline` fills the open end of the value domain (see
    `Plot/baselineDomain.ts`); a chart's built-in baseline doesn't.
*/

const stub = (schema, extra = {}) => ({
  schema: {baseline: 980, discrete: "x", ...schema},
  _baselineSet: true,
  _xConfig: {},
  _yConfig: {},
  ...extra,
});

it("baselineDomainAxis is the value axis, once a baseline is set", () => {
  assert.strictEqual(baselineDomainAxis(stub({})), "y");
  assert.strictEqual(baselineDomainAxis(stub({discrete: "y"})), "x", "horizontal charts bound x");
  assert.strictEqual(baselineDomainAxis(stub({}, {_swarm: {axis: "x"}})), "x", "a swarm's value axis");
  assert.strictEqual(baselineDomainAxis(stub({}, {_baselineSet: false})), undefined, "a default baseline");
  assert.strictEqual(baselineDomainAxis(stub({baseline: undefined})), undefined, "no baseline");
  assert.strictEqual(baselineDomainAxis(stub({baseline: NaN})), undefined, "not a number");
  assert.strictEqual(baselineDomainAxis(stub({}, {_yTime: true})), undefined, "a time axis");
  assert.strictEqual(baselineDomainAxis(stub({ySort: () => 0})), undefined, "a sorted axis");
  assert.strictEqual(baselineDomainAxis(stub({baseline: 0}, {_yConfig: {scale: "log"}})), undefined, "log can't reach 0");
  assert.strictEqual(baselineDomainAxis(stub({}, {_yConfig: {scale: "log"}})), "y", "log can reach 980");
});

it("hasUserDomain counts a domain or a set baseline", () => {
  assert.strictEqual(hasUserDomain(stub({}), "y"), true);
  assert.strictEqual(hasUserDomain(stub({}), "x"), false);
  assert.strictEqual(hasUserDomain(stub({xDomain: [0, 1]}), "x"), true);
  assert.strictEqual(hasUserDomain(stub({}, {_baselineSet: false}), "y"), false);
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
  assert.strictEqual(userAxisDomain(stub({}, {_baselineSet: false}), "y", [990, 1024]), undefined, "a default baseline");
  const user = [990];
  userAxisDomain(stub({yDomain: user}), "y", [990, 1024]);
  assert.deepStrictEqual(user, [990], "the user's array is never mutated");
});

it("baseline() tracks whether the user set it", () => {
  const bars = new BarChart();
  bars._defaultConfig();
  assert.strictEqual(bars.baseline(), 0, "BarChart's built-in baseline");
  assert.ok(!bars._baselineSet, "the built-in baseline isn't set by the user");
  assert.strictEqual(bars.baseline(980), bars, "chainable");
  assert.strictEqual(bars.baseline(), 980);
  assert.strictEqual(bars._baselineSet, true);
  bars.config({baseline: RESET});
  assert.strictEqual(bars.baseline(), 0, "RESET restores the built-in baseline");
  assert.ok(!bars._baselineSet, "RESET clears the user's baseline");
  bars.config({baseline: 0});
  assert.strictEqual(bars._baselineSet, true, "config() sets it");
  bars.baseline(RESET);
  assert.ok(!bars._baselineSet, "a direct RESET clears it too");
  bars.baseline(undefined);
  assert.strictEqual(bars.baseline(), undefined);
  assert.ok(!bars._baselineSet, "undefined clears it");
  assert.strictEqual(new AreaPlot().baseline(), 0);
  assert.strictEqual(new Histogram().baseline(), 0);
  assert.strictEqual(new LinePlot().baseline(), undefined, "LinePlot has no built-in baseline");
  assert.strictEqual(new LinePlot().baseline(5).config().baseline, 5, "config() reads it back");
});
