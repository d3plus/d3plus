const causes = [
  "Dead pixels",
  "Misalignment",
  "Cracked casing",
  "Scratches",
  "Missing parts",
  "Loose screws",
];
const counts = {
  Austin: [128, 82, 51, 34, 23, 19],
  Dayton: [40, 95, 22, 60, 12, 30],
};

const defects = Object.entries(counts).flatMap(([plant, values]) =>
  values.map((count, i) => ({plant, cause: causes[i], count})),
);

const config = {
  data: defects,
  facet: "plant",
  groupBy: "cause",
  x: "cause",
  y: "count",
};
