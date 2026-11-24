const margins = [6, 9, 4, -2, -5, -3, 2, 7, 11, 8, 1, -4, -6, 0, 5, 9];

const config = {
  data: margins.map((margin, i) => ({id: "Margin", week: i + 1, margin})),
  groupBy: "id",
  x: "week",
  y: "margin",
  growFrom: 0,
  valueColors: {values: [0]},
};
