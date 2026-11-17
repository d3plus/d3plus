import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  columnKeys,
  coordinate,
  describeColumn,
  profileData,
  setDelimiter,
  typeColumn,
} from "../src/components/ChartChooser/columns.ts";

describe("columnKeys", () => {
  it("lists every key in order of first appearance", () => {
    assert.deepEqual(columnKeys([{a: 1}, {b: 2, a: 3}, {c: 4}]), [
      "a",
      "b",
      "c",
    ]);
  });
});

describe("setDelimiter", () => {
  it("finds the delimiter joining set names that also stand alone", () => {
    assert.equal(setDelimiter(["A", "B", "A & B"]), "&");
    assert.equal(setDelimiter(["A", "B", "C", "A|B|C"]), "|");
  });
  it("is undefined for text that only happens to hold a delimiter", () => {
    assert.equal(setDelimiter(["Smith, John", "Doe, Jane"]), undefined);
    assert.equal(setDelimiter(["A", "B & C"]), undefined);
    assert.equal(setDelimiter(["A", "B"]), undefined);
  });
});

describe("coordinate", () => {
  it("names latitude and longitude columns in range", () => {
    assert.equal(coordinate("lat", -10, 50), "lat");
    assert.equal(coordinate("Longitude", -120, 20), "lon");
    assert.equal(coordinate("lng", 0, 1), "lon");
  });
  it("is undefined out of range or by another name", () => {
    assert.equal(coordinate("lat", 0, 120), undefined);
    assert.equal(coordinate("latency", 0, 10), undefined);
  });
});

describe("typeColumn", () => {
  it("types numbers, with their range", () => {
    const {column, cell} = typeColumn("n", ["1", "2,000", 3.5]);
    assert.equal(column.type, "number");
    assert.equal(column.min, 1);
    assert.equal(column.max, 2000);
    assert.equal(column.integer, false);
    assert.equal(cell("2,000"), 2000);
  });
  it("types years named so as dates", () => {
    const {column, cell} = typeColumn("year", ["2020", "2021"]);
    assert.equal(column.type, "date");
    assert.equal(column.dateKind, "year");
    assert.equal(cell("2020"), 2020);
  });
  it("keeps zero-padded codes as text", () => {
    const {column} = typeColumn("fips", ["01", "06"]);
    assert.equal(column.type, "category");
    assert.equal(column.geo, "state");
    assert.equal(column.stateCode, "fips");
  });
  it("types dates at their finest kind", () => {
    const {column} = typeColumn("d", ["2024-01", "2024-02-03"]);
    assert.equal(column.type, "date");
    assert.equal(column.dateKind, "day");
    assert.equal(column.dateIso, true);
  });
  it("types booleans, sets, and categories", () => {
    assert.equal(typeColumn("b", ["yes", "No"]).column.type, "boolean");
    assert.equal(typeColumn("s", [["A"], ["A", "B"]]).column.type, "sets");
    const sets = typeColumn("s", ["A", "B", "A & B"]).column;
    assert.equal(sets.type, "sets");
    assert.equal(sets.setDelimiter, "&");
    const c = typeColumn("c", ["x", "yy", "x"]).column;
    assert.equal(c.type, "category");
    assert.equal(c.unique, 2);
    assert.equal(c.length, 4 / 3);
  });
  it("types a column with no values as empty text", () => {
    const {column} = typeColumn("note", []);
    assert.equal(column.type, "category");
    assert.equal(column.count, 0);
  });
  it("marks country codes and states", () => {
    assert.equal(typeColumn("c", ["USA", "BRA"]).column.geo, "iso3");
    assert.equal(typeColumn("s", ["CA", "TX"]).column.stateCode, "postal");
    assert.equal(typeColumn("s", ["Ohio", "texas"]).column.stateCode, "name");
  });
});

describe("profileData", () => {
  it("types the cells and leaves empty ones out", () => {
    const {rows, columns} = profileData([
      {name: "a", n: "1", note: ""},
      {name: "b", n: "n/a", note: ""},
    ]);
    assert.deepEqual(rows, [{name: "a", n: 1}, {name: "b"}]);
    assert.deepEqual(
      columns.map(c => [c.key, c.type, c.count]),
      [
        ["name", "category", 2],
        ["n", "number", 1],
      ],
    );
  });
});

describe("describeColumn", () => {
  it("summarizes each type", () => {
    const d = (key, values) => describeColumn(typeColumn(key, values).column);
    assert.equal(d("c", ["x", "y"]), "category · 2 unique");
    assert.equal(d("n", ["1", "2"]), "number · whole");
    assert.equal(d("n", ["1.5"]), "number");
    assert.equal(d("d", ["2024-01"]), "date · months");
    assert.equal(d("c", ["USA"]), "country code · 1 unique");
    assert.equal(d("s", ["CA"]), "US state · 1 unique");
    assert.equal(d("lat", ["40"]), "latitude");
    assert.equal(d("b", ["yes"]), "yes / no");
    assert.equal(d("s", ["A", "B", "A & B"]), "sets · 3 combinations");
  });
});
