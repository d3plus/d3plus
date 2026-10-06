import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Network, Treemap} from "../../es/index.js";
import {
  broadcastLegend,
  broadcastLink,
  forEachSceneRow,
  linkAs,
  linkKeys,
  linkedColorDefaults,
  linkMembers,
  linkPredicate,
  linkValues,
  registerLink,
  resolveLink,
  unregisterLink,
} from "../../es/internal.js";

/**
    Linked charts (#110): charts sharing a `link` group mirror each other's
    hover/active/highlight and legend hide/solo state, matched by the value of
    each chart's `by` key.
*/

const rows = [
  {region: "Americas", country: "Brazil", value: 10},
  {region: "Americas", country: "Chile", value: 5},
  {region: "Europe", country: "France", value: 8},
  {region: "Europe", country: "Spain", value: 6},
];

/** A painted-mark stand-in: `forEachSceneRow` reads `type`, `datum`, `index`. */
const mark = (row, index) => ({type: "rect", datum: row, index});

/** A chart with a fake painted scene over `data`, linked under `link`. */
function chart(Chart, link, data = rows) {
  const viz = new Chart().link(link);
  viz._chartScene = data.map(mark);
  viz._legendData = data;
  viz._id = d => d.country;
  viz._ids = d => [viz._id(d)];
  return viz;
}

const brazil = d => d.country === "Brazil";

let created = [];

/** A `chart` that `reset` unregisters, so one test's group never leaks into the next. */
function make(...args) {
  const viz = chart(...args);
  created.push(viz);
  return viz;
}

function reset() {
  created.forEach(viz => unregisterLink(viz));
  created = [];
}

it("resolveLink normalizes the string and object forms", () => {
  reset();
  const viz = new Treemap();
  assert.strictEqual(resolveLink(viz), null, "unlinked by default");

  viz.schema.link = "dash";
  viz._id = d => d.country;
  const fromString = resolveLink(viz);
  assert.strictEqual(fromString.group, "dash");
  assert.deepStrictEqual(
    [fromString.hover, fromString.active, fromString.highlight, fromString.legend],
    [true, true, true, true],
    "every interaction mirrors by default",
  );
  assert.strictEqual(fromString.by(rows[0], 0), "Brazil", "`by` defaults to the chart's id");

  viz.schema.link = {group: "dash", by: "region", hover: false};
  const fromKey = resolveLink(viz);
  assert.strictEqual(fromKey.by(rows[0], 0), "Americas", "a string `by` is a data key");
  assert.strictEqual(fromKey.hover, false);

  viz.schema.link = {group: "dash", by: d => d.value * 2};
  assert.strictEqual(resolveLink(viz).by(rows[0], 0), 20, "a function `by` is used as-is");

  viz.schema.link = {group: ""};
  assert.strictEqual(resolveLink(viz), null, "an empty group isn't linked");
});

it("registers on `link`, re-registers on change, and leaves on false or destroy()", () => {
  reset();
  const a = make(Treemap, "one");
  const b = make(BarChart, "one");
  assert.deepStrictEqual(linkMembers("one"), [a, b]);

  b.link("two");
  assert.deepStrictEqual(linkMembers("one"), [a], "moving groups leaves the old one");
  assert.deepStrictEqual(linkMembers("two"), [b]);

  b.link(false);
  assert.deepStrictEqual(linkMembers("two"), [], "link(false) unregisters");
  assert.strictEqual(b._linkGroup, undefined);

  a.destroy();
  assert.deepStrictEqual(linkMembers("one"), [], "destroy() unregisters");

  registerLink(a);
  assert.deepStrictEqual(linkMembers("one"), [a], "registerLink re-reads the config");
});

it("linkKeys flattens arrays, stringifies values, and drops null", () => {
  reset();
  assert.deepStrictEqual(linkKeys("Brazil"), ["Brazil"]);
  assert.deepStrictEqual(linkKeys(["Brazil", 2]), ["Brazil", "2"]);
  assert.deepStrictEqual(linkKeys([null, undefined, "x"]), ["x"]);
  assert.deepStrictEqual(linkKeys(new Date(5)), ["5"]);
});

it("forEachSceneRow visits each painted row once, unwrapped, with its index", () => {
  reset();
  const row = rows[0];
  const scene = [
    {type: "group", children: [{type: "rect", datum: row, index: 3}, {type: "text", datum: {data: row}}]},
    {type: "path", datum: {...rows[1], i: 7}},
    {type: "circle", datum: {data: row}},
  ];
  const seen = [];
  forEachSceneRow(scene, (r, i) => seen.push([r.country, i]));
  assert.deepStrictEqual(seen, [["Brazil", 3], ["Chile", 7]], "label + duplicate mark skipped; index falls back to row.i");
});

