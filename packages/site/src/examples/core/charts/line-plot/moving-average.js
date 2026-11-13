// Daily closing prices from a seeded random walk, so every load draws the same.
let seed = 7;
const noise = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
let price = 100;
const prices = Array.from({length: 120}, (_, k) => {
  price = Math.max(5, price + noise() * 6 + Math.sin(k / 9) * 0.8);
  return {
    ticker: "ACME",
    date: new Date(2024, 0, k + 1),
    price: Math.round(price * 100) / 100,
  };
});

const config = {
  data: prices,
  groupBy: "ticker",
  x: "date",
  y: "price",
  trendLine: "movingAverage",
  trendLineConfig: {window: 20},
};
