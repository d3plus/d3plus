import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {profileData} from "../src/components/ChartChooser/columns.ts";
import {parseData} from "../src/components/ChartChooser/parse.ts";
import {
  chartCode,
  hub,
  itemGroups,
  measureData,
  PLANS,
  unnamed,
} from "../src/components/ChartChooser/plans.ts";
import {SAMPLES} from "../src/components/ChartChooser/samples.ts";
import {
  evaluate as evaluateTree,
  leaves,
} from "../src/components/ChartChooser/states.ts";
import {analyze} from "../src/components/ChartChooser/traits.ts";
import {TREE} from "../src/components/ChartChooser/tree.ts";
import {evaluate} from "../src/components/Playground/evaluate.ts";

const traits = text => analyze(profileData(parseData(text).rows));
/** A chart's generated config, run as the playground runs it. */
const config = (chart, t) => {
  const result = evaluate(chartCode(chart, t));
  assert.equal(result.error, undefined, chart);
  return result.config;
};

describe("PLANS", () => {
  it("has a plan for every chart in the tree", () => {
    const charts = new Set(leaves(TREE).map(l => l.node.chart));
    assert.deepEqual(
      [...charts].filter(c => !PLANS[c]),
      [],
    );
  });
  it("writes code that runs for every chart each sample lights", () => {
    for (const sample of SAMPLES) {
      const t = traits(sample.text);
      const states = evaluateTree(TREE, t);
      for (const {key, node} of leaves(TREE)) {
        if (!states.get(key).lit) continue;
        const c = config(node.chart, t);
        const rows = c.data ?? c.links;
        assert.ok(
          Array.isArray(rows) && rows.length,
          `${sample.id} ${node.chart}`,
        );
      }
    }
  });
});

describe("chartCode", () => {
  it("declares the data and the config", () => {
    const code = chartCode("Pie", traits("party,seats\nA,10\nB,20"));
    assert.equal(
      code,
      'const data = [\n  {party: "A", seats: 10},\n  {party: "B", seats: 20},\n];\n\nconst config = {\n  data,\n  groupBy: "party",\n  value: "seats",\n};\n',
    );
  });
  it("nests a treemap of nested categories, else groups by one", () => {
    const nestedT = traits("dept,team,cost\nA,x,1\nA,y,2\nB,z,3");
    assert.deepEqual(config("Treemap", nestedT).groupBy, ["dept", "team"]);
    assert.equal(config("Treemap", traits("a,v\nx,1\ny,2")).groupBy, "a");
  });
  it("ranks a bump chart's series at each date", () => {
    const t = traits(
      "year,team,pts\n2020,A,1\n2020,B,2\n2021,A,4\n2021,B,3\n2022,A,1\n2022,B,2\n2020,C,0\n2021,C,0\n2022,C,9",
    );
    const c = config("BumpChart", t);
    assert.equal(c.y, "rank");
    assert.deepEqual(
      c.data.filter(d => d.year === 2020).map(d => [d.team, d.rank]),
      [
        ["A", 2],
        ["B", 1],
        ["C", 3],
      ],
    );
  });
  it("reads dates as time, except years", () => {
    const months = traits("m,v\n2024-01,1\n2024-02,2\n2024-03,3");
    assert.equal(config("LinePlot", months).time, "m");
    const years = traits("year,v\n2020,1\n2021,2\n2022,3");
    assert.equal(config("LinePlot", years).time, undefined);
  });
  it("names each tile of a KPI, by its group or its value", () => {
    assert.equal(
      config("KPI", traits('[{"metric": "Uptime", "value": 99}]')).groupBy,
      "metric",
    );
    const prices = traits("date,close\n2024-01-01,1\n2024-01-02,2");
    assert.equal(config("KPI", prices).label(), "close");
  });
  it("draws radial lines a year around, a line per year", () => {
    const c = config(
      "RadialLine",
      traits("m,v\n2023-01,1\n2023-12,2\n2024-01,3"),
    );
    assert.equal(c.groupBy({m: "2024-03"}), "2024");
    assert.equal(c.x({m: "2024-03"}), "Mar");
  });
  it("splits sets named in text", () => {
    const c = config("Venn", traits("sets,size\nA,3\nB,2\nA & B,1"));
    assert.deepEqual(c.sets({sets: "A & B"}), ["A", "B"]);
  });
  it("renames link ends for node-link charts, and names them for flows", () => {
    const t = traits("from,to,w\nA,B,1\nB,C,2\nC,A,3");
    const network = config("Network", t);
    assert.deepEqual(network.links[0], {
      from: "A",
      to: "B",
      w: 1,
      source: "A",
      target: "B",
    });
    assert.equal(network.linkSize(network.links[2]), 3);
    const sankey = config("Sankey", t);
    assert.deepEqual(
      [sankey.linksSource, sankey.linksTarget, sankey.value],
      ["from", "to", "w"],
    );
    assert.equal(config("Rings", t).center, "A");
  });
  it("groups Gantt tasks under their phases", () => {
    const t = traits(
      "task,phase,start,end\na,P,2024-01-01,2024-01-02\nb,P,2024-01-02,2024-01-05\nc,Q,2024-01-05,2024-01-09",
    );
    assert.equal(config("Gantt", t).group, "phase");
  });
  it("names only the price columns not named as Candlestick expects", () => {
    const c = config(
      "Candlestick",
      traits("Day,open,high,low,close\n2024-01-01,1,2,0,1\n2024-01-02,1,2,0,1"),
    );
    assert.equal(c.date, "Day");
    assert.equal(c.open, undefined);
  });
});

describe("itemGroups", () => {
  it("groups by the category naming each row, nested in its parents", () => {
    assert.equal(itemGroups(traits("name,v\na,1\nb,2")), '"name"');
    assert.equal(
      itemGroups(traits("r,c,v\nX,a,1\nX,b,2\nY,c,3")),
      '["r", "c"]',
    );
  });
  it("else groups by row, under a category of a few values", () => {
    assert.equal(
      itemGroups(traits("g,v\na,1\na,2\nb,3")),
      '["g", (d, i) => i]',
    );
    assert.equal(itemGroups(traits("v,w\n1,2\n1,2")), "(d, i) => i");
  });
});

describe("unnamed", () => {
  it("names rows' tooltips by their group and hides their labels", () => {
    assert.deepEqual(unnamed(traits("g,v\na,1\na,2\nb,3")), [
      ["label", "d => d.g"],
      ["shapeConfig", "{label: false}"],
    ]);
    assert.deepEqual(unnamed(traits("name,v\na,1\nb,2")), []);
  });
});

describe("measureData", () => {
  it("is every row when the measures are complete, else the rows with them", () => {
    const t = traits("a,b,c\n1,2,3\n4,,6");
    const [a, b, c] = t.numbers;
    assert.equal(measureData(t, [a, c]), "data");
    assert.equal(measureData(t, [a, b]), "data.filter(d => d.b !== undefined)");
  });
  it("keeps a scatter's rows that have both measures", () => {
    const t = traits("name,x,y\na,1,2\nb,3,\nc,5,6");
    assert.deepEqual(
      config("Scatter", t).data.map(d => d.name),
      ["a", "c"],
    );
  });
});

describe("hub", () => {
  it("is the node with the most links", () => {
    assert.equal(hub(traits("source,target\nA,B\nC,B\nB,D")), "B");
  });
});
