const sales = ["Apples", "Pears", "Plums", "Figs"].flatMap((fruit, i) =>
  Array.from({length: 10}, (_, y) => ({
    fruit,
    year: 2015 + y,
    sales: 30 + ((i * 7 + y * 5) % 11) * 8,
  })),
);

const config = {
  data: sales,
  groupBy: "fruit",
  sum: "sales",
  time: "year",
  timeFilter: d => d.year === 2019,
};
