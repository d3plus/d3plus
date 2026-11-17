import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  codeSource,
  dataSource,
  niceMax,
  objectKey,
  prop,
  rowSource,
  str,
  strList,
} from "../src/components/ChartChooser/code.ts";
import {evaluate} from "../src/components/Playground/evaluate.ts";

describe("objectKey, str, strList, prop", () => {
  it("write keys, strings, and property reads as source", () => {
    assert.equal(objectKey("year"), "year");
    assert.equal(objectKey("life expectancy"), '"life expectancy"');
    assert.equal(str('a "b"'), '"a \\"b\\""');
    assert.equal(strList(["a", "b c"]), '["a", "b c"]');
    assert.equal(prop("year"), "d.year");
    assert.equal(prop("GDP ($)"), 'd["GDP ($)"]');
  });
});

describe("rowSource", () => {
  it("writes a row as a one-line object literal", () => {
    assert.equal(
      rowSource({name: "A", "n (k)": 2, ok: true, sets: ["x", "y"]}),
      '{name: "A", "n (k)": 2, ok: true, sets: ["x", "y"]}',
    );
  });
});

describe("dataSource", () => {
  it("declares the rows one per line", () => {
    assert.equal(
      dataSource([{a: 1}, {a: 2}]),
      "const data = [\n  {a: 1},\n  {a: 2},\n];",
    );
    assert.equal(dataSource([]), "const data = [];");
  });
});

describe("codeSource", () => {
  it("writes the data, any prelude, and the config, which evaluates", () => {
    const code = codeSource([{id: "a", v: 1}], {
      prelude: ["const k = 2;"],
      fields: [
        ["data", "data"],
        ["groupBy", '"id"'],
        ["sum value", "d => d.v * k"],
      ],
    });
    assert.equal(
      code,
      'const data = [\n  {id: "a", v: 1},\n];\n\nconst k = 2;\n\nconst config = {\n  data,\n  groupBy: "id",\n  "sum value": d => d.v * k,\n};\n',
    );
    const {config} = evaluate(code);
    assert.equal(config["sum value"]({v: 3}), 6);
  });
});

describe("niceMax", () => {
  it("rounds an axis's upper end", () => {
    assert.equal(niceMax(-1), 1);
    assert.equal(niceMax(0.4), 1);
    assert.equal(niceMax(99.9), 100);
    assert.equal(niceMax(240), 300);
    assert.equal(niceMax(1234), 2000);
  });
});