it("linkValues collects the `by` keys of the matched painted rows", () => {
  reset();
  const viz = make(Treemap, "dash");
  const by = d => d.region;
  assert.deepStrictEqual([...linkValues(viz, by, brazil)], ["Americas"]);
  assert.deepStrictEqual(
    [...linkValues(viz, d => [d.region, d.country], brazil)].sort(),
    ["Americas", "Brazil"],
    "array values contribute every entry",
  );

  viz._chartScene = undefined;
  viz._filteredData = rows;
  assert.deepStrictEqual(
    [...linkValues(viz, by, d => d.region === "Europe")],
    ["Europe"],
    "falls back to the filtered data before a first paint",
  );
});

it("linkPredicate matches rows sharing a key, and an empty set matches nothing", () => {
  reset();
  const link = {by: d => d.region};
  const pred = linkPredicate(link, new Set(["Europe"]));
  assert.deepStrictEqual(rows.filter(pred).map(d => d.country), ["France", "Spain"]);
  const none = linkPredicate(link, new Set());
  assert.strictEqual(rows.filter(none).length, 0);
});

it("hovering one chart hovers the matching rows in the others, without echo", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, "dash");
  let echoes = 0;
  const own = b.hover.bind(b);
  b.hover = function(...args) {
    echoes++;
    return own(...args);
  };

  BarChart.prototype.hover.call(b, brazil);
  assert.strictEqual(echoes, 0, "the target's own broadcast doesn't come back");
  assert.strictEqual(typeof a._hover, "function");
  assert.deepStrictEqual(rows.filter(a._hover).map(d => d.country), ["Brazil"]);

  b.hover(false);
  assert.strictEqual(a._hover, false, "clearing hover clears it everywhere");
});

it("mirrors active and highlight too", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, "dash");
  a.active(brazil);
  assert.deepStrictEqual(rows.filter(b._active).map(d => d.country), ["Brazil"]);
  a.highlight(d => d.region === "Europe");
  assert.deepStrictEqual(rows.filter(b._highlight).map(d => d.country), ["France", "Spain"]);
  a.active(false);
  assert.strictEqual(b._active, false);
});

it("dims everything in a chart that doesn't have the hovered value", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, "dash", rows.slice(2));
  a.hover(brazil);
  assert.strictEqual(typeof b._hover, "function");
  assert.strictEqual(rows.slice(2).filter(b._hover).length, 0);
});

it("respects per-interaction opt-outs and keeps groups isolated", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, {group: "dash", hover: false});
  const c = make(BarChart, "other");
  a.hover(brazil);
  assert.strictEqual(b._hover, undefined, "target opted out of hover");
  assert.strictEqual(c._hover, undefined, "a different group is untouched");
  a.active(brazil);
  assert.strictEqual(typeof b._active, "function", "the opt-out is per interaction");

  const d = make(BarChart, {group: "solo-out", highlight: false});
  const e = make(BarChart, "solo-out");
  d.highlight(brazil);
  assert.strictEqual(e._highlight, undefined, "source opted out of highlight");
});

it("links across granularity and differently-named keys", () => {
  reset();
  const regions = [{region: "Americas"}, {region: "Europe"}];
  const a = make(Treemap, {group: "dash", by: "region"}, regions);
  const countries = rows.map(d => ({...d, area: d.region}));
  const b = make(BarChart, {group: "dash", by: "area"}, countries);
  a.hover(d => d.region === "Americas");
  assert.deepStrictEqual(
    countries.filter(b._hover).map(d => d.country),
    ["Brazil", "Chile"],
    "a region hover matches every country in that region",
  );
});

it("linkAs narrows the rows the next broadcast treats as matched", () => {
  reset();
  const a = make(BarChart, "dash");
  const b = make(Treemap, "dash");
  linkAs(a, brazil);
  a.hover(() => true);
  assert.deepStrictEqual(rows.filter(b._hover).map(d => d.country), ["Brazil"]);
  a.hover(() => true);
  assert.strictEqual(rows.filter(b._hover).length, 4, "the override is one-shot");
});

it("broadcasts from charts that override hover (Network)", () => {
  reset();
  const nodes = [{id: "Brazil"}, {id: "Chile"}];
  const a = make(Network, {group: "dash", by: "id"}, nodes);
  const b = make(BarChart, {group: "dash", by: "country"});
  a.hover(d => d.id === "Chile");
  assert.deepStrictEqual(rows.filter(b._hover).map(d => d.country), ["Chile"]);
});

