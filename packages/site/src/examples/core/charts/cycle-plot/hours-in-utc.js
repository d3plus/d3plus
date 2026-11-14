// Hourly electricity demand (MW) over two weeks, stored as UTC timestamps:
// a morning and an evening peak, lower on weekends.
const demand = [];
const start = Date.UTC(2024, 0, 1);
for (let h = 0; h < 14 * 24; h++) {
  const time = new Date(start + h * 3600e3);
  const hour = time.getUTCHours();
  const weekend = [0, 6].includes(time.getUTCDay());
  const peaks =
    Math.exp(-((hour - 8) ** 2) / 6) + 1.3 * Math.exp(-((hour - 19) ** 2) / 8);
  demand.push({
    time: time.toISOString(),
    day: time.toISOString().slice(0, 10),
    demand: Math.round((weekend ? 380 : 450) + 260 * peaks),
  });
}

const config = {
  data: demand,
  period: "hour",
  time: "day",
  x: "time",
  xConfig: {utc: true},
  y: "demand",
};
