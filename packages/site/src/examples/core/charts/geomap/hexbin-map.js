const config = {
  data: "/data/city_coords.json",
  groupBy: "slug",
  label: d => `${d.city}, ${d.region}`,
  point: d => [d.longitude, d.latitude],
  hexbin: {radius: 20},
};
