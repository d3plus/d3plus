import type {Column} from "./columns.js";
import {objectKey, prop, str} from "./code.js";
import type {Field, Plan} from "./code.js";
import {findState, ISO3_NUMERIC} from "./geo.js";
import type {Traits} from "./traits.js";

/** The distinct text values of a column. */
const distinct = (t: Traits, col: Column) => [
  ...new Set(t.rows.filter(r => col.key in r).map(r => String(r[col.key]))),
];

/** An object literal mapping each key to its value, sorted by key. */
function lookup(name: string, pairs: [string, string][]): string {
  const body = pairs
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `  ${objectKey(key)}: ${str(value)},`)
    .join("\n");
  return `const ${name} = {\n${body}\n};`;
}

/**
 * A category one-to-one with a code column, with longer values: the
 * country or state names to label the code's regions with.
 */
function names(t: Traits, code: Column): Column | undefined {
  return t.categories.find(
    c =>
      c !== code &&
      !c.geo &&
      c.unique === code.unique &&
      (c.length ?? 0) > (code.length ?? 0),
  );
}

/** `label` and `colorScale` for a map's regions or points. */
function decorate(t: Traits, code?: Column): Field[] {
  const fields: Field[] = [];
  const label = code && names(t, code);
  if (label) fields.push(["label", `d => ${prop(label.key)}`]);
  if (t.value) fields.push(["colorScale", str(t.value.key)]);
  return fields;
}

const US_MAP: Field[] = [
  ["topojson", str("/data/states-10m.json")],
  ["projection", str("geoAlbersUsa")],
  ["ocean", str("transparent")],
  ["tiles", "false"],
];

/** A Geomap of countries keyed by ISO alpha-3 codes. */
function countries(t: Traits, iso3: Column): Plan {
  const pairs = distinct(t, iso3)
    .filter(c => c in ISO3_NUMERIC)
    .map(c => [ISO3_NUMERIC[c], c] as [string, string]);
  return {
    prelude: [
      "// The world map keys countries by their ISO numeric codes: match them to yours.",
      lookup("iso3", pairs),
    ],
    fields: [
      ["data", "data"],
      ["groupBy", str(iso3.key)],
      ...decorate(t, iso3),
      ["topojson", str("/data/countries-110m.json")],
      ["topojsonId", "d => iso3[d.id]"],
      ["ocean", str("transparent")],
      ["tiles", "false"],
    ],
  };
}

/** A Geomap of US states, matched to the map by name, postal code, or FIPS. */
function states(t: Traits, state: Column): Plan {
  const fields: Field[] = [
    ["data", "data"],
    ["groupBy", str(state.key)],
    ...decorate(t, state),
  ];
  if (state.stateCode === "fips") return {fields: [...fields, ...US_MAP]};
  if (state.stateCode === "name")
    return {
      fields: [...fields, ...US_MAP, ["topojsonId", "d => d.properties.name"]],
    };
  const pairs = distinct(t, state).map(
    s =>
      [findState(s, "postal")!.fips, findState(s, "postal")!.postal] as [
        string,
        string,
      ],
  );
  return {
    prelude: [
      "// The states map keys states by their FIPS codes: match them to yours.",
      lookup("postal", pairs),
    ],
    fields: [...fields, ...US_MAP, ["topojsonId", "d => postal[d.id]"]],
  };
}

/**
 * The fewest points a map clusters: below it, every row draws its own dot;
 * from it on, nearby points merge into clusters, which keeps a dense map
 * legible.
 */
export const CLUSTER_FROM = 200;

/** A Geomap of points at each row's latitude and longitude. */
function points(t: Traits, lat: Column, lon: Column): Plan {
  const inUs = t.rows.every(r => {
    const [y, x] = [r[lat.key], r[lon.key]];
    return (
      typeof y === "number" &&
      typeof x === "number" &&
      y > 24 &&
      y < 50 &&
      x > -125 &&
      x < -66
    );
  });
  const item = t.categories.find(c => c.unique === t.rows.length);
  return {
    fields: [
      ["data", "data"],
      ["groupBy", item ? str(item.key) : "(d, i) => i"],
      ["point", `d => [${prop(lon.key)}, ${prop(lat.key)}]`],
      // A few points each draw their own dot; many cluster (the default).
      ...(t.rows.length < CLUSTER_FROM
        ? ([["pointCluster", "false"]] as Field[])
        : []),
      ...(t.value
        ? ([
            ["pointSize", `d => ${prop(t.value.key)}`],
            ["colorScale", str(t.value.key)],
          ] as Field[])
        : []),
      ...(inUs
        ? US_MAP
        : ([
            ["topojson", str("/data/countries-110m.json")],
            ["ocean", str("transparent")],
            ["tiles", "false"],
          ] as Field[])),
    ],
  };
}

/** A TileGridMap of US states: by postal code or FIPS, or names mapped to codes. */
function tiles(t: Traits, state: Column): Plan {
  if (state.stateCode !== "name")
    return {
      fields: [
        ["data", "data"],
        ["groupBy", str(state.key)],
        ...decorate(t, state),
      ],
    };
  const pairs = distinct(t, state).map(
    s => [s, findState(s, "name")!.postal] as [string, string],
  );
  return {
    prelude: [
      "// The tile grid finds states by postal code: match them to your names.",
      lookup("postal", pairs),
    ],
    fields: [
      ["data", "data"],
      ["groupBy", `d => postal[${prop(state.key)}]`],
      ["label", `d => ${prop(state.key)}`],
      ...(t.value ? ([["colorScale", str(t.value.key)]] as Field[]) : []),
    ],
  };
}

/** The config of a Geomap: countries, then states, then points. */
export function geomapPlan(t: Traits): Plan {
  const {iso3, state, lat, lon} = t.geo;
  if (iso3) return countries(t, iso3);
  if (state) return states(t, state);
  return points(t, lat!, lon!);
}

/** The config of a TileGridMap of US states. */
export function tileGridPlan(t: Traits): Plan {
  return tiles(t, t.geo.state!);
}
