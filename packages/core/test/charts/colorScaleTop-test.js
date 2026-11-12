import {it} from "vitest";
import assert from "assert";

import {drawsAsWell} from "../../src/charts/features/colorScaleTop.ts";

const whole = {claim: 40, labels: ["10", "20", "30", "40"]};

it("drawsAsWell: swatches beside the buttons keep every label, no taller", () => {
  assert.strictEqual(drawsAsWell(true, {...whole}, whole), true);
  assert.strictEqual(drawsAsWell(true, {...whole, claim: 30}, whole), true);
  assert.strictEqual(drawsAsWell(true, {...whole, claim: 41}, whole), false);
  assert.strictEqual(
    drawsAsWell(true, {claim: 40, labels: ["10", "20"]}, whole),
    false,
  );
});

it("drawsAsWell: a bar beside the buttons keeps at least half its labels", () => {
  assert.strictEqual(
    drawsAsWell(false, {claim: 40, labels: ["10", "40"]}, whole),
    true,
  );
  assert.strictEqual(
    drawsAsWell(false, {claim: 40, labels: ["10"]}, whole),
    false,
  );
});

it("drawsAsWell: a bar beside the buttons cuts no more labels short", () => {
  assert.strictEqual(
    drawsAsWell(false, {claim: 40, labels: ["10", "Some lab..."]}, whole),
    false,
  );
});

it("drawsAsWell: a scale that draws nothing beside the buttons doesn't", () => {
  assert.strictEqual(drawsAsWell(true, {claim: 0, labels: []}, whole), false);
  assert.strictEqual(drawsAsWell(false, {claim: 0, labels: []}, whole), false);
});
