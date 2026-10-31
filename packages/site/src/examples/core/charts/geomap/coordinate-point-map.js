const config = {
  data: "/data/city_coords.json",
  groupBy: "slug",
  colorScale: "dma_code",
  label: d => d.city + ", " + d.region,
  point: d => [d.longitude, d.latitude],
  pointSize: d => d.dma_code,
  pointSizeMin: 1,
  pointSizeMax: 10,
};
