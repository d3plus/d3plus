const config = {
  data: [
    {id: "alpha", year: 2020, value: 40, p10: 34, p90: 47, p25: 37, p75: 43},
    {id: "alpha", year: 2021, value: 46, p10: 38, p90: 55, p25: 42, p75: 50},
    {id: "alpha", year: 2022, value: 44, p10: 35, p90: 54, p25: 40, p75: 49},
    {id: "alpha", year: 2023, value: 51, p10: 40, p90: 63, p25: 46, p75: 57},
    {id: "alpha", year: 2024, value: 55, p10: 42, p90: 69, p25: 49, p75: 62},
    {id: "beta", year: 2020, value: 22, p10: 18, p90: 27, p25: 20, p75: 24},
    {id: "beta", year: 2021, value: 25, p10: 19, p90: 31, p25: 22, p75: 28},
    {id: "beta", year: 2022, value: 30, p10: 23, p90: 37, p25: 27, p75: 33},
    {id: "beta", year: 2023, value: 28, p10: 20, p90: 36, p25: 24, p75: 32},
    {id: "beta", year: 2024, value: 33, p10: 24, p90: 43, p25: 29, p75: 38},
  ],
  groupBy: "id",
  confidence: [
    ["p10", "p90", "80%"],
    ["p25", "p75", "50%"],
  ],
  x: "year",
  y: "value",
};
