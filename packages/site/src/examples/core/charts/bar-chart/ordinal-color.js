const tierData = [
  {tier: "XS", sales: 12},
  {tier: "S", sales: 28},
  {tier: "M", sales: 45},
  {tier: "L", sales: 33},
  {tier: "XL", sales: 19},
];

const config = {
  data: tierData,
  groupBy: "tier",
  x: "tier",
  y: "sales",
  color: "tier",
  colorOrdinal: true,
  xSort: (a, b) =>
    ["XS", "S", "M", "L", "XL"].indexOf(a.tier) -
    ["XS", "S", "M", "L", "XL"].indexOf(b.tier),
};
