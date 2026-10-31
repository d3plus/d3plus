const config = {
  data: [
    {region: "Americas", country: "Brazil", revenue: 42},
    {region: "Americas", country: "Chile", revenue: 18},
    {region: "Americas", country: "Mexico", revenue: 27},
    {region: "Europe", country: "France", revenue: 35},
    {region: "Europe", country: "Germany", revenue: 39},
    {region: "Europe", country: "Spain", revenue: 21},
  ],
  groupBy: "country",
  x: "country",
  y: "revenue",
  color: "region",
  title: "Revenue by country",
  // One format saves in one click. Other keys go to html-to-image.
  saveControlConfig: {
    filename: "revenue",
    formats: ["png"],
    background: "#f8f9fa",
    pixelRatio: 2,
  },
};
