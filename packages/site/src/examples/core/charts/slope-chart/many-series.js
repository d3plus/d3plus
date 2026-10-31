const regions = [
  "Andes",
  "Atlantic Coast",
  "Caribbean",
  "Central Plains",
  "Gulf",
  "Highlands",
  "Lake District",
  "Northern Forest",
  "Pacific Coast",
  "Pampas",
  "Patagonia",
  "River Delta",
  "Southern Cone",
  "Valley",
];

const config = {
  data: regions.flatMap((region, i) => [
    {region, period: "Before", score: 50 + ((i * 7) % 9)},
    {region, period: "After", score: 48 + ((i * 5) % 13)},
  ]),
  groupBy: "region",
  lineLabelConfig: {
    valueFormat: v => v.toFixed(0),
  },
  slopeColor: true,
  x: "period",
  y: "score",
};
