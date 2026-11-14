import {it} from "vitest";
import assert from "assert";
import {
  ceilPow,
  fixFloat,
  floorPow,
  isNegative,
  nearZeroEnd,
  openEnd,
  roundedDomain,
  roundingScales,
  ZERO_SNAP_SHARE,
} from "../../src/components/Axis/axisRounding.ts";

it("isNegative — catches -0", () => {
  assert.strictEqual(isNegative(-1), true);
  assert.strictEqual(isNegative(-0), true);
  assert.strictEqual(isNegative(0), false);
  assert.strictEqual(isNegative(1), false);
});

it("floorPow / ceilPow — the power of ten below / above, keeping the sign", () => {
  assert.strictEqual(floorPow(350), 100);
  assert.strictEqual(ceilPow(350), 1000);
  assert.strictEqual(floorPow(-350), -100);
  assert.strictEqual(ceilPow(-350), -1000);
  assert.strictEqual(floorPow(0.05), 0.01);
  assert.strictEqual(ceilPow(0.05), 0.1);
  assert.strictEqual(floorPow(100), 100, "a power of ten is its own floor");
});

it("fixFloat — trims floating-point noise", () => {
  assert.strictEqual(fixFloat(0.30000000000000004), 0.3);
  assert.strictEqual(fixFloat(0.19999999999999998), 0.2);
  assert.strictEqual(fixFloat(1e-17), 0, "tiny values round to 0");
  assert.strictEqual(fixFloat(2.5), 2.5, "clean values pass through");
});

it("roundedDomain — a power axis rounds like a linear one", () => {
  const linear = roundedDomain([1000, 4400000], "outside", "linear");
  assert.deepStrictEqual(
    roundedDomain([1000, 4400000], "outside", "pow"),
    linear,
  );
  assert.deepStrictEqual(
    roundedDomain([1000, 4400000], "outside", "sqrt"),
    linear,
  );
  assert.deepStrictEqual(
    roundedDomain([1024, 980], "inside", "pow"),
    roundedDomain([1024, 980], "inside", "linear"),
  );
  assert.strictEqual(roundedDomain([0, 10], "outside", "time"), undefined);
  assert.deepStrictEqual(roundingScales, ["linear", "log", "pow", "sqrt"]);
});

it("openEnd — the lowest and highest labeled values the domain reaches", () => {
  const labeled = [200, 400, 600, 800, 900, 300, 1000];
  const domain = [120, 1040];
  assert.strictEqual(openEnd(200, labeled, domain), "min");
  assert.strictEqual(openEnd(1000, labeled, domain), "max");
  assert.strictEqual(openEnd(900, labeled, domain), undefined);
  assert.strictEqual(openEnd(300, labeled, domain), undefined);
  assert.strictEqual(openEnd(500, labeled, domain), undefined, "not labeled");
  assert.strictEqual(openEnd("1000", labeled, domain), "max", "by value");
});

it("openEnd — a value past the domain is not open-ended", () => {
  const labeled = [0, 500, 1500];
  assert.strictEqual(openEnd(0, labeled, [120, 1040]), undefined);
  assert.strictEqual(openEnd(1500, labeled, [120, 1040]), undefined);
  assert.strictEqual(openEnd(0, labeled, [0, 1500]), "min", "at the domain");
  assert.strictEqual(openEnd(1500, labeled, [0, 1500]), "max", "at the domain");
  assert.strictEqual(openEnd(0, labeled, [-50, 1040]), "min");
  assert.strictEqual(openEnd(1500, labeled, [-50, 1040]), undefined);
});

it("openEnd — a domain of a single value has no open end", () => {
  assert.strictEqual(openEnd(4, [4], [4, 4]), undefined);
  assert.strictEqual(openEnd(-2, [-2], [-2, -2]), undefined);
  assert.strictEqual(openEnd(4, [4], [0, 4]), "min", "a wider domain");
});

it("openEnd — reads the values and the domain in either order", () => {
  const labeled = [1000, 800, 600, 400, 200];
  assert.strictEqual(openEnd(200, labeled, [1040, 120]), "min");
  assert.strictEqual(openEnd(1000, labeled, [1040, 120]), "max");
  assert.strictEqual(openEnd(-300, [-300, 0, 800], [-340, 0, 870]), "min");
  assert.strictEqual(openEnd(800, [-300, 0, 800], [-340, 0, 870]), "max");
});

it("openEnd — a lone value is the low end, and no values mark no end", () => {
  assert.strictEqual(openEnd(500, [500], [120, 1040]), "min");
  assert.strictEqual(openEnd(500, [], [120, 1040]), undefined);
  assert.strictEqual(openEnd(500, [500], []), undefined);
  assert.strictEqual(openEnd("a", ["a", "b"], ["a", "b"]), undefined);
});

it("nearZeroEnd — a one-signed domain's end within a tenth of the other's distance from zero", () => {
  assert.strictEqual(ZERO_SNAP_SHARE, 0.1);
  assert.strictEqual(nearZeroEnd([3.2, 86.8]), 0);
  assert.strictEqual(nearZeroEnd([86.8, 3.2]), 1, "either order");
  assert.strictEqual(nearZeroEnd([-86.8, -3.2]), 1, "negative");
  assert.strictEqual(nearZeroEnd([0.004, 0.9]), 0, "small values");
  assert.strictEqual(nearZeroEnd([9, 86.8]), undefined, "past a tenth");
  assert.strictEqual(nearZeroEnd([8.68, 86.8]), undefined, "at a tenth");
  assert.strictEqual(nearZeroEnd([0, 86.8]), undefined, "already zero");
  assert.strictEqual(nearZeroEnd([-3, 86.8]), undefined, "crosses zero");
  assert.strictEqual(nearZeroEnd([5, 5]), undefined);
});

it("roundedDomain — rounding outside takes an end near zero to zero", () => {
  // Rounded to its own digits, 3.2 would end the axis on an uneven 3.
  assert.deepStrictEqual(
    roundedDomain([3.2, 86.8], "outside", "linear"),
    [0, 87],
  );
  assert.deepStrictEqual(
    roundedDomain([86.8, 1.4], "outside", "linear"),
    [87, 0],
  );
  assert.deepStrictEqual(
    roundedDomain([-86.8, -3.2], "outside", "linear"),
    [-87, 0],
  );
  assert.deepStrictEqual(
    roundedDomain([24, 313], "outside", "linear"),
    [0, 320],
  );
  // Farther from zero, or rounding inside, the end keeps its own rounding.
  assert.deepStrictEqual(
    roundedDomain([34, 313], "outside", "linear"),
    [30, 320],
  );
  assert.deepStrictEqual(
    roundedDomain([3.2, 86.8], "inside", "linear"),
    [4, 86],
  );
  // A log domain never reaches zero.
  assert.deepStrictEqual(roundedDomain([3, 8.7], "outside", "log"), [3, 9]);
});
