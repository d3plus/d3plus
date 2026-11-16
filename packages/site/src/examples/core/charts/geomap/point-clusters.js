const config = {
  data: "/data/city_coords.json",
  // Each city's rough time zone, from its longitude.
  dataFormat: rows =>
    rows.map(d => ({
      ...d,
      zone:
        d.longitude > -87
          ? "Eastern"
          : d.longitude > -102
            ? "Central"
            : d.longitude > -115
              ? "Mountain"
              : "Pacific",
    })),
  groupBy: ["zone", "slug"],
  label: d => `${d.city}, ${d.region}`,
  point: d => [d.longitude, d.latitude],
  pointCluster: {radius: 40},
  projection: "geoAlbersUsa",
  topojson: "/data/states-10m.json",
};
