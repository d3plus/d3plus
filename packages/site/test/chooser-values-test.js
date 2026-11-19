import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  isEmpty,
  toBoolean,
  toDate,
  toNumber,
  yearColumn,
} from "../src/components/ChartChooser/values.ts";

describe("isEmpty", () => {
  it("treats missing values and placeholder text as empty", () => {
    for (const v of [
      null,
      undefined,
      NaN,
      "",
      "  ",
      "NA",
      "n/a",
      "null",
      "-",
      "#N/A",
    ])
      assert.equal(isEmpty(v), true, String(v));
  });
  it("keeps real values, zero and false included", () => {
    for (const v of [0, false, "0", "x", []]) assert.equal(isEmpty(v), false);
  });
});

describe("toNumber", () => {
  it("reads numbers and number-like text", () => {
    assert.equal(toNumber(4.5), 4.5);
    assert.equal(toNumber(" 12 "), 12);
    assert.equal(toNumber("1,234.5"), 1234.5);
    assert.equal(toNumber("$12"), 12);
    assert.equal(toNumber("-$3"), -3);
    assert.equal(toNumber("45%"), 45);
    assert.equal(toNumber("-3e2"), -300);
    assert.equal(toNumber("(12)"), -12);
    assert.equal(toNumber(".5"), 0.5);
  });
  it("rejects anything else", () => {
    for (const v of [
      "abc",
      "12abc",
      "1,23",
      "2024-01-01",
      Infinity,
      true,
      null,
    ])
      assert.equal(toNumber(v), undefined, String(v));
  });
});

describe("toBoolean", () => {
  it("reads booleans and yes/no text", () => {
    assert.equal(toBoolean(true), true);
    assert.equal(toBoolean("Yes"), true);
    assert.equal(toBoolean(" false "), false);
    assert.equal(toBoolean("no"), false);
  });
  it("rejects anything else", () => {
    assert.equal(toBoolean("1"), undefined);
    assert.equal(toBoolean(0), undefined);
  });
});

describe("toDate", () => {
  it("reads ISO days and date-times", () => {
    assert.deepEqual(toDate("2024-03-01"), {
      kind: "day",
      time: Date.UTC(2024, 2, 1),
      iso: true,
    });
    assert.equal(toDate("2024-03-01T09:30:00Z").kind, "time");
    assert.equal(
      toDate("2024-03-01T09:30:00Z").time,
      Date.UTC(2024, 2, 1, 9, 30),
    );
    assert.equal(toDate("2024/3/1").kind, "day");
  });
  it("reads months, quarters, and US-style days", () => {
    assert.deepEqual(toDate("2024-03"), {
      kind: "month",
      time: Date.UTC(2024, 2, 1),
      iso: true,
    });
    assert.equal(toDate("2024 Q2").time, Date.UTC(2024, 3, 1));
    assert.equal(toDate("Q4 2023").time, Date.UTC(2023, 9, 1));
    assert.equal(toDate("2024-q1").kind, "quarter");
    assert.deepEqual(toDate("3/1/2024"), {
      kind: "day",
      time: Date.UTC(2024, 2, 1),
      iso: false,
    });
  });
  it("rejects impossible dates and other text", () => {
    for (const v of [
      "2024-02-30",
      "2024-13",
      "13/1/2024",
      "March",
      "2024",
      2024,
    ])
      assert.equal(toDate(v), undefined, String(v));
  });
});

describe("yearColumn", () => {
  it("is a column named like years, of whole numbers in range", () => {
    assert.equal(yearColumn("year", [2020, 2021]), true);
    assert.equal(yearColumn("Fiscal Year", [1999]), true);
    assert.equal(yearColumn("FY", [2024]), true);
  });
  it("isn't other columns", () => {
    assert.equal(yearColumn("population", [2020, 2021]), false);
    assert.equal(yearColumn("year", [2020.5]), false);
    assert.equal(yearColumn("years of service", [3, 12]), false);
    assert.equal(yearColumn("year", []), false);
  });
});
