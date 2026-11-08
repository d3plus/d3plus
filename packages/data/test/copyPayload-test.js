import {it} from "vitest";
import assert from "assert";
import {csvParse, tsvParse} from "d3-dsv";
import copyPayload from "../src/copyPayload.ts";

/** Asserts `copyPayload(value)` equals `structuredClone(value)` and shares nothing with it. */
function check(value, message) {
  const copy = copyPayload(value);
  const reference = structuredClone(value);
  assert.deepStrictEqual(copy, reference, message);
  if (value && typeof value === "object") {
    assert.notStrictEqual(copy, value, message);
    assert.strictEqual(
      Object.getPrototypeOf(copy),
      Object.getPrototypeOf(reference),
      message,
    );
  }
  return copy;
}

it("copyPayload: primitives pass through", () => {
  for (const v of ["", "text", 0, -0, NaN, Infinity, 1.5, true, false, null])
    assert.ok(Object.is(copyPayload(v), v), String(v));
  assert.strictEqual(copyPayload(undefined), undefined);
});

it("copyPayload: matches structuredClone on parsed JSON", () => {
  const cases = [
    "[]",
    "{}",
    "[1]",
    '[{"a":1,"b":"x","c":null,"d":true}]',
    '{"edges":[{"source":"a","target":"b"}],"vertices":[{"id":"a","x":0}]}',
    '{"type":"Topology","objects":{"s":{"type":"GeometryCollection","geometries":[{"type":"Polygon","arcs":[[0]]}]}},"arcs":[[[0,0],[1,1]]]}',
    '[[1,2],[3,[4,[5,{"deep":[6]}]]]]',
    '{"__proto__":{"polluted":true},"a":1}',
    '[{"__proto__":1,"constructor":"c","hasOwnProperty":2}]',
    '{"":"empty key","0":"zero","1":"one"}',
    '[{"a":1},{"a":1},{"b":2}]',
  ];
  for (const json of cases) {
    const copy = check(JSON.parse(json), json);
    assert.strictEqual({}.polluted, undefined, "no prototype pollution");
    if (json.includes("__proto__")) {
      const source = Array.isArray(copy) ? copy[0] : copy;
      assert.ok(Object.hasOwn(source, "__proto__"), "an own __proto__ key");
    }
  }
});

it("copyPayload: matches structuredClone on random seeded JSON", () => {
  let seed = 3;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const value = depth => {
    const r = random();
    if (depth > 3 || r < 0.4)
      return [1.5, -2, "s", "", true, false, null, 0][Math.floor(random() * 8)];
    if (r < 0.7)
      return Array.from({length: Math.floor(random() * 5)}, () =>
        value(depth + 1),
      );
    const out = {};
    for (let i = Math.floor(random() * 5); i > 0; i--)
      out[`k${Math.floor(random() * 10)}`] = value(depth + 1);
    return out;
  };
  for (let i = 0; i < 500; i++) {
    const v = value(0);
    check(JSON.parse(JSON.stringify(v)), JSON.stringify(v));
  }
});

it("copyPayload: keeps a parsed file's columns, as structuredClone does", () => {
  for (const rows of [
    csvParse("id,value\na,1\nb,2"),
    tsvParse("id\tvalue\na\t3"),
    csvParse("id,value"),
    csvParse(""),
  ]) {
    const copy = check(rows);
    assert.deepStrictEqual(copy.columns, rows.columns);
    assert.notStrictEqual(copy.columns, rows.columns);
  }
});

it("copyPayload: changing the copy leaves the source intact", () => {
  const source = JSON.parse('{"rows":[{"id":"a","value":1}],"meta":{"n":1}}');
  const copy = copyPayload(source);
  copy.rows[0].value = 99;
  copy.rows.push({id: "b"});
  copy.meta.n = 2;
  assert.deepStrictEqual(source, {rows: [{id: "a", value: 1}], meta: {n: 1}});
});
