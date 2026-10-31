const config = {
  data: [
    {country: "Finland", kg: 12},
    {country: "Norway", kg: 9.9},
    {country: "Iceland", kg: 9},
    {country: "Denmark", kg: 8.7},
    {country: "Netherlands", kg: 8.4},
    {country: "Sweden", kg: 8.2},
    {country: "Switzerland", kg: 7.9},
    {country: "Belgium", kg: 6.8},
  ],
  groupBy: "country",
  discrete: "y",
  x: "kg",
  y: "country",
  ySort: (a, b) => a.kg - b.kg,
};
