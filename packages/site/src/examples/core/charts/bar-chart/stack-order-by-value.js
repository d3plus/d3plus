const revenueByYear = [
  {segment: "Enterprise", year: 2021, revenue: 40},
  {segment: "Enterprise", year: 2022, revenue: 46},
  {segment: "Enterprise", year: 2023, revenue: 52},
  {segment: "Retail", year: 2021, revenue: 25},
  {segment: "Retail", year: 2022, revenue: 28},
  {segment: "Retail", year: 2023, revenue: 27},
  {segment: "Online", year: 2021, revenue: 8},
  {segment: "Online", year: 2022, revenue: 14},
  {segment: "Online", year: 2023, revenue: 21},
];

const config = {
  data: revenueByYear,
  groupBy: "segment",
  stacked: true,
  stackOrder: "descending",
  x: "year",
  y: "revenue",
};
