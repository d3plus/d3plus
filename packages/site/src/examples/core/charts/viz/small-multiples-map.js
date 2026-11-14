// Synthetic yearly values for every state, varied by its postal code.
const codes =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );
const seed = code => code.charCodeAt(0) * 7 + code.charCodeAt(1) * 13;
const data = codes.flatMap(state =>
  [2018, 2019, 2020, 2021, 2022, 2023].map((year, k) => ({
    state,
    year,
    rate:
      Math.round(
        (3 + (seed(state) % 30) / 10 + (year === 2020 ? 4 : 0) - k * 0.1) * 10,
      ) / 10,
  })),
);

const config = {
  data,
  facet: "state",
  facetConfig: {layout: "us-states", padding: 6},
  groupBy: "state",
  legend: false,
  lineLabels: false,
  title: "Rate by state, 2018–2023",
  x: "year",
  xConfig: {labels: [], ticks: []},
  y: "rate",
  yConfig: {title: false},
};
