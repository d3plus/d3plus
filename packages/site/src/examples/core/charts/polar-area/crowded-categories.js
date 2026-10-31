const config = {
  data: Array.from({length: 48}, (_v, k) => {
    const h = k / 2;
    return {
      time: `${String(Math.floor(h)).padStart(2, "0")}:${k % 2 ? "30" : "00"}`,
      trips: Math.round(
        40 +
          200 * Math.exp(-((h - 8) ** 2) / 6) +
          160 * Math.exp(-((h - 18) ** 2) / 8),
      ),
    };
  }),
  groupBy: "time",
  value: "trips",
};
