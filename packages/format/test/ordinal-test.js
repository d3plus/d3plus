import {it} from "vitest";
import assert from "assert";
import {default as formatOrdinal} from "../src/formatOrdinal.ts";

const each = (locale, pairs) =>
  pairs.forEach(([n, text]) =>
    assert.strictEqual(formatOrdinal(n, locale), text, `${locale} ${n}`),
  );

it("formatOrdinal — English suffixes, teens included", () => {
  each("en-US", [
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [101, "101st"],
    [111, "111th"],
    [0, "0th"],
  ]);
  assert.strictEqual(formatOrdinal(2), "2nd", "en-US by default");
  each("en-GB", [[3, "3rd"]]);
  each("en", [[23, "23rd"]]);
});

it("formatOrdinal — Spanish, Portuguese, Chinese, French, and Estonian forms", () => {
  each("es-ES", [
    [1, "1.º"],
    [2, "2.º"],
    [10, "10.º"],
  ]);
  each("es-MX", [[3, "3.º"]]);
  each("pt-BR", [
    [1, "1º"],
    [2, "2º"],
  ]);
  each("zh-CN", [
    [1, "第1"],
    [12, "第12"],
  ]);
  each("fr-FR", [
    [1, "1er"],
    [2, "2e"],
  ]);
  each("et-EE", [[4, "4."]]);
  each("es", [[5, "5.º"]]);
  each("pt_BR", [[6, "6º"]]);
});

it("formatOrdinal — the plain number without an ordinal form", () => {
  each("ar-SA", [
    [1, "1"],
    [2, "2"],
  ]);
  each("xx-YY", [[7, "7"]]);
});

it("formatOrdinal — a number that isn't whole formats as a number", () => {
  assert.strictEqual(formatOrdinal(2.5), "2.5");
  assert.strictEqual(formatOrdinal(1234.5), "1.23k");
  assert.strictEqual(formatOrdinal(NaN), "N/A");
});
