const config = {
  data: [
    {Sector: "Retail", Year: "2023", Revenue: 42, Employees: 30},
    {Sector: "Retail", Year: "2024", Revenue: 48, Employees: 30},
    {Sector: "Technology", Year: "2023", Revenue: 55, Employees: 12},
    {Sector: "Technology", Year: "2024", Revenue: 70, Employees: 12},
    {Sector: "Energy", Year: "2023", Revenue: 38, Employees: 6},
    {Sector: "Energy", Year: "2024", Revenue: 33, Employees: 6},
    {Sector: "Healthcare", Year: "2023", Revenue: 30, Employees: 18},
    {Sector: "Healthcare", Year: "2024", Revenue: 36, Employees: 18},
  ],
  groupBy: "Year",
  x: "Sector",
  y: "Revenue",
  barWidth: "Employees",
  aggs: {
    Employees: (rows, value) => Math.max(...rows.map(value)),
  },
  barWidthShare: true,
  barPadding: 2,
  groupPadding: 8,
};
