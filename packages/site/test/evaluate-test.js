import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {evaluate, HELPERS} from "../src/components/Playground/evaluate.ts";

describe("evaluate", () => {
  it("returns the config the code declares", () => {
    const {config, error} = evaluate(
      `const data = [1];\nconst config = {data, sum: "v"};`,
    );
    assert.equal(error, undefined);
    assert.deepEqual(config, {data: [1], sum: "v"});
  });
  it("puts the d3plus helpers in scope", () => {
    const {config} = evaluate(
      `const config = {label: formatAbbreviate(1200000)};`,
    );
    assert.equal(config.label, "1.2M");
  });
  it("lets the code shadow a helper's name", () => {
    const {config} = evaluate(
      `const formatAbbreviate = 1;\nconst config = {a: formatAbbreviate};`,
    );
    assert.equal(config.a, 1);
  });
  it("reports syntax and runtime errors", () => {
    assert.match(evaluate("const config = {").error, /Unexpected/);
    assert.match(evaluate("const config = {a: nope()};").error, /nope/);
  });
  it("asks for a config object when there is none", () => {
    assert.match(evaluate("const x = 1;").error, /const config/);
    assert.match(evaluate("const config = [1];").error, /const config/);
  });
  it("maps each helper to its package", () => {
    assert.equal(HELPERS.formatAbbreviate, "format");
    assert.equal(HELPERS.colorAssign, "color");
  });
});
