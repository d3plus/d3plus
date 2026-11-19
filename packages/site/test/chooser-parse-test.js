import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  headerKeys,
  jsonRows,
  parseData,
  parseDelimited,
  sniffDelimiter,
  splitDelimited,
} from "../src/components/ChartChooser/parse.ts";

describe("sniffDelimiter", () => {
  it("picks whichever delimiter the header line has most of", () => {
    assert.equal(sniffDelimiter("a,b,c\n1,2,3"), ",");
    assert.equal(sniffDelimiter("a\tb\tc\n1\t2\t3"), "\t");
    assert.equal(sniffDelimiter("a;b;c\n1;2;3"), ";");
  });
  it("ignores delimiters inside quotes, and prefers tabs on a tie", () => {
    assert.equal(sniffDelimiter('"a,b,c"\td'), "\t");
    assert.equal(sniffDelimiter("a,b\tc"), "\t");
  });
  it("defaults to commas for a single column", () => {
    assert.equal(sniffDelimiter("name\nAda"), ",");
  });
});

describe("splitDelimited", () => {
  it("splits rows and cells", () => {
    assert.deepEqual(splitDelimited("a,b\n1,2\r\n3,4", ","), [
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });
  it("keeps delimiters, newlines, and doubled quotes inside quoted cells", () => {
    assert.deepEqual(splitDelimited('a,b\n"x, y","say ""hi""\nthere"', ","), [
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });
  it("skips blank lines", () => {
    assert.deepEqual(splitDelimited("a\n\n1\n  \n", ","), [["a"], ["1"]]);
  });
});

describe("headerKeys", () => {
  it("trims names, names blank columns, and numbers repeats", () => {
    assert.deepEqual(headerKeys([" a ", "", "a", "b"]), [
      "a",
      "column 2",
      "a 2",
      "b",
    ]);
  });
});

describe("parseDelimited", () => {
  it("reads rows of string cells under the header", () => {
    assert.deepEqual(parseDelimited("x,y\n1,2\n3", ","), [
      {x: "1", y: "2"},
      {x: "3", y: ""},
    ]);
  });
  it("is empty without a header", () => {
    assert.deepEqual(parseDelimited("", ","), []);
  });
});

describe("jsonRows", () => {
  it("accepts an array of objects", () => {
    assert.deepEqual(jsonRows([{a: 1}]), [{a: 1}]);
  });
  it("finds the first array an object holds", () => {
    assert.deepEqual(jsonRows({meta: 1, data: [{a: 1}]}), [{a: 1}]);
  });
  it("explains other shapes", () => {
    assert.match(jsonRows(5), /array of objects/);
    assert.match(jsonRows([1, 2]), /must be an object/);
  });
});

describe("parseData", () => {
  it("reads JSON, CSV, and TSV", () => {
    assert.equal(parseData('[{"a": 1}]').format, "json");
    assert.equal(parseData("a,b\n1,2").format, "csv");
    assert.equal(parseData("a\tb\n1\t2").format, "tsv");
    assert.deepEqual(parseData("a\tb\n1\t2").rows, [{a: "1", b: "2"}]);
  });
  it("is empty for blank text", () => {
    assert.deepEqual(parseData("  \n "), {rows: [], format: null});
  });
  it("reports invalid JSON", () => {
    const parsed = parseData('[{"a": 1,}]');
    assert.equal(parsed.rows.length, 0);
    assert.match(parsed.error, /^Invalid JSON/);
  });
  it("reports a header with no rows", () => {
    assert.match(parseData("a,b\n").error, /no data rows/);
  });
});
