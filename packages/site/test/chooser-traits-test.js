import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {profileData} from "../src/components/ChartChooser/columns.ts";
import {parseData} from "../src/components/ChartChooser/parse.ts";
import {
  analyze,
  boundsPair,
  crossTabPair,
  flowPair,
  groupColumn,
  hierarchyChain,
  nestedIn,
  ohlcColumns,
  pickCategory,
  primaryValue,
  relatable,
  rangePair,
  seriesColumn,
  spanYears,
  uniqueBy,
} from "../src/components/ChartChooser/traits.ts";

/** The profile of CSV text. */
const profile = csv => profileData(parseData(csv).rows);
/** The traits of CSV text. */
const traits = csv => analyze(profile(csv));
/** A profile's column by key. */
const col = (p, key) => p.columns.find(c => c.key === key);
const keys = cols => cols.map(c => c.key);

const budget = profile(
  "dept,team,cost\nEng,Web,5\nEng,API,3\nSales,East,4\nSales,West,2",
);
const trade = profile(
  "from,to,value\nA,B,1\nA,C,2\nB,A,3\nB,C,4\nC,A,5\nC,B,6",
);

describe("uniqueBy", () => {
  it("is whether no two rows share the keys' values", () => {
    assert.equal(uniqueBy(budget.rows, ["team"]), true);
    assert.equal(uniqueBy(budget.rows, ["dept"]), false);
  });
  it("needs keys unless there is at most one row", () => {
    assert.equal(uniqueBy([{a: 1}], []), true);
    assert.equal(uniqueBy([{a: 1}, {a: 2}], []), false);
  });
});

describe("nestedIn", () => {
  it("is whether each child value keeps one parent", () => {
    assert.equal(
      nestedIn(budget.rows, col(budget, "team"), col(budget, "dept")),
      true,
    );
    assert.equal(
      nestedIn(budget.rows, col(budget, "dept"), col(budget, "team")),
      false,
    );
    assert.equal(
      nestedIn(trade.rows, col(trade, "to"), col(trade, "from")),
      false,
    );
  });
});

describe("hierarchyChain", () => {
  it("finds nested categories, outermost first", () => {
    assert.deepEqual(keys(hierarchyChain(budget.rows, budget.columns)), [
      "dept",
      "team",
    ]);
  });
  it("is empty without nesting", () => {
    assert.deepEqual(hierarchyChain(trade.rows, trade.columns.slice(0, 2)), []);
  });
});

describe("crossTabPair", () => {
  it("finds two categories that cross, one row per pair", () => {
    assert.deepEqual(
      keys(crossTabPair(trade.rows, trade.columns.slice(0, 2))),
      ["from", "to"],
    );
  });
  it("skips nested categories", () => {
    assert.equal(
      crossTabPair(budget.rows, budget.columns.slice(0, 2)),
      undefined,
    );
  });
});

describe("flowPair", () => {
  it("finds columns named like ends", () => {
    const flows = flowPair(trade.rows, trade.columns.slice(0, 2));
    assert.deepEqual(
      [flows.source.key, flows.target.key, flows.nodes],
      ["from", "to", 3],
    );
  });
  it("finds two columns naming the same things", () => {
    const p = profile("home,away\nA,B\nB,C\nC,A");
    assert.equal(flowPair(p.rows, p.columns).nodes, 3);
  });
  it("is undefined otherwise", () => {
    assert.equal(flowPair(budget.rows, budget.columns.slice(0, 2)), undefined);
  });
});

describe("ohlcColumns", () => {
  it("finds open, high, low, and close", () => {
    const p = profile("Open,High,Low,Close\n1,2,0,1");
    assert.deepEqual(Object.keys(ohlcColumns(p.columns)), [
      "open",
      "high",
      "low",
      "close",
    ]);
    assert.equal(ohlcColumns(p.columns.slice(0, 3)), undefined);
  });
});

describe("rangePair", () => {
  it("finds start and end columns by name", () => {
    const p = profile("end,begin\n2024-02-01,2024-01-01");
    const range = rangePair(p.rows, p.columns);
    assert.deepEqual([range.start.key, range.end.key], ["begin", "end"]);
  });
  it("takes the only two date columns when the first never follows the second", () => {
    const p = profile("a,b\n2024-01-01,2024-01-05\n2024-02-01,2024-02-01");
    assert.equal(rangePair(p.rows, p.columns).start.key, "a");
    const q = profile("a,b\n2024-03-01,2024-01-05");
    assert.equal(rangePair(q.rows, q.columns), undefined);
  });
});

