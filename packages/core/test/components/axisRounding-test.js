import {it} from "vitest";
import assert from "assert";
import {
  ceilPow,
  fixFloat,
  floorPow,
  isNegative,
  roundedDomain,
  roundingScales,
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
