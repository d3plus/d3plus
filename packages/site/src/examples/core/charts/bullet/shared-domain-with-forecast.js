const config = {
  data: [
    {id: "Q1", value: 42, target: 55, forecast: 58},
    {id: "Q2", value: 61, target: 60, forecast: 70},
    {id: "Q3", value: 38, target: 65, forecast: 52},
    {id: "Q4", value: 74, target: 70, forecast: 80},
  ],
  bands: [40, 70],
  domain: [0, 100],
  sharedDomain: true,
  tickFormat: d => `${d}%`,
  valueFormat: d => `${d}%`,
};
