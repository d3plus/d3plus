const defects = [
  {cause: "Scratches", count: 34},
  {cause: "Misalignment", count: 82},
  {cause: "Loose screws", count: 19},
  {cause: "Cracked casing", count: 51},
  {cause: "Wrong label", count: 9},
  {cause: "Dead pixels", count: 128},
  {cause: "Paint drips", count: 6},
  {cause: "Missing parts", count: 23},
];

const config = {
  data: defects,
  discrete: "y",
  groupBy: "cause",
  x: "count",
  y: "cause",
};
