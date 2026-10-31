const config = {
  data: [
    {product: "Widgets", quarter: "Q1", units: 50, profit: 5},
    {product: "Widgets", quarter: "Q2", units: 60, profit: 6},
    {product: "Gadgets", quarter: "Q1", units: 20, profit: 40},
    {product: "Gadgets", quarter: "Q2", units: 25, profit: 50},
    {product: "Gizmos", quarter: "Q1", units: 35, profit: 15},
    {product: "Gizmos", quarter: "Q2", units: 30, profit: 18},
  ],
  groupBy: "product",
  stacked: true,
  stackOrder: d => d.profit,
  x: "quarter",
  y: "units",
};
