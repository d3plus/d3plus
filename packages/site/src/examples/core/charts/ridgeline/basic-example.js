const weather = (() => {
  let seed = 23;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const cities = [
    ["Lincoln", 12, 14, 6],
    ["Seattle", 12, 6, 3.5],
  ];
  return cities.flatMap(([city, mean, swing, sd]) =>
    months.flatMap((month, m) =>
      Array.from({length: 30}, (_, day) => ({
        city,
        month,
        day: day + 1,
        "Mean Temperature (°C)":
          Math.round(
            (mean -
              swing * Math.cos((2 * Math.PI * (m + 0.5)) / 12) +
              sd * normal()) *
              10,
          ) / 10,
      })),
    ),
  );
})();

const config = {
  data: weather.filter(d => d.city === "Lincoln"),
  groupBy: "month",
  legend: false,
  value: "Mean Temperature (°C)",
};
