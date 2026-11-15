// Compass bearings, in degrees, of the wind in spring and autumn.
const config = {
  data: ["Spring", "Autumn"].flatMap((season, s) =>
    Array.from({length: 12}, (_v, k) => ({
      season,
      bearing: k * 30,
      hours: Math.round(
        20 + 60 * Math.exp(-((k - (s ? 8 : 3)) ** 2) / (s ? 3 : 5)),
      ),
    })),
  ),
  groupBy: "season",
  x: "bearing",
  y: "hours",
  xDomain: [0, 360],
  xFormat: d => `${d}°`,
  direction: "clockwise",
  startAngle: 0,
};
