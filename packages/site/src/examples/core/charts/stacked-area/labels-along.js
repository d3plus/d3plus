const sources = {
  Coal: [52, 50, 47, 44, 40, 36, 32, 29, 26, 24],
  Gas: [20, 22, 24, 26, 28, 29, 30, 30, 29, 28],
  Nuclear: [18, 18, 17, 17, 17, 16, 16, 15, 15, 15],
  Wind: [2, 3, 5, 7, 9, 12, 15, 18, 21, 24],
  Solar: [0.3, 0.5, 1, 2, 3, 5, 7, 10, 13, 17],
};

const energyData = Object.entries(sources).flatMap(([source, values]) =>
  values.map((twh, i) => ({source, year: 2015 + i, twh})),
);

const config = {
  data: energyData,
  groupBy: "source",
  labelPosition: "along",
  legend: false,
  shapeConfig: {Area: {curve: "monotoneX"}},
  x: "year",
  y: "twh",
};
