const config = {
  data: [
    {id: "NYC", name: "New York", point: [-74.0, 40.71]},
    {id: "LON", name: "London", point: [-0.13, 51.51]},
    {id: "DXB", name: "Dubai", point: [55.27, 25.2]},
    {id: "TYO", name: "Tokyo", point: [139.69, 35.69]},
    {id: "SYD", name: "Sydney", point: [151.21, -33.87]},
  ],
  label: d => d.name || d.id,
  links: [
    {source: "NYC", target: "LON", passengers: 3200},
    {source: "LON", target: "DXB", passengers: 1800},
    {source: "DXB", target: "TYO", passengers: 1300},
    {source: "DXB", target: "SYD", passengers: 900},
    {source: "TYO", target: "SYD", passengers: 600},
  ],
  linkSize: d => d.passengers,
  arrows: true,
  point: d => d.point,
  projection: "geoOrthographic",
  projectionRotate: [-30, -35],
  topojson: "/data/countries-110m.json",
  topojsonFilter: d => d.id !== "010",
};
