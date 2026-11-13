import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";
import {default as date} from "../src/date.ts";

/**
    `date(value, {utc: true})` reads a value that names no time zone in UTC, and
    leaves timestamps, Dates and zoned strings as they are.
*/

let zone;
beforeAll(() => {
  zone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
});
afterAll(() => {
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

const utc = (...args) => Date.UTC(...args);

it("reads years, quarters and months at UTC midnight", () => {
  assert.strictEqual(+date(2024, {utc: true}), utc(2024, 0, 1));
  assert.strictEqual(+date("2024", {utc: true}), utc(2024, 0, 1));
  assert.strictEqual(+date("Q2 2024", {utc: true}), utc(2024, 3, 1));
  assert.strictEqual(+date("2024-03", {utc: true}), utc(2024, 2, 1));
  assert.strictEqual(+date(2024), +new Date(2024, 0, 1), "local by default");
});

it("reads dates and times without a zone in UTC", () => {
  assert.strictEqual(+date("2024-03-01", {utc: true}), utc(2024, 2, 1));
  assert.strictEqual(+date("03/01/2024", {utc: true}), utc(2024, 2, 1));
  assert.strictEqual(
    +date("2024-03-01T09:30:00", {utc: true}),
    utc(2024, 2, 1, 9, 30),
  );
  assert.strictEqual(
    +date("2024-03-01"),
    +new Date(2024, 2, 1),
    "local by default",
  );
});

it("keeps early years in UTC", () => {
  const d = date(12, {utc: true});
  assert.strictEqual(d.getUTCFullYear(), 12);
  assert.strictEqual(d.getUTCMonth(), 0);
  assert.strictEqual(d.getUTCDate(), 1);
  assert.strictEqual(date(-1234, {utc: true}).getUTCFullYear(), -1234);
});

it("leaves timestamps, Dates and zoned strings as they are", () => {
  const t = utc(2024, 2, 1, 12);
  assert.strictEqual(+date(t, {utc: true}), t);
  const d = new Date(t);
  assert.strictEqual(date(d, {utc: true}), d);
  assert.strictEqual(+date("2024-03-01T12:00:00Z", {utc: true}), t);
  assert.strictEqual(+date("2024-03-01T07:00:00-05:00", {utc: true}), t);
  assert.strictEqual(date(false, {utc: true}), false);
  assert.strictEqual(date(undefined, {utc: true}), undefined);
});

it("only an options object reads UTC, so array.map(date) stays local", () => {
  const parsed = ["2024-03-01", "2024-03-02"].map(date);
  assert.deepStrictEqual(parsed.map(Number), [
    +new Date(2024, 2, 1),
    +new Date(2024, 2, 2),
  ]);
});

it("reads local time without utc in the options", () => {
  assert.strictEqual(+date("2024-03-01", {}), +new Date(2024, 2, 1));
  assert.strictEqual(+date("2024-03-01", {utc: false}), +new Date(2024, 2, 1));
});
