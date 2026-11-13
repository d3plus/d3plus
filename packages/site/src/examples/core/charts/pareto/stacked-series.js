const defects = [
  {cause: "Dead pixels", shift: "Day", count: 80},
  {cause: "Dead pixels", shift: "Night", count: 48},
  {cause: "Misalignment", shift: "Day", count: 30},
  {cause: "Misalignment", shift: "Night", count: 52},
  {cause: "Cracked casing", shift: "Day", count: 29},
  {cause: "Cracked casing", shift: "Night", count: 22},
  {cause: "Scratches", shift: "Day", count: 20},
  {cause: "Scratches", shift: "Night", count: 14},
  {cause: "Missing parts", shift: "Day", count: 8},
  {cause: "Missing parts", shift: "Night", count: 15},
];

const config = {
  data: defects,
  groupBy: "shift",
  stacked: true,
  x: "cause",
  y: "count",
};
