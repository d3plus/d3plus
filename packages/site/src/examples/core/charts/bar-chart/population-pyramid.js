const config = {
  groupPadding: 2,
  data: [
    {
      "Age range": "0 to 4",
      Sex: "Male",
      Population: 1445122,
    },
    {
      "Age range": "0 to 4",
      Sex: "Female",
      Population: 1385933,
    },
    {
      "Age range": "5 to 9",
      Sex: "Male",
      Population: 1473968,
    },
    {
      "Age range": "5 to 9",
      Sex: "Female",
      Population: 1417319,
    },
    {
      "Age range": "10 to 15",
      Sex: "Male",
      Population: 1483727,
    },
    {
      "Age range": "10 to 15",
      Sex: "Female",
      Population: 1430083,
    },
    {
      "Age range": "15 to 19",
      Sex: "Male",
      Population: 1466289,
    },
    {
      "Age range": "15 to 19",
      Sex: "Female",
      Population: 1420257,
    },
    {
      "Age range": "20 to 24",
      Sex: "Male",
      Population: 1438000,
    },
    {
      "Age range": "20 to 24",
      Sex: "Female",
      Population: 1401017,
    },
    {
      "Age range": "25 to 29",
      Sex: "Male",
      Population: 1371191,
    },
    {
      "Age range": "25 to 29",
      Sex: "Female",
      Population: 1344048,
    },
    {
      "Age range": "30 to 34",
      Sex: "Male",
      Population: 1251238,
    },
    {
      "Age range": "30 to 34",
      Sex: "Female",
      Population: 1233884,
    },
    {
      "Age range": "35 to 39",
      Sex: "Male",
      Population: 1156915,
    },
    {
      "Age range": "35 to 39",
      Sex: "Female",
      Population: 1145477,
    },
    {
      "Age range": "40 to 44",
      Sex: "Male",
      Population: 1038422,
    },
    {
      "Age range": "40 to 44",
      Sex: "Female",
      Population: 1034343,
    },
    {
      "Age range": "45 to 49",
      Sex: "Male",
      Population: 899326,
    },
    {
      "Age range": "45 to 49",
      Sex: "Female",
      Population: 903752,
    },
    {
      "Age range": "50 to 54",
      Sex: "Male",
      Population: 774590,
    },
    {
      "Age range": "50 to 54",
      Sex: "Female",
      Population: 788241,
    },
    {
      "Age range": "55 to 59",
      Sex: "Male",
      Population: 634510,
    },
    {
      "Age range": "55 to 59",
      Sex: "Female",
      Population: 658490,
    },
    {
      "Age range": "60 to 64",
      Sex: "Male",
      Population: 501128,
    },
    {
      "Age range": "60 to 64",
      Sex: "Female",
      Population: 532940,
    },
    {
      "Age range": "65 to 69",
      Sex: "Male",
      Population: 379352,
    },
    {
      "Age range": "65 to 69",
      Sex: "Female",
      Population: 415647,
    },
    {
      "Age range": "70 to 74",
      Sex: "Male",
      Population: 271687,
    },
    {
      "Age range": "70 to 74",
      Sex: "Female",
      Population: 311231,
    },
    {
      "Age range": "75 to 79",
      Sex: "Male",
      Population: 186805,
    },
    {
      "Age range": "75 to 79",
      Sex: "Female",
      Population: 229221,
    },
    {
      "Age range": "80+",
      Sex: "Male",
      Population: 166789,
    },
    {
      "Age range": "80+",
      Sex: "Female",
      Population: 235076,
    },
  ],
  discrete: "y",
  groupBy: "Sex",
  shapeConfig: {
    label: d => d["Age range"],
  },
  stacked: true,
  x: d => d.Population * (d.Sex === "Female" ? -1 : 1),
  xConfig: {
    tickFormat: d => formatAbbreviate(Math.abs(d)),
  },
  y: "Age range",
  yConfig: {barConfig: {stroke: "transparent"}, ticks: []},
};
