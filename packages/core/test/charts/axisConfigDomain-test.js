import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  hasFullConfigDomain,
  plotAxisRounding,
  secondaryAxisRounding,
  xAxisRounding,
} from "../../internal.ts";

useJsdom();

/**
    A full `domain` in a Plot's axis config is drawn as given, like an Axis
    given a domain: Plot hands that axis no rounding of its own, so only the
    axis config's `rounding` rounds it.
*/

const stub = (schema = {}, extra = {}) => ({
  schema: {baseline: 0, discrete: "x", ...schema},
  _xConfig: {},
  _yConfig: {},
  _x2Config: {},
  _y2Config: {},
  ...extra,
});

it("hasFullConfigDomain: both ends, or a list of categories", () => {
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_yConfig: {domain: [1100, 960]}}), "y"),
    true,
  );
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_xConfig: {domain: ["A", "B", "C"]}}), "x"),
    true,
    "categories",
  );
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_y2Config: {domain: [0, 10]}}), "y2"),
    true,
    "a secondary axis",
  );
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_yConfig: {domain: [980]}}), "y"),
    false,
    "one-sided",
  );
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_yConfig: {domain: [undefined, 980]}}), "y"),
    false,
    "one-sided max",
  );
  assert.strictEqual(
    hasFullConfigDomain(
      stub({}, {_yConfig: {domain: [undefined, undefined]}}),
      "y",
    ),
    false,
    "no ends",
  );
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_yConfig: {domain: []}}), "y"),
    false,
    "empty",
  );
  assert.strictEqual(hasFullConfigDomain(stub(), "y"), false, "no domain");
  assert.strictEqual(
    hasFullConfigDomain(stub({}, {_yConfig: undefined}), "y"),
    false,
    "no config",
  );
});

it("plotAxisRounding: none for a full axis-config domain, else Plot's default", () => {
  assert.strictEqual(
    plotAxisRounding(
      stub({}, {_yConfig: {domain: [1100, 960]}}),
      "y",
      "outside",
    ),
    "none",
  );
  assert.strictEqual(
    plotAxisRounding(stub({}, {_yConfig: {domain: [980]}}), "y", "outside"),
    "outside",
    "one-sided",
  );
  assert.strictEqual(plotAxisRounding(stub(), "y", "outside"), "outside");
  assert.strictEqual(plotAxisRounding(stub(), "x", "none"), "none");
});

it("secondaryAxisRounding: the user's rounding, else none for a full domain, else the primary's default", () => {
  assert.strictEqual(
    secondaryAxisRounding(
      stub({}, {_y2Config: {domain: [0, 10]}}),
      "y2",
      "outside",
    ),
    "none",
  );
  assert.strictEqual(
    secondaryAxisRounding(
      stub({}, {_y2Config: {domain: [0, 10], rounding: "outside"}}),
      "y2",
      "outside",
    ),
    "outside",
    "the user's rounding wins",
  );
  assert.strictEqual(
    secondaryAxisRounding(
      stub({}, {_x2Config: {rounding: "inside"}}),
      "x2",
      "outside",
    ),
    "inside",
  );
  assert.strictEqual(
    secondaryAxisRounding(
      stub({}, {_yConfig: {domain: [1100, 960]}}),
      "y2",
      "outside",
    ),
    "outside",
    "a full yConfig domain leaves y2 rounded",
  );
  assert.strictEqual(secondaryAxisRounding(stub(), "y2", "none"), "none");
});

it("xAxisRounding: outside unless the user set a domain or the axis is a discrete extent", () => {
  assert.strictEqual(xAxisRounding(stub({discrete: "y"})), "outside");
  assert.strictEqual(
    xAxisRounding(stub({discrete: "y", xDomain: [0, 10]})),
    "none",
    "xDomain",
  );
  assert.strictEqual(
    xAxisRounding(stub({discrete: "y"}, {_xConfig: {domain: [5]}})),
    "none",
    "a one-sided xConfig domain",
  );
  assert.strictEqual(
    xAxisRounding(stub({discrete: "x"}, {_discreteExtent: () => [0, 1]})),
    "none",
    "a discrete extent",
  );
  assert.strictEqual(
    xAxisRounding(stub({discrete: "y"}, {_xConfig: {domain: [0, 10]}})),
    "outside",
    "a full xConfig domain is handled by plotAxisRounding",
  );
});
