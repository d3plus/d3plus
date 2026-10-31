const config = {
  data: [
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
    month,
    anomaly: [-1.2, -0.4, 0.6, 1.4, 0.9, -0.3, 1.8, 2.1, 0.7, -0.8, -1.5, 0.2][
      i
    ],
  })),
  groupBy: "month",
  x: "month",
  y: "anomaly",
  color: d => (d.anomaly < 0 ? "#4c6ef5" : "#f03e3e"),
  legend: false,
};
