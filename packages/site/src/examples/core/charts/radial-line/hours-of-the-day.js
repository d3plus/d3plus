// Cars past a counter each hour, on weekdays and at weekends.
const config = {
  data: ["Weekday", "Weekend"].flatMap(day =>
    Array.from({length: 24}, (_v, hour) => ({
      day,
      hour,
      cars: Math.round(
        day === "Weekday"
          ? 120 +
              900 * Math.exp(-((hour - 8) ** 2) / 3) +
              800 * Math.exp(-((hour - 17.5) ** 2) / 4)
          : 100 + 500 * Math.exp(-((hour - 14) ** 2) / 14),
      ),
    })),
  ),
  groupBy: "day",
  x: "hour",
  y: "cars",
  xDomain: [0, 24],
  xFormat: h => `${String(h).padStart(2, "0")}:00`,
};
