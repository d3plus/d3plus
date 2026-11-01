const config = {
  links: [
    {source: "Coal", target: "Electricity", value: 40},
    {source: "Gas", target: "Electricity", value: 25},
    {source: "Gas", target: "Heat", value: 15},
    {source: "Solar", target: "Electricity", value: 12},
    {source: "Electricity", target: "Homes", value: 45},
    {source: "Electricity", target: "Industry", value: 32},
    {source: "Heat", target: "Homes", value: 15},
  ],
  linkColor: "source",
  linkLabel: "value",
};
