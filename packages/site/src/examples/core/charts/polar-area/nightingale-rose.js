const months = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const deaths = {
  Disease: [1, 12, 11, 359, 828, 788, 503, 844, 1725, 2761, 2120, 1205],
  Wounds: [0, 0, 0, 0, 1, 81, 132, 287, 114, 83, 42, 32],
  Other: [5, 9, 6, 23, 30, 70, 128, 106, 131, 324, 361, 172],
};

const crimea = Object.keys(deaths).flatMap(cause =>
  months.map((month, m) => ({cause, month, deaths: deaths[cause][m]})),
);

const config = {
  data: crimea,
  groupBy: "cause",
  metric: "month",
  value: "deaths",
  color: d =>
    ({Disease: "#4c6ef5", Wounds: "#e03131", Other: "#868e96"})[d.cause],
};
