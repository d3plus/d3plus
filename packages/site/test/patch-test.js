import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  configKeys,
  findConfig,
  patchConfig,
} from "../src/components/Playground/patch.ts";

const code = `const data = [{id: "a"}];

const config = {
  data,
  groupBy: "id",
  "sum": "value",
  size: 3,
};
`;

describe("findConfig", () => {
  it("finds the object assigned to the top-level const config", () => {
    const node = findConfig(code);
    assert.equal(node.type, "ObjectExpression");
    assert.equal(code.slice(node.start, node.start + 1), "{");
  });
  it("is null without one, or when the code doesn't parse", () => {
    assert.equal(findConfig("const other = {};"), null);
    assert.equal(findConfig("const config = 5;"), null);
    assert.equal(findConfig("const config = {"), null);
  });
});

describe("configKeys", () => {
  it("lists the keys in source order, quoted or not", () => {
    assert.deepEqual(configKeys(code), ["data", "groupBy", "sum", "size"]);
  });
  it("is empty without a config", () => {
    assert.deepEqual(configKeys("let x;"), []);
  });
});

describe("patchConfig", () => {
  it("rewrites an existing value in place", () => {
    const out = patchConfig(code, "size", 10);
    assert.ok(out.includes("  size: 10,\n"));
    assert.equal(out.length, code.length + 1);
  });
  it("rewrites a quoted key and strings as JSON", () => {
    assert.ok(
      patchConfig(code, "sum", 'say "hi"').includes(`"sum": "say \\"hi\\""`),
    );
  });
  it("expands a shorthand property", () => {
    assert.ok(patchConfig(code, "data", false).includes("  data: false,\n"));
  });
  it("adds a missing key after the last one, keeping the trailing comma", () => {
    const out = patchConfig(code, "stacked", true);
    assert.ok(out.includes("  size: 3,\n  stacked: true,\n};"));
  });
  it("adds a comma when the last property has none", () => {
    const out = patchConfig(`const config = {a: 1};`, "b", 2);
    assert.equal(out, `const config = {a: 1,\nb: 2};`);
  });
  it("quotes a key that isn't an identifier", () => {
    assert.ok(patchConfig(code, "click.shape", 1).includes(`"click.shape": 1`));
  });
  it("fills an empty object", () => {
    assert.equal(
      patchConfig(`const config = {};`, "a", 1),
      `const config = {\n  a: 1,\n};`,
    );
  });
  it("leaves code without a config untouched", () => {
    assert.equal(patchConfig("const x = 1;", "a", 1), "const x = 1;");
  });
});
