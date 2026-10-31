const energy = [
  {source: "Natural Gas", share: 43.1},
  {source: "Nuclear", share: 18.6},
  {source: "Coal", share: 16.2},
  {source: "Wind", share: 10.2},
  {source: "Hydro", share: 5.7},
  {source: "Solar", share: 3.9},
  {source: "Other", share: 2.3},
];

const config = {
  data: energy,
  groupBy: "source",
  sum: "share",
};
