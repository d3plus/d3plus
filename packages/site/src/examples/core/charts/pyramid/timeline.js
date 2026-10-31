const byYear = (() => {
  const bands = Array.from({length: 21}, (_, i) =>
    i === 20 ? "100+" : `${i * 5}-${i * 5 + 4}`,
  );
  const population = (band, year, sex) => {
    const age = band * 5,
      shift = (year - 2000) / 10;
    const births = 1 - 0.07 * shift * Math.max(0, 1 - age / 40);
    const boom = 1 + 0.3 * Math.exp(-((age - (35 + 10 * shift)) ** 2) / 120);
    const survival = Math.exp(
      -Math.pow(age / (70 + 3 * shift + (sex === "Female" ? 5 : 0)), 5),
    );
    return Math.round(1200000 * births * boom * survival);
  };
  return [2000, 2010, 2020].flatMap(Year =>
    bands.flatMap((Age, band) =>
      ["Male", "Female"].map(Sex => ({
        Year,
        Age,
        Sex,
        Population: population(band, Year, Sex),
      })),
    ),
  );
})();

const config = {
  data: byYear,
  groupBy: "Sex",
  x: "Population",
  y: "Age",
  time: "Year",
  axisPersist: true,
};