it("broadcastLink ignores reads (undefined) and unlinked charts", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, "dash");
  broadcastLink(a, "hover", undefined);
  assert.strictEqual(b._hover, undefined);
  const lone = new BarChart();
  broadcastLink(lone, "hover", brazil);
  assert.strictEqual(b._hover, undefined);
});

it("mirrors legend hide/solo and re-renders the changed charts", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, "dash");
  let renders = 0;
  b.render = () => renders++;

  a._hidden = ["Brazil"];
  broadcastLegend(a);
  assert.deepStrictEqual(b._hidden, ["Brazil"]);
  assert.strictEqual(renders, 1);

  broadcastLegend(a);
  assert.strictEqual(renders, 1, "no re-render when nothing changed");

  a._hidden = [];
  a._solo = ["Chile"];
  broadcastLegend(a);
  assert.deepStrictEqual([b._hidden, b._solo], [[], ["Chile"]]);
});

it("maps legend state across groupings: solo on any key, hide on all keys", () => {
  reset();
  const a = make(Treemap, {group: "dash", by: "country"});
  const regionLegend = [
    {region: "Americas", country: ["Brazil", "Chile"]},
    {region: "Europe", country: ["France", "Spain"]},
  ];
  const b = make(BarChart, {group: "dash", by: "country"}, regionLegend);
  b._id = d => d.region;
  b.render = () => {};

  a._hidden = ["Brazil"];
  broadcastLegend(a);
  assert.deepStrictEqual(b._hidden, [], "a region stays while some of its countries show");

  a._hidden = ["Brazil", "Chile"];
  broadcastLegend(a);
  assert.deepStrictEqual(b._hidden, ["Americas"], "…and hides once all of them are hidden");

  a._hidden = [];
  a._solo = ["France"];
  broadcastLegend(a);
  assert.deepStrictEqual(b._solo, ["Europe"], "solo'ing one country solos its region");
});

it("skips legend sync for opted-out or undrawn charts", () => {
  reset();
  const a = make(Treemap, "dash");
  const b = make(BarChart, {group: "dash", legend: false});
  const c = make(BarChart, "dash");
  c._legendData = [];
  a._hidden = ["Brazil"];
  broadcastLegend(a);
  assert.deepStrictEqual(b._hidden, []);
  assert.deepStrictEqual(c._hidden, []);
});

it("linked charts share categorical colors, whatever order they assign them in", () => {
  reset();
  const a = make(Treemap, "colors");
  const b = make(BarChart, "colors");
  const scaleA = linkedColorDefaults(a).scale;
  const first = scaleA("Europe");
  scaleA("Americas");
  const scaleB = linkedColorDefaults(b).scale;
  assert.strictEqual(scaleB, scaleA, "one scale for the group");
  assert.strictEqual(scaleB("Americas"), scaleA("Americas"));
  assert.strictEqual(scaleB("Europe"), first);
  assert.strictEqual(a.schema.colorDefaults.scale, a._autoColorScale, "the chart's own scale is untouched");
});

it("keeps a chart's own colors when it opts out or sets its own scale", () => {
  reset();
  const a = make(Treemap, "colors");
  const b = make(BarChart, {group: "colors", color: false});
  const c = make(BarChart, "colors");
  c.colorDefaults({scale: ["#000", "#fff"]});
  const d = new BarChart();
  assert.notStrictEqual(linkedColorDefaults(b).scale, linkedColorDefaults(a).scale, "color: false");
  assert.strictEqual(linkedColorDefaults(c).scale, c.schema.colorDefaults.scale, "custom scale wins");
  assert.strictEqual(linkedColorDefaults(d), d.schema.colorDefaults, "unlinked charts use their own");

  c.colorDefaults({missing: "#ccc"});
  assert.strictEqual(linkedColorDefaults(c).scale, c.schema.colorDefaults.scale, "partial overrides keep the custom scale");
  const e = make(BarChart, "colors");
  e.colorDefaults({missing: "#ccc"});
  assert.strictEqual(linkedColorDefaults(e).scale, linkedColorDefaults(a).scale, "…and keep sharing when it's the default one");
});

it("drops a group's shared colors once its last chart leaves", () => {
  reset();
  const a = make(Treemap, "colors");
  const shared = linkedColorDefaults(a).scale;
  shared("Asia");
  a.link(false);
  a.link("colors");
  assert.notStrictEqual(linkedColorDefaults(a).scale, shared, "a fresh scale for the re-formed group");
});
