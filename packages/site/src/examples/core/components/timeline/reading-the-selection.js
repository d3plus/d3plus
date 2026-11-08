const sales = ["Apples", "Pears", "Plums", "Figs"].flatMap((fruit, i) =>
  Array.from({length: 10}, (_, y) => ({
    fruit,
    year: 2015 + y,
    sales: 30 + ((i * 7 + y * 5) % 11) * 8,
  })),
);

// `on.end` receives a Date for one period, or [start, end] for a range.
const years = period => [].concat(period).map(d => new Date(d).getFullYear());

let picked = "2020–2021";

const config = {
  data: sales,
  groupBy: "fruit",
  sum: "sales",
  time: "year",
  timelineDefault: ["2020", "2021"],
  subtitle: () => `You picked ${picked}`,
  timelineConfig: {
    on: {
      end: period => {
        const [first, last] = years(period);
        picked = first === last ? `${first}` : `${first}–${last}`;
      },
    },
  },
};