describe("boundsPair", () => {
  it("finds lower and upper bounds by name", () => {
    const p = profile("value,lower,upper\n1,0,2");
    assert.deepEqual(keys(Object.values(boundsPair(p.columns))), [
      "lower",
      "upper",
    ]);
    const q = profile("p50,p10,p90\n1,0,2");
    assert.deepEqual(keys(Object.values(boundsPair(q.columns))), [
      "p10",
      "p90",
    ]);
    assert.equal(boundsPair(profile("a,b\n1,2").columns), undefined);
  });
});

describe("primaryValue", () => {
  it("prefers a value-like name, else the first measure not skipped", () => {
    const p = profile("rank,sales\n1,2");
    assert.equal(primaryValue(p.columns, []).key, "sales");
    const q = profile("a,b\n1,2");
    assert.equal(primaryValue(q.columns, [q.columns[0]]).key, "b");
  });
});

describe("seriesColumn", () => {
  it("finds the category splitting dated rows into series", () => {
    const p = profile(
      "year,team,size,pts\n2020,A,x,1\n2020,B,x,2\n2021,A,y,3\n2021,B,y,4",
    );
    assert.equal(
      seriesColumn(p.rows, [col(p, "size"), col(p, "team")], col(p, "year"))
        .key,
      "team",
    );
    assert.equal(seriesColumn(p.rows, [col(p, "team")], undefined), undefined);
  });
});

describe("groupColumn", () => {
  it("finds a category of 2 to 12 groups of 5 or more rows", () => {
    const rows = Array.from(
      {length: 10},
      (_, i) => `${i % 2 ? "a" : "b"},${i}`,
    );
    const p = profile(`g,v\n${rows.join("\n")}`);
    assert.equal(groupColumn(p.rows, [col(p, "g")]).key, "g");
    const small = profile("g,v\na,1\nb,2");
    assert.equal(groupColumn(small.rows, [col(small, "g")]), undefined);
  });
});

describe("spanYears", () => {
  it("measures the years a date column spans", () => {
    const p = profile("d\n2020-01-01\n2022-01-01");
    assert.ok(Math.abs(spanYears(p.rows, col(p, "d")) - 2) < 0.01);
    assert.equal(spanYears(p.rows, undefined), 0);
  });
});

describe("analyze", () => {
  it("collects every trait of a dataset", () => {
    const t = traits(
      "month,platform,users\n2024-01,A,1\n2024-01,B,2\n2024-02,A,3\n2024-02,B,4",
    );
    assert.equal(t.value.key, "users");
    assert.equal(t.date.key, "month");
    assert.equal(t.series.key, "platform");
    assert.equal(t.periods, 2);
    assert.equal(t.keyed, true);
    assert.equal(t.item, undefined);
  });
  it("finds the target, place, and item columns", () => {
    const t = traits(
      "iso,name,score,goal\nUSA,United States,1,2\nBRA,Brazil,3,4",
    );
    assert.equal(t.target.key, "goal");
    assert.equal(t.value.key, "score");
    assert.equal(t.geo.iso3.key, "iso");
    assert.equal(t.item.key, "name");
  });
  it("doesn't take the only measure as a target", () => {
    assert.equal(traits("team,budget\nA,1\nB,2").value.key, "budget");
  });
  it("marks raw observations as not keyed", () => {
    assert.equal(traits("g,v\na,1\na,2").keyed, false);
  });
});

describe("pickCategory", () => {
  it("picks the finest category within a limit, names over codes", () => {
    const t = traits(
      "iso,name,region,v\nUSA,United States,Am,1\nBRA,Brazil,Am,2\nFRA,France,Eu,3",
    );
    assert.equal(pickCategory(t).key, "name");
    assert.equal(pickCategory(t, 2).key, "region");
    assert.equal(pickCategory(t, 1), undefined);
    assert.equal(pickCategory(t, Infinity, [t.categories[1]]).key, "iso");
  });
});

describe("relatable", () => {
  const keys = t => relatable(t).map(c => c.key);
  it("keeps the data's order, or puts close and volume first for prices", () => {
    assert.deepEqual(keys(traits("a,b\n1,2")), ["a", "b"]);
    assert.deepEqual(
      keys(traits("date,open,high,low,close,volume\n2024-01-01,1,2,0,1,9")),
      ["close", "volume", "open", "high", "low"],
    );
  });
  it("leaves out a band's bounds and mostly empty columns", () => {
    assert.deepEqual(keys(traits("v,lower,upper\n1,0,2\n2,1,3")), ["v"]);
    assert.deepEqual(keys(traits("a,b\n1,\n2,\n3,4")), ["a"]);
  });
});
