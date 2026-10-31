const renewables = {
  Brazil: [41, 42, 43, 45, 44, 46, 47, 46, 48, 47],
  Chile: [30, 31, 33, 34, 36, 35, 37, 38, 37, 36],
  Peru: [31, 32, 31, 30, 31, 29, 30, 31, 30, 30],
  Colombia: [28, 29, 28, 30, 29, 28, 27, 28, 27, 27],
  Ecuador: [29, 30, 30, 31, 32, 31, 30, 29, 29, 29],
  Mexico: [17, 18, 18, 19, 20, 20, 21, 21, 22, 22],
};

const config = {
  data: Object.entries(renewables).flatMap(([country, shares]) =>
    shares.map((share, i) => ({country, year: 2015 + i, share})),
  ),
  groupBy: "country",
  legend: false,
  lineLabels: "both",
  lineLabelConfig: {value: true},
  x: "year",
  y: "share",
  yConfig: {
    tickFormat: d => `${d}%`,
  },
};
