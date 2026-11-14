/**
    Small multiples: the map-shaped grids `facetConfig.layout` names. Each
    place takes one cell, roughly where it sits on a map: its short code
    (the panel title), its full name (the title's tooltip), any other
    names data may give it, and its row and column (from 0, top left).

    @module
*/

/** One place in a map-shaped grid. */
export interface FacetLayoutCell {
  /** Its short code, which titles its panel. */
  code: string;
  /** Its full name, shown when its panel title is hovered. */
  name?: string;
  /** Other values that place a row here (such as an ISO alpha-3 code). */
  aliases?: string[];
  row: number;
  column: number;
}

/** A compact place: code, name, row, column, and any aliases. */
type Place = [string, string, number, number, ...string[]];

const cells = (places: Place[]): FacetLayoutCell[] =>
  places.map(([code, name, row, column, ...aliases]) => ({
    code,
    name,
    row,
    column,
    ...(aliases.length ? {aliases} : {}),
  }));

/** The 50 US states and the District of Columbia, by postal code. */
const US_STATES: Place[] = [
  ["AK", "Alaska", 0, 0],
  ["ME", "Maine", 0, 11],
  ["VT", "Vermont", 1, 10],
  ["NH", "New Hampshire", 1, 11],
  ["WA", "Washington", 2, 1],
  ["ID", "Idaho", 2, 2],
  ["MT", "Montana", 2, 3],
  ["ND", "North Dakota", 2, 4],
  ["MN", "Minnesota", 2, 5],
  ["IL", "Illinois", 2, 6],
  ["WI", "Wisconsin", 2, 7],
  ["MI", "Michigan", 2, 8],
  ["NY", "New York", 2, 9],
  ["RI", "Rhode Island", 2, 10],
  ["MA", "Massachusetts", 2, 11],
  ["OR", "Oregon", 3, 1],
  ["NV", "Nevada", 3, 2],
  ["WY", "Wyoming", 3, 3],
  ["SD", "South Dakota", 3, 4],
  ["IA", "Iowa", 3, 5],
  ["IN", "Indiana", 3, 6],
  ["OH", "Ohio", 3, 7],
  ["PA", "Pennsylvania", 3, 8],
  ["NJ", "New Jersey", 3, 9],
  ["CT", "Connecticut", 3, 10],
  ["CA", "California", 4, 1],
  ["UT", "Utah", 4, 2],
  ["CO", "Colorado", 4, 3],
  ["NE", "Nebraska", 4, 4],
  ["MO", "Missouri", 4, 5],
  ["KY", "Kentucky", 4, 6],
  ["WV", "West Virginia", 4, 7],
  ["VA", "Virginia", 4, 8],
  ["MD", "Maryland", 4, 9],
  ["DE", "Delaware", 4, 10],
  ["AZ", "Arizona", 5, 2],
  ["NM", "New Mexico", 5, 3],
  ["KS", "Kansas", 5, 4],
  ["AR", "Arkansas", 5, 5],
  ["TN", "Tennessee", 5, 6],
  ["NC", "North Carolina", 5, 7],
  ["SC", "South Carolina", 5, 8],
  ["DC", "District of Columbia", 5, 9, "Washington, D.C.", "Washington DC"],
  ["OK", "Oklahoma", 6, 4],
  ["LA", "Louisiana", 6, 5],
  ["MS", "Mississippi", 6, 6],
  ["AL", "Alabama", 6, 7],
  ["GA", "Georgia", 6, 8],
  ["HI", "Hawaii", 7, 0],
  ["TX", "Texas", 7, 4],
  ["FL", "Florida", 7, 9],
];

/** The 27 member states of the European Union, by ISO alpha-2 code. */
const EU_COUNTRIES: Place[] = [
  ["SE", "Sweden", 0, 5, "SWE"],
  ["FI", "Finland", 0, 6, "FIN"],
  ["IE", "Ireland", 1, 1, "IRL"],
  ["DK", "Denmark", 1, 4, "DNK"],
  ["EE", "Estonia", 1, 6, "EST"],
  ["NL", "Netherlands", 2, 3, "NLD"],
  ["DE", "Germany", 2, 4, "DEU"],
  ["PL", "Poland", 2, 5, "POL"],
  ["LV", "Latvia", 2, 6, "LVA"],
  ["BE", "Belgium", 3, 3, "BEL"],
  ["CZ", "Czechia", 3, 4, "CZE", "Czech Republic"],
  ["SK", "Slovakia", 3, 5, "SVK"],
  ["LT", "Lithuania", 3, 6, "LTU"],
  ["FR", "France", 4, 2, "FRA"],
  ["LU", "Luxembourg", 4, 3, "LUX"],
  ["AT", "Austria", 4, 4, "AUT"],
  ["HU", "Hungary", 4, 5, "HUN"],
  ["RO", "Romania", 4, 6, "ROU"],
  ["PT", "Portugal", 5, 1, "PRT"],
  ["ES", "Spain", 5, 2, "ESP"],
  ["IT", "Italy", 5, 3, "ITA"],
  ["SI", "Slovenia", 5, 4, "SVN"],
  ["HR", "Croatia", 5, 5, "HRV"],
  ["BG", "Bulgaria", 5, 6, "BGR"],
  ["MT", "Malta", 6, 3, "MLT"],
  ["GR", "Greece", 6, 6, "GRC", "EL"],
  ["CY", "Cyprus", 6, 7, "CYP"],
];

/** The World Bank's seven regions, by their World Bank codes. */
const WORLD_REGIONS: Place[] = [
  ["NAC", "North America", 0, 0],
  ["ECS", "Europe & Central Asia", 0, 1, "Europe and Central Asia"],
  ["EAS", "East Asia & Pacific", 0, 2, "East Asia and Pacific"],
  [
    "LCN",
    "Latin America & Caribbean",
    1,
    0,
    "Latin America and the Caribbean",
    "Latin America and Caribbean",
  ],
  [
    "MEA",
    "Middle East & North Africa",
    1,
    1,
    "Middle East and North Africa",
    "MENA",
  ],
  ["SAS", "South Asia", 1, 2],
  ["SSF", "Sub-Saharan Africa", 2, 1],
];

/** Every named layout `facetConfig.layout` takes. */
export const FACET_LAYOUTS: Record<string, FacetLayoutCell[]> = {
  "eu-countries": cells(EU_COUNTRIES),
  "us-states": cells(US_STATES),
  "world-regions": cells(WORLD_REGIONS),
};
