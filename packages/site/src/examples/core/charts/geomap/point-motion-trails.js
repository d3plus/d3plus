const config = {
  data: [
    {id: "Ana", day: 1, lon: -38, lat: 11},
    {id: "Ana", day: 2, lon: -47, lat: 14},
    {id: "Ana", day: 3, lon: -56, lat: 17},
    {id: "Ana", day: 4, lon: -65, lat: 21},
    {id: "Ana", day: 5, lon: -73, lat: 25},
    {id: "Ana", day: 6, lon: -81, lat: 29},
    {id: "Bill", day: 1, lon: -30, lat: 9},
    {id: "Bill", day: 2, lon: -39, lat: 13},
    {id: "Bill", day: 3, lon: -47, lat: 18},
    {id: "Bill", day: 4, lon: -54, lat: 24},
    {id: "Bill", day: 5, lon: -61, lat: 30},
    {id: "Bill", day: 6, lon: -69, lat: 36},
  ],
  groupBy: "id",
  time: "day",
  point: d => [d.lon, d.lat],
  pointSize: 8,
  projection: "geoMercator",
  topojson: "/data/countries-110m.json",
  topojsonFilter: d => d.id !== "010",
  fitObject: {
    type: "Topology",
    objects: {
      bounds: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "MultiPoint",
            coordinates: [
              [-95, 5],
              [-12, 46],
            ],
          },
        ],
      },
    },
  },
};
