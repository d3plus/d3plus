import {it} from "vitest";
import assert from "assert";
import {bumpRankMatch, bumpRankRow} from "../../internal.ts";
import {tagHoverTicks} from "../../src/charts/features/hoverTicks.ts";

/** Plot rows for two series trading ranks over two periods. */
const rows = [
  {id: "Prime", x: 2021, y: 1, i: 0},
  {id: "Basic", x: 2021, y: 2, i: 1},
  {id: "Prime", x: 2022, y: 2, i: 2},
  {id: "Basic", x: 2022, y: 1, i: 3},
];
const viz = data => ({_formattedData: data});

it("bumpRankRow — the row at a rank in the first or last period", () => {
  assert.strictEqual(bumpRankRow(viz(rows), 1, "first"), rows[0]);
  assert.strictEqual(bumpRankRow(viz(rows), 1, "last"), rows[3]);
  assert.strictEqual(bumpRankRow(viz(rows), 3, "first"), undefined);
  assert.strictEqual(bumpRankRow(viz([]), 1, "first"), undefined);
  const dated = rows.map(d => ({...d, x: new Date(d.x, 0, 1)}));
  assert.strictEqual(bumpRankRow(viz(dated), 2, "last"), dated[2], "dates");
});

it("bumpRankMatch — a rank's label follows the series at that rank", () => {
  assert.deepStrictEqual(bumpRankMatch(viz(rows), 2, "first"), {
    field: "id",
    value: "Basic",
  });
  assert.deepStrictEqual(bumpRankMatch(viz(rows), 2, "last"), {
    field: "id",
    value: "Prime",
  });
  assert.strictEqual(bumpRankMatch(viz(rows), 5, "last"), undefined);
});

it("tagHoverTicks — tick labels match their value, or what a chart's match gives", () => {
  const tick = id => ({type: "text", datum: {data: {id, tick: true}}});
  const axis = () => ({type: "group", children: [tick(1), tick(2), tick(3)]});
  const plain = axis();
  tagHoverTicks(plain, "y");
  assert.deepStrictEqual(
    plain.children.map(n => n.hoverMatch),
    [1, 2, 3].map(value => ({field: "y", value})),
  );
  const own = axis();
  tagHoverTicks(own, "y", v =>
    v === 3 ? undefined : {field: "id", value: `s${v}`},
  );
  assert.deepStrictEqual(
    own.children.map(n => n.hoverMatch),
    [{field: "id", value: "s1"}, {field: "id", value: "s2"}, undefined],
  );
});
