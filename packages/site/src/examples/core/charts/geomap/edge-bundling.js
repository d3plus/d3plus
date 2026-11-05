const europe = [
  {id: "LON", name: "London", point: [-0.13, 51.51]},
  {id: "PAR", name: "Paris", point: [2.35, 48.86]},
  {id: "FRA", name: "Frankfurt", point: [8.68, 50.11]},
  {id: "MAD", name: "Madrid", point: [-3.7, 40.42]},
  {id: "AMS", name: "Amsterdam", point: [4.9, 52.37]},
  {id: "ROM", name: "Rome", point: [12.5, 41.9]},
];
const americas = [
  {id: "NYC", name: "New York", point: [-74.0, 40.71]},
  {id: "BOS", name: "Boston", point: [-71.06, 42.36]},
  {id: "CHI", name: "Chicago", point: [-87.63, 41.88]},
  {id: "YYZ", name: "Toronto", point: [-79.38, 43.65]},
  {id: "ATL", name: "Atlanta", point: [-84.39, 33.75]},
  {id: "MIA", name: "Miami", point: [-80.19, 25.76]},
  {id: "LAX", name: "Los Angeles", point: [-118.24, 34.05]},
];

// A flight from every European city to every North American one.
const links = europe.flatMap(a =>
  americas.map(b => ({source: a.id, target: b.id})),
);

const config = {
  data: [
    ...europe.map(d => ({...d, region: "Europe"})),
    ...americas.map(d => ({...d, region: "North America"})),
  ],
  color: "region",
  label: d => d.name,
  links,
  linkBundle: true,
  linkColor: "source",
  linkSize: 1,
  point: d => d.point,
  pointSizeMin: 4,
  pointSizeMax: 4,
  // Frames the map on the countries the flights join.
  fitFilter: d =>
    ["124", "840", "826", "250", "276", "724", "380"].includes(d.id),
  tiles: false,
  topojson: "/data/countries-110m.json",
  topojsonFilter: d => d.id !== "010",
};
