const config = {
  data: [
    {id: "NYC", name: "New York", region: "Americas", point: [-74.0, 40.71]},
    {id: "LON", name: "London", region: "Europe", point: [-0.13, 51.51]},
    {id: "DXB", name: "Dubai", region: "Asia", point: [55.27, 25.2]},
    {id: "TYO", name: "Tokyo", region: "Asia", point: [139.69, 35.69]},
    {id: "SYD", name: "Sydney", region: "Oceania", point: [151.21, -33.87]},
    {id: "JNB", name: "Johannesburg", region: "Africa", point: [28.05, -26.2]},
  ],
  color: "region",
  label: d => d.name,
  links: [
    {source: "NYC", target: "LON", passengers: 3200},
    {source: "LON", target: "NYC", passengers: 2900},
    {source: "LON", target: "DXB", passengers: 1800},
    {source: "DXB", target: "SYD", passengers: 900},
    {source: "DXB", target: "TYO", passengers: 1300},
    {source: "DXB", target: "JNB", passengers: 700},
    // An id from the topojson: the link ends at Brazil's centroid.
    {source: "NYC", target: "076", passengers: 1100},
    // A bare [longitude, latitude] coordinate (Buenos Aires).
    {source: "JNB", target: [-58.38, -34.6], passengers: 300},
  ],
  linkSize: d => d.passengers,
  linkColor: "source",
  linkCurve: 0.2,
  arrows: true,
  point: d => d.point,
  tiles: false,
  topojson: "/data/countries-110m.json",
  topojsonFilter: d => d.id !== "010",
};
