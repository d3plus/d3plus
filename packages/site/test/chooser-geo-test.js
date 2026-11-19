import {describe, it} from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  findState,
  ISO3_NUMERIC,
  isIso3,
  stateCode,
  US_STATES,
} from "../src/components/ChartChooser/geo.ts";

const topojson = file =>
  JSON.parse(
    fs.readFileSync(new URL(`../public/data/${file}`, import.meta.url), "utf8"),
  );

describe("ISO3_NUMERIC", () => {
  it("covers every country the world map draws, with unique codes", () => {
    const ids = topojson("countries-110m.json")
      .objects.countries.geometries.map(g => g.id)
      .filter(Boolean);
    const numeric = new Set(Object.values(ISO3_NUMERIC));
    assert.deepEqual(
      ids.filter(id => !numeric.has(id)),
      [],
    );
    assert.equal(numeric.size, Object.keys(ISO3_NUMERIC).length);
  });
});

describe("US_STATES", () => {
  it("matches the states map's FIPS codes and names", () => {
    const map = topojson("states-10m.json").objects.states.geometries;
    const byFips = Object.fromEntries(map.map(g => [g.id, g.properties.name]));
    for (const s of US_STATES) assert.equal(byFips[s.fips], s.name, s.postal);
    assert.equal(US_STATES.length, 51);
  });
});

describe("findState", () => {
  it("finds a state by postal code, name, or FIPS code", () => {
    assert.equal(findState("ca", "postal").name, "California");
    assert.equal(findState("new york", "name").postal, "NY");
    assert.equal(findState("6", "fips").postal, "CA");
    assert.equal(findState("ZZ", "postal"), undefined);
  });
});

describe("isIso3", () => {
  it("is whether every value is a country code", () => {
    assert.equal(isIso3(["USA", "BRA"]), true);
    assert.equal(isIso3(["USA", "usa"]), false);
    assert.equal(isIso3([]), false);
  });
});

describe("stateCode", () => {
  it("names the code every value names a state in", () => {
    assert.equal(stateCode(["CA", "TX"]), "postal");
    assert.equal(stateCode(["06", "48"]), "fips");
    assert.equal(stateCode(["California", "texas"]), "name");
  });
  it("is undefined for anything else", () => {
    assert.equal(stateCode(["CA", "Paris"]), undefined);
    assert.equal(stateCode(["6"]), undefined);
    assert.equal(stateCode([]), undefined);
  });
});
