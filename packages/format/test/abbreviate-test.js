import {it} from "vitest";
import assert from "assert";
import {formatLocale} from "@d3plus/locales";
import {default as abbreviate} from "../src/formatAbbreviate.ts";

it("abbreviate", () => {
  assert.strictEqual("1.23Q", abbreviate(1234567890000000000), "quintillion");
  assert.strictEqual("1.23q", abbreviate(1234567890000000), "quadrillion");
  assert.strictEqual("1.23T", abbreviate(1234567890000), "trillion");
  assert.strictEqual("1.23B", abbreviate(1234567890), "billion");
  assert.strictEqual("1.23M", abbreviate(1234567), "million");
  assert.strictEqual("123k", abbreviate(123456), "hundred thousand");
  assert.strictEqual("12.3k", abbreviate(12345), "ten thousand");
  assert.strictEqual("1.23k", abbreviate(1234), "thousand");
  assert.strictEqual("123", abbreviate(123), "hundred");
  assert.strictEqual("12", abbreviate(12), "ten");
  assert.strictEqual("1", abbreviate(1), "single");
  assert.strictEqual("0.12", abbreviate(0.12), "tenths");
  assert.strictEqual("0.012", abbreviate(0.0123), "hundredths");

  assert.strictEqual("-12.3k", abbreviate("-12345"), "string parsing");
  assert.strictEqual("-12.3k", abbreviate(-12345), "bigs negatives");
  assert.strictEqual("-12", abbreviate(-12), "small negatives");

  assert.strictEqual(
    "1B",
    abbreviate(1000000009),
    "large - removes trailing zeros and period",
  );
  assert.strictEqual("0.1", abbreviate(0.1), "small - removes trailing zeros");
  assert.strictEqual(
    "0.01",
    abbreviate(0.01),
    "small - removes trailing zeros",
  );

  assert.strictEqual(
    "10 miljonit",
    abbreviate(10000000, "et-EE"),
    "estonian locale",
  );
  assert.strictEqual(
    "1,23 triljonit",
    abbreviate(1234567890000, "et-EE"),
    "trillion in estonian",
  );
  assert.strictEqual("1mm", abbreviate(1000000, "es-ES"), "spanish locale");
  assert.strictEqual(
    "1,23t",
    abbreviate(1234567890000, "es-ES"),
    "trillion in spanish",
  );

  assert.strictEqual(
    "0.12",
    abbreviate(0.12, "en-US"),
    "decimal format in english",
  );
  assert.strictEqual(
    "0,12",
    abbreviate(0.12, "et-EE"),
    "decimal format in estonian",
  );
  assert.strictEqual(
    "1,000",
    abbreviate(1000, "en-US", ",.4r"),
    "trillion in english",
  );
  assert.strictEqual(
    "1 000",
    abbreviate(1000, "et-EE", ",.4r"),
    "trillion in estonian",
  );
});

it("abbreviate: whole numbers have no decimals in es-ES", () => {
  assert.strictEqual(abbreviate(30, "es-ES"), "30");
  assert.strictEqual(abbreviate(-30, "es-ES"), "-30");
  assert.strictEqual(abbreviate(1, "es-ES"), "1");
  assert.strictEqual(abbreviate(99, "es-ES"), "99");
  assert.strictEqual(abbreviate(1.5, "es-ES"), "1,5");
  assert.strictEqual(abbreviate(0.5, "es-ES"), "0,5");
  assert.strictEqual(abbreviate(12.5, "es-ES"), "12,5");
  assert.strictEqual(abbreviate(1500, "es-ES"), "1,5k");
});

it("abbreviate: an explicit precision keeps its trailing zeros", () => {
  assert.strictEqual(abbreviate(1.5, "en-US", ",.2f"), "1.50");
  assert.strictEqual(abbreviate(30, "en-US", ".1f"), "30.0");
  assert.strictEqual(abbreviate(-1.5, "en-US", ".2f"), "-1.50");
  assert.strictEqual(abbreviate(1.505, "en-US", ".4f"), "1.5050");
  assert.strictEqual(abbreviate(1.5, "en-US", ".3~g"), "1.5");
  assert.strictEqual(abbreviate(1000, "es-ES", ",.0f"), "1.000");
  assert.strictEqual(abbreviate(1500.5, "es-ES", ",.2f"), "1.500,50");
  assert.strictEqual(abbreviate(1000, "fr-FR", ",.2f"), "1 000,00");
  for (const [name, locale] of Object.entries(formatLocale)) {
    const {decimal, thousands} = locale.delimiters;
    assert.strictEqual(
      abbreviate(1234.5, name, ",.2f"),
      `1${thousands}234${decimal}50`,
      `${name}: 1234.5`,
    );
    assert.strictEqual(
      abbreviate(30, name, ".1f"),
      `30${decimal}0`,
      `${name}: 30`,
    );
    assert.strictEqual(
      abbreviate(-30, name, ".2f"),
      `-30${decimal}00`,
      `${name}: -30`,
    );
  }
});

it("abbreviate: every locale", () => {
  for (const [name, locale] of Object.entries(formatLocale)) {
    const point = locale.delimiters.decimal;
    const sep = locale.separator || "";
    const [k, m] = [locale.suffixes[9], locale.suffixes[10]];
    const dec = s => s.replace(".", point);
    const cases = [
      [0, "0"],
      [1, "1"],
      [5, "5"],
      [30, "30"],
      [-30, "-30"],
      [99, "99"],
      [100, "100"],
      [101, "101"],
      [999, "999"],
      [-999, "-999"],
      [999.5, `1${sep}${k}`],
      [1000, `1${sep}${k}`],
      [-1000, `-1${sep}${k}`],
      [1001, `1${sep}${k}`],
      [1500, `${dec("1.5")}${sep}${k}`],
      [9999, `10${sep}${k}`],
      [999999, `1${sep}${m}`],
      [1000000, `1${sep}${m}`],
      [2500000, `${dec("2.5")}${sep}${m}`],
      [1.5, dec("1.5")],
      [12.5, dec("12.5")],
      [-12.5, dec("-12.5")],
      [0.5, dec("0.5")],
      [-0.25, dec("-0.25")],
      [0.012, dec("0.012")],
      [2.25, dec("2.25")],
      [30.05, dec("30.1")],
    ];
    for (const [n, expected] of cases) {
      assert.strictEqual(abbreviate(n, name), expected, `${name}: ${n}`);
    }
  }
});
