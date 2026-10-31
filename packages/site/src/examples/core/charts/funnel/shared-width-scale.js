const stages = [
  {id: "Visited Site", value: 12400},
  {id: "Viewed Pricing", value: 6900},
  {id: "Started Trial", value: 3100},
  {id: "Activated", value: 1850},
  {id: "Subscribed", value: 760},
];

const config = {
  data: [
    ["Search", [9800, 5200, 2600, 1500, 690]],
    ["Social", [14200, 4900, 1700, 820, 240]],
    ["Email", [4300, 3100, 1900, 1350, 720]],
  ].flatMap(([channel, values]) =>
    values.map((value, i) => ({channel, id: stages[i].id, value})),
  ),
  facet: "channel",
  conversion: "first",
  valueFormat: d => d.toLocaleString(),
  facetConfig: {scales: "shared"},
};
