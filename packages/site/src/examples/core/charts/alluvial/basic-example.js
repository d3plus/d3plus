const orders = [
  ["West", "Chairs", "Online", 6],
  ["West", "Chairs", "Store", 3],
  ["West", "Tables", "Online", 2],
  ["West", "Desks", "Store", 1],
  ["East", "Chairs", "Online", 2],
  ["East", "Tables", "Store", 5],
  ["East", "Desks", "Online", 3],
  ["North", "Desks", "Store", 4],
  ["North", "Chairs", "Online", 1],
].flatMap(([region, product, channel, n]) =>
  Array.from({length: n}, () => ({region, product, channel})),
);

const config = {
  data: orders,
  dimensions: ["region", "product", "channel"],
};
