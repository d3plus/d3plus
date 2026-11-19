import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {profileData} from "../src/components/ChartChooser/columns.ts";
import {parseData} from "../src/components/ChartChooser/parse.ts";
import {
  categoryUpTo,
  hasCategory,
  hasDate,
  hasGroups,
  hasSeries,
  hasValue,
  headline,
  headlineItems,
  nonNegative,
  numbersAtLeast,
  oneRowEach,
  q,
  rowsAtLeast,
  rowsAtMost,
  rule,
  total,
} from "../src/components/ChartChooser/rules.ts";
import {analyze} from "../src/components/ChartChooser/traits.ts";

const traits = csv => analyze(profileData(parseData(csv).rows));
const ok = (r, t) => r(t).ok;

const parties = traits("party,seats\nA,10\nB,20\nC,5");
const monthly = traits(
  "month,app,users\n2024-01,A,1\n2024-01,B,2\n2024-02,A,3\n2024-02,B,4",
);
const raw = traits(
  `g,v\n${Array.from({length: 12}, (_, i) => `${i % 2 ? "a" : "b"},${i - 3}`).join("\n")}`,
);

describe("rule", () => {
  it("is met with what met it, or unmet with what's missing", () => {
    const r = rule("needs x", t => t.rows.length > 1 && "has rows");
    assert.deepEqual(r(parties), {ok: true, text: "has rows"});
    const s = rule(
      t => `needs ${t.rows.length + 1}`,
      () => null,
    );
    assert.deepEqual(s(parties), {ok: false, text: "needs 4"});
  });
});

describe("q", () => {
  it("quotes a column's name", () => {
    assert.equal(q({key: "seats"}), "“seats”");
  });
});

describe("total", () => {
  it("sums a number column", () => {
    assert.equal(total(parties, parties.value), 35);
  });
});

describe("hasValue, nonNegative, hasCategory, oneRowEach", () => {
  it("check for a measure, a category naming each row, and no negatives", () => {
    assert.equal(ok(hasValue, parties), true);
    assert.equal(ok(hasValue, traits("a\nx\ny")), false);
    assert.equal(ok(nonNegative, parties), true);
    assert.equal(ok(nonNegative, raw), false);
    assert.equal(ok(hasCategory, parties), true);
    assert.equal(ok(oneRowEach, parties), true);
    assert.equal(ok(oneRowEach, raw), false);
  });
});

describe("categoryUpTo", () => {
  it("needs a category with few enough values", () => {
    assert.equal(ok(categoryUpTo(3), parties), true);
    const r = categoryUpTo(2, "slices")(parties);
    assert.equal(r.ok, false);
    assert.match(r.text, /2 or fewer slices \(“party” has 3\)/);
  });
});

describe("headlineItems and headline", () => {
  it("count one item per row, or per series over time", () => {
    assert.equal(headlineItems(parties), 3);
    assert.equal(headlineItems(monthly), 2);
    assert.equal(ok(headline, parties), true);
    assert.equal(ok(headline, raw), false);
    assert.match(headline(raw).text, /6 or fewer; yours has 12/);
  });
});

describe("hasDate, hasSeries, hasGroups", () => {
  it("check for dates, series over time, and groups of observations", () => {
    assert.equal(ok(hasDate, monthly), true);
    assert.equal(ok(hasDate, parties), false);
    assert.equal(ok(hasSeries, monthly), true);
    assert.equal(ok(hasSeries, parties), false);
    assert.equal(ok(hasGroups, raw), true);
    assert.equal(ok(hasGroups, parties), false);
  });
});

describe("numbersAtLeast, rowsAtLeast, rowsAtMost", () => {
  it("count measures and rows", () => {
    assert.equal(ok(numbersAtLeast(1), parties), true);
    assert.equal(ok(numbersAtLeast(2), parties), false);
    assert.equal(ok(rowsAtLeast(3, "x"), parties), true);
    assert.match(
      rowsAtLeast(4, "to bin")(parties).text,
      /4 or more rows to bin \(yours has 3\)/,
    );
    assert.equal(ok(rowsAtMost(3), parties), true);
    assert.equal(ok(rowsAtMost(2), parties), false);
  });
});
