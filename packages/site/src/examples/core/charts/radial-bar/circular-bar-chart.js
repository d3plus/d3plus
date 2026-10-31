const countries = [
  "Norway",
  "Sweden",
  "Denmark",
  "Finland",
  "Iceland",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Portugal",
  "Poland",
  "Austria",
  "Belgium",
  "Netherlands",
  "Ireland",
  "Greece",
  "Czechia",
  "Hungary",
  "Slovakia",
  "Croatia",
];

const renewables = countries.map((country, i) => ({
  country,
  share: 12 + ((i * 37) % 70),
}));

const config = {
  data: renewables,
  groupBy: "country",
  value: "share",
  discrete: "angle",
};
