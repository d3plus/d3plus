const config = {
  data: [
    {store: "Store 1", visitors: 4.2, revenue: 48},
    {store: "Store 2", visitors: 5.1, revenue: 61},
    {store: "Store 3", visitors: 6.0, revenue: 66},
    {store: "Store 4", visitors: 6.8, revenue: 79},
    {store: "Store 5", visitors: 7.5, revenue: 84},
    {store: "Store 6", visitors: 8.3, revenue: 97},
    {store: "Store 7", visitors: 9.0, revenue: 182},
    {store: "Store 8", visitors: 9.6, revenue: 108},
    {store: "Store 9", visitors: 10.4, revenue: 121},
    {store: "Store 10", visitors: 11.2, revenue: 126},
    {store: "Store 11", visitors: 12.1, revenue: 139},
    {store: "Store 12", visitors: 13.0, revenue: 150},
  ],
  groupBy: "store",
  x: "visitors",
  y: "revenue",
  legend: false,
  referenceLines: [
    {y: "mean", highlight: "above"},
    {
      y: "median",
      dash: true,
      label: value => `Median: $${Math.round(value)}k`,
      from: 8,
    },
  ],
  annotations: [
    {
      shape: "Callout",
      select: "max",
      label: d => `${d.data.store}: $${d.y}k`,
      dx: -90,
      dy: 10,
      dropline: true,
    },
  ],
};
