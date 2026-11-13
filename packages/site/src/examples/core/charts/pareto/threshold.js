const sales = [
  {product: "Laptops", revenue: 520},
  {product: "Phones", revenue: 310},
  {product: "Monitors", revenue: 140},
  {product: "Cables", revenue: 24},
  {product: "Mice", revenue: 21},
  {product: "Keyboards", revenue: 19},
  {product: "Webcams", revenue: 16},
  {product: "Stands", revenue: 12},
];

const config = {
  data: sales,
  groupBy: "product",
  x: "product",
  y: "revenue",
  threshold: 0.05,
  thresholdName: "Other",
};
