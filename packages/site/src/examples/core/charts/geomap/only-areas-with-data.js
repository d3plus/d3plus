const config = {
  data: [
    {id: "840", country: "United States", value: 10},
    {id: "124", country: "Canada", value: 4},
    {id: "484", country: "Mexico", value: 7},
    {id: "076", country: "Brazil", value: 9},
    {id: "032", country: "Argentina", value: 3},
  ],
  colorScale: "value",
  groupBy: "id",
  label: d => d.country,
  topojson: "/data/countries-110m.json",
  topojsonFilter: ["840", "124", "484", "076", "032"],
};
