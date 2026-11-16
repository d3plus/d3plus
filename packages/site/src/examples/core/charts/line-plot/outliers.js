const config = {
  data: ["Online", "In store"].flatMap((id, s) =>
    Array.from({length: 18}, (_, k) => ({
      id,
      week: k + 1,
      orders:
        (s ? 60 : 40) +
        Math.round(4 * Math.sin(k / 2)) +
        (id === "Online" && k === 6 ? 24 : 0) +
        (id === "In store" && k === 12 ? -26 : 0),
    })),
  ),
  groupBy: "id",
  x: "week",
  y: "orders",
  outlier: true,
};
