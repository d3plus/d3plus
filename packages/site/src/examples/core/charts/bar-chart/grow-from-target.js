const scores = {
  Ada: 72,
  Ben: 41,
  Cy: 58,
  Dee: 35,
  Eve: 81,
  Fay: 49,
  Gus: 63,
  Hal: 30,
};

const config = {
  data: Object.entries(scores).map(([name, score]) => ({name, score})),
  groupBy: "name",
  x: "name",
  y: "score",
  growFrom: 50,
  valueColors: {values: [50]},
  legend: false,
  referenceLines: [{y: 50, label: "Pass mark"}],
};
