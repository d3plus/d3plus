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
  ].flatMap((month, i) => {
    const low = [-3, -2, 2, 7, 12, 17, 20, 19, 15, 9, 4, -1][i];
    const high = [4, 6, 11, 17, 22, 27, 30, 29, 25, 18, 11, 6][i];
    return [
      {month, stat: "Low", "°C": low},
      {month, stat: "Mean", "°C": (low + high) / 2},
      {month, stat: "High", "°C": high},
    ];
  }),
  groupBy: "stat",
  discrete: "x",
  x: "month",
  y: "°C",
  color: d => ({Low: "#4c6ef5", Mean: "#868e96", High: "#f03e3e"})[d.stat],
};
