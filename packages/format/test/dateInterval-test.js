import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";
import {dateInterval} from "../index.ts";

/**
    `dateInterval`: the calendar interval a set of dates steps by, which
    `formatDate` labels them at.
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

const local = (...args) => new Date(...args);

it("names the coarsest interval every step is a whole multiple of", () => {
  assert.strictEqual(
    dateInterval([local(2020, 0, 1), local(2021, 0, 1), local(2023, 0, 1)]),
    "year",
  );
  assert.strictEqual(
    dateInterval([local(2024, 0, 1), local(2024, 3, 1), local(2024, 9, 1)]),
    "quarter",
  );
  assert.strictEqual(
    dateInterval([local(2024, 0, 15), local(2024, 1, 15), local(2024, 2, 15)]),
    "month",
  );
  assert.strictEqual(
    dateInterval([local(2024, 0, 1), local(2024, 0, 8), local(2024, 0, 15)]),
    "day",
  );
  assert.strictEqual(
    dateInterval([local(2024, 0, 1, 0), local(2024, 0, 1, 6)]),
    "hour",
  );
  assert.strictEqual(
    dateInterval([local(2024, 0, 1, 0), local(2024, 0, 1, 0, 30)]),
    undefined,
  );
});

it("reads the dates' calendar in UTC with utc", () => {
  const months = [0, 1, 2].map(m => new Date(Date.UTC(2024, m, 1)));
  assert.strictEqual(dateInterval(months, {utc: true}), "month");
  const years = [2020, 2021, 2022].map(y => new Date(Date.UTC(y, 0, 1)));
  assert.strictEqual(dateInterval(years, {utc: true}), "year");
  // Read in local time west of UTC, UTC midnights still step by whole years.
  assert.strictEqual(dateInterval(years), "year");
});

it("reads a single date as yearly", () => {
  assert.strictEqual(dateInterval([local(2024, 5, 1)]), "year");
});
