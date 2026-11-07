import {it} from "vitest";
import assert from "assert";
import validateData, {coerceCell} from "../src/validateData.ts";

/** The straightforward coercion `validateData` must match exactly. */
function reference(data) {
  if (data && data instanceof Array) {
    data.forEach(d => {
      for (const k in d) {
        const v = d[k];
        if (typeof v === "string") {
          if (!isNaN(v)) d[k] = parseFloat(v);
          else if (v.toLowerCase() === "false") d[k] = false;
          else if (v.toLowerCase() === "true") d[k] = true;
        }
      }
    });
  }
  return data;
}

/** The reference result for one string cell. */
const referenceCell = v => reference([{v}])[0].v;

const edgeCases = [
  "",
  " ",
  "\t",
  " 1 ",
  "\t42\n",
  " 42",
  "﻿42",
  "​42",
  "  7  ",
  "1e3",
  "1E3",
  "1e+3",
  "1e-3",
  "1e",
  "e3",
  "1e400",
  "-1e400",
  "1e-400",
  "0x10",
  "0X1f",
  "-0x10",
  "+0x10",
  "0b101",
  "0B11",
  "0o17",
  "0O7",
  "0x",
  "0b",
  "0o",
  "0xg",
  "00x10",
  "NaN",
  "nan",
  "-NaN",
  "Infinity",
  "-Infinity",
  "+Infinity",
  " Infinity ",
  "infinity",
  "INFINITY",
  "Infinityx",
  "true",
  "TRUE",
  "True",
  "tRuE",
  " true",
  "true ",
  "false",
  "FALSE",
  "False",
  "falsey",
  "fals",
  "tru",
  "null",
  "undefined",
  "0",
  "-0",
  "+0",
  "0.0",
  "-0.0",
  "00",
  "007",
  "-007",
  "0.5",
  ".5",
  "-.5",
  "+.5",
  "5.",
  "5.e2",
  ".",
  "+",
  "-",
  "+-1",
  "--1",
  "1_000",
  "1,000",
  "1 000",
  "12abc",
  "abc12",
  "9007199254740993",
  "12345678901234567890123",
  "0.1000000000000000055511151231257827",
  "1".repeat(400),
  "9".repeat(309),
  "9".repeat(310),
  `0.${"0".repeat(330)}1`,
  `${"1".repeat(30)}.${"9".repeat(30)}e-10`,
  "١٢",
  "１２",
  "Product A",
  "C000",
  "İ",
  "K",
  "𐐀",
];

it("coerceCell: matches the reference on edge cases", () => {
  for (const v of edgeCases) {
    assert.ok(
      Object.is(coerceCell(v), referenceCell(v)),
      `${JSON.stringify(v)}: ${coerceCell(v)} vs ${referenceCell(v)}`,
    );
  }
});

it("coerceCell: matches the reference on random strings", () => {
  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const tokens = [
    ..."0123456789",
    ".",
    "e",
    "E",
    "+",
    "-",
    " ",
    "\t",
    "\n",
    " ",
    "﻿",
    "x",
    "X",
    "b",
    "B",
    "o",
    "O",
    "_",
    "Infinity",
    "NaN",
    "true",
    "TRUE",
    "False",
    "a",
    "z",
    "İ",
    "K",
  ];
  for (let i = 0; i < 100000; i++) {
    let v = "";
    const n = Math.floor(random() * 6);
    for (let j = 0; j < n; j++)
      v += tokens[Math.floor(random() * tokens.length)];
    assert.ok(
      Object.is(coerceCell(v), referenceCell(v)),
      `${JSON.stringify(v)}: ${coerceCell(v)} vs ${referenceCell(v)}`,
    );
  }
});

it("coerceCell: matches the reference on random numbers written out", () => {
  let seed = 11;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 20000; i++) {
    const x = (random() - 0.5) * 10 ** Math.floor(random() * 40 - 20);
    for (const v of [
      String(x),
      x.toFixed(Math.floor(random() * 20)),
      x.toExponential(Math.floor(random() * 20)),
      x.toPrecision(1 + Math.floor(random() * 21)),
    ]) {
      assert.ok(Object.is(coerceCell(v), referenceCell(v)), v);
    }
  }
});

it("validateData: rows coerce the same as the reference", () => {
  const rows = () => [
    ...edgeCases.map((v, i) => ({id: `r${i}`, v, n: i, b: true})),
    {},
    {nested: {value: "1"}, list: ["2"], none: null, undef: undefined},
    {value: "5", flag: "TRUE", off: "False", name: "alpha"},
  ];
  assert.deepStrictEqual(validateData(rows()), reference(rows()));
});

it("validateData: returns its argument, changing only Arrays", () => {
  const rows = [{value: "1"}];
  assert.strictEqual(validateData(rows), rows);
  assert.deepStrictEqual(rows, [{value: 1}]);
  const object = {value: "1"};
  assert.strictEqual(validateData(object), object);
  assert.deepStrictEqual(object, {value: "1"});
  assert.strictEqual(validateData("1"), "1");
  assert.strictEqual(validateData(null), null);
  assert.strictEqual(validateData(undefined), undefined);
  assert.deepStrictEqual(validateData([]), []);
});
