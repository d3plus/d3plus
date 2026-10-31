const monthly = ["alpha", "beta"].flatMap((id, s) =>
  Array.from({length: 12}, (_, m) => ({
    id,
    date: `2024-${String(m + 1).padStart(2, "0")}-01`,
    y: 10 + ((m * 5 + s * 7) % 13) + s * 4,
  })),
);

const config = {
  data: monthly,
  groupBy: "id",
  time: "date",
  x: "date",
  y: "y",
};
