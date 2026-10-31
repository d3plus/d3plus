const income = [
  {item: "Revenue", amount: 420, subtotal: true},
  {item: "Cost of Goods", amount: -180},
  {item: "Gross Profit", subtotal: true},
  {item: "Marketing", amount: -45},
  {item: "R&D", amount: -60},
  {item: "Other Income", amount: 25},
  {item: "Operating Income", subtotal: true},
  {item: "Taxes", amount: -38},
  {item: "Net Income", subtotal: true},
];

const config = {
  data: income,
  discrete: "y",
  x: "amount",
  y: "item",
  subtotal: "subtotal",
};
