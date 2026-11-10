const notes = {
  Brazil: "2023 estimate",
  Vietnam: "Preliminary figure",
};

const config = {
  data: [
    {
      country: "Democratic Republic of the Congo",
      continent: "Africa",
      gdp: 650,
    },
    {country: "Brazil", continent: "Americas", gdp: 10300},
    {country: "Bosnia and Herzegovina", continent: "Europe", gdp: 8600},
    {country: "Vietnam", continent: "Asia", gdp: 4300},
    {
      country: "Saint Vincent and the Grenadines",
      continent: "Americas",
      gdp: 10100,
    },
  ],
  groupBy: "continent",
  x: "country",
  y: "gdp",
  xConfig: {
    labelRotation: false,
    maxSize: 40,
    tickTooltip: d => notes[d],
  },
  yConfig: {
    title: "GDP per capita",
    titleTooltip: "Constant 2015 US$",
  },
};
