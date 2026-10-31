const bills = (() => {
  let seed = 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return ["Thursday", "Friday", "Saturday", "Sunday"].flatMap((day, d) =>
    ["Female", "Male"].flatMap((sex, s) =>
      Array.from({length: 40 + 10 * d}, () => {
        const dinner = d > 1 && random() < 0.45;
        const bill =
          14 + 2 * d + 3 * s + (dinner ? 12 : 0) + (4 + s) * normal();
        return {
          day,
          sex,
          "Total Bill": Math.round(Math.max(3, bill) * 100) / 100,
        };
      }),
    ),
  );
})();

const config = {
  color: "sex",
  data: bills,
  groupBy: ["day", "sex"],
  value: "Total Bill",
};
