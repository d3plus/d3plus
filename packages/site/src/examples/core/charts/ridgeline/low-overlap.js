const tracks = (() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const genres = [
    "Ambient",
    "Blues",
    "Classical",
    "Country",
    "Electronic",
    "Folk",
    "Jazz",
    "Metal",
    "Pop",
    "Rock",
  ];
  return genres.flatMap((genre, g) =>
    Array.from({length: 80}, (_, i) => {
      const long = g % 3 === 0 && random() < 0.35;
      const minutes =
        3 + (g % 4) * 0.6 + (long ? 4 : 0) + (0.6 + (g % 3) * 0.3) * normal();
      return {
        genre,
        track: genre + " " + (i + 1),
        "Length (minutes)": Math.round(Math.max(0.5, minutes) * 10) / 10,
      };
    }),
  );
})();

const config = {
  data: tracks,
  densityScale: "width",
  groupBy: "genre",
  legend: false,
  overlap: 0.9,
  value: "Length (minutes)",
};
