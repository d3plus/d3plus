// Visits and sign-ups by channel, by month.
const channels = ["Search", "Social", "Email", "Direct"];
const months = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
];
const data = channels.flatMap((channel, c) =>
  months.map((month, m) => ({
    channel,
    month,
    visits: 1200 + c * 400 + m * (80 + c * 30),
    signups: 40 + c * 25 + m * (3 + c),
  })),
);

const config = {
  title: "Acquisition",
  theme: "dark",
  chartConfig: {theme: "dark", locale: "es-ES"},
  charts: [
    {
      chart: "StackedArea",
      config: {
        data,
        groupBy: "channel",
        x: "month",
        y: "visits",
        title: "Visitas",
      },
    },
    {
      chart: "BarChart",
      config: {
        data: data.filter(d => d.month === "2025-06"),
        groupBy: "channel",
        x: "channel",
        y: "signups",
        legend: false,
        title: "Registros, junio",
      },
    },
  ],
};
