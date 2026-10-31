const config = {
  data: [
    {fruit: "apple", year: 1, amount: 50, moe: 2},
    {fruit: "apple", year: 2, amount: 56, moe: 1},
    {fruit: "apple", year: 3, amount: 58, moe: 1},
    {fruit: "banana", year: 1, amount: 88, moe: 3},
    {fruit: "banana", year: 2, amount: 90, moe: 4},
    {fruit: "banana", year: 3, amount: 76, moe: 3},
  ],
  groupBy: "fruit",
  confidence: [d => d.amount - d.moe, d => d.amount + d.moe],
  confidenceConfig: {
    fillOpacity: 0.3,
  },
  x: "year",
  y: "amount",
};
