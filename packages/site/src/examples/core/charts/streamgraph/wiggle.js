const genres = {
  Rock: [38, 36, 33, 30, 27, 24, 21, 19, 17, 15, 14],
  Pop: [22, 24, 27, 29, 30, 31, 30, 29, 28, 27, 26],
  "Hip-Hop": [8, 10, 13, 16, 20, 24, 28, 31, 33, 34, 35],
  Electronic: [4, 5, 6, 8, 11, 14, 16, 17, 17, 16, 15],
  Country: [12, 12, 11, 11, 12, 12, 13, 13, 14, 14, 15],
  Jazz: [6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 4],
};

const streamData = Object.entries(genres).flatMap(([genre, shares]) =>
  shares.map((share, i) => ({genre, year: 2014 + i, share})),
);

const config = {
  data: streamData,
  groupBy: "genre",
  x: "year",
  y: "share",
  stackOffset: "wiggle",
};
