const config = {
  connectGaps: "dashed",
  data: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].flatMap(
    (year, k) => [
      {
        id: "Survey",
        year,
        value: [2017, 2018, 2021].includes(year) ? null : 40 + 6 * Math.sin(k),
      },
      {id: "Census", year, value: 30 + k * 2},
    ],
  ),
  groupBy: "id",
  lineMarkers: true,
  x: "year",
  y: "value",
};
