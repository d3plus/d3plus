const kpis = [
  {
    id: "Revenue",
    unit: "US$, in thousands",
    value: 270,
    target: 250,
    ranges: [150, 225, 300],
  },
  {id: "Profit", unit: "%", value: 22.5, target: 27, ranges: [20, 25, 30]},
  {
    id: "Order Size",
    unit: "US$, average",
    value: 410,
    target: 550,
    ranges: [350, 500, 600],
  },
  {
    id: "New Customers",
    unit: "count",
    value: 1650,
    target: 2100,
    ranges: [1400, 2000, 2500],
  },
  {
    id: "Satisfaction",
    unit: "out of 5",
    value: 4.5,
    target: 4.2,
    ranges: [3.5, 4.25, 5],
  },
];

const config = {
  data: kpis,
  bands: d => d.ranges.slice(0, -1),
  domain: d => [0, d.ranges[d.ranges.length - 1]],
  subLabel: "unit",
  shapeConfig: {fill: "#333333"},
};
