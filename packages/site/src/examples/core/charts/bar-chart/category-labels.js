const monthlyValues = [2022, 2023, 2024].flatMap((year, k) =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map((month, i) => ({
    month: `${month} ${year}`,
    value: 10 + ((i * 7 + k * 5) % 13),
  })),
);

const config = {
  data: monthlyValues,
  groupBy: "month",
  x: "month",
  y: "value",
};
