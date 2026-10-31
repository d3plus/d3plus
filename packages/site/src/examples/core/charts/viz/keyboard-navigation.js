const data = [
  {id: "North", year: 2021, value: 14},
  {id: "North", year: 2022, value: 18},
  {id: "North", year: 2023, value: 23},
  {id: "South", year: 2021, value: 9},
  {id: "South", year: 2022, value: 13},
  {id: "South", year: 2023, value: 11},
];

const config = {
  data,
  groupBy: "id",
  x: "year",
  y: "value",
  discrete: "x",
  title: "Revenue by region",
  keyboardNavConfig: {stroke: "#005fcc", strokeWidth: 3},
};
