import assert from "assert";
import {default as date} from "../src/date.js";
import it from "./jsdom.js";

it("date", () => {

  assert.strictEqual(date(false),         false, "Fails gracefully with false value");
  assert.strictEqual(date(undefined), undefined, "Fails gracefully with undefined value");
  assert.strictEqual(date(NaN),             NaN, "Fails gracefully with NaN value");

  assert.strictEqual(date(1234).getFullYear(),   1234, "AD: 4-digit year");
  assert.strictEqual(date(123).getFullYear(),     123, "AD: 3-digit year");
  assert.strictEqual(date(12).getFullYear(),       12, "AD: 2-digit year");
  assert.strictEqual(date(1).getFullYear(),         1, "AD: 1-digit year");
  assert.strictEqual(date(0).getFullYear(),         0, "0");
  assert.strictEqual(date(-1).getFullYear(),       -1, "BC: 1-digit year");
  assert.strictEqual(date(-12).getFullYear(),     -12, "BC: 2-digit year");
  assert.strictEqual(date(-123).getFullYear(),   -123, "BC: 3-digit year");
  assert.strictEqual(date(-1234).getFullYear(), -1234, "BC: 4-digit year");

  assert.strictEqual(date("6/12/1987").getFullYear(),   1987, "AD: shorthand date w/ slashes");
  assert.strictEqual(date("6/12/-1987").getFullYear(), -1987, "BC: shorthand date w/ slashes");
  assert.strictEqual(date("6.12.1987").getFullYear(),   1987, "AD: shorthand date w/ dots");
  assert.strictEqual(date("6.12.-1987").getFullYear(), -1987, "BC: shorthand date w/ dots");
  assert.strictEqual(date("6-12-1987").getFullYear(),   1987, "AD: shorthand date w/ hyphens");
  assert.strictEqual(date("6-12--1987").getFullYear(), -1987, "BC: shorthand date w/ hyphens");

  assert.strictEqual(date("Mon Jan 01 100 00:00:00 GMT-0500 (EST)").getFullYear(),   100, "AD: datestring");
  assert.strictEqual(date("Mon Jan 01 -100 00:00:00 GMT-0500 (EST)").getFullYear(), -100, "BC: datestring");

  assert.strictEqual(date("Q21987").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase prefix");
  assert.strictEqual(date("Q2 1987").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase prefix w/ space");
  assert.strictEqual(date("Q2-1987").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase prefix w/ hyphen");
  assert.strictEqual(date("q21987").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase prefix");
  assert.strictEqual(date("q2 1987").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase prefix w/ space");
  assert.strictEqual(date("q2-1987").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase prefix w/ hyphen");

  assert.strictEqual(date("1987Q2").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase suffix");
  assert.strictEqual(date("1987 Q2").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase suffix w/ space");
  assert.strictEqual(date("1987-Q2").getTime(), date("04/01/1987").getTime(), "Quarter: uppercase suffix w/ hyphen");
  assert.strictEqual(date("1987q2").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase suffix");
  assert.strictEqual(date("1987 q2").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase suffix w/ space");
  assert.strictEqual(date("1987-q2").getTime(), date("04/01/1987").getTime(), "Quarter: lowercase suffix w/ hyphen");

});
