// Weekly orders per store.
const stores = {
  Downtown: [312, 298, 341, 356, 330, 372, 389, 401],
  Airport: [188, 205, 199, 176, 168, 159, 171, 162],
  Harbor: [96, 104, 111, 108, 119, 126, 122, 131],
  Station: [240, 236, 251, 247, 262, 258, 249, 244],
};

const config = {
  data: Object.entries(stores).flatMap(([store, values]) =>
    values.map((orders, week) => ({store, week: week + 1, orders})),
  ),
  groupBy: "store",
  time: "week",
  value: "orders",
  sparkline: "bar",
  tileConfig: {columns: 2},
};
