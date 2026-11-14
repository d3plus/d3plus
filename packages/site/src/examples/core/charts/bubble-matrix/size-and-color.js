// Illustrative quarterly revenue ($M) and year-over-year growth (%) by region.
const regions = ["North", "South", "East", "West", "Central"];
const quarters = ["Q1", "Q2", "Q3", "Q4"];
const data = [];
regions.forEach((region, i) =>
  quarters.forEach((quarter, j) => {
    // Two regions hadn't opened yet.
    if ((i + j) % 7 === 3) return;
    data.push({
      region,
      quarter,
      "Revenue ($M)": 20 + ((i * 37 + j * 23) % 80),
      "Growth (%)": ((i * 13 + j * 29) % 41) - 20,
    });
  }),
);

const config = {
  data,
  groupBy: ["region", "quarter"],
  column: "quarter",
  row: "region",
  size: "Revenue ($M)",
  colorScale: "Growth (%)",
  colorScalePosition: "right",
};
