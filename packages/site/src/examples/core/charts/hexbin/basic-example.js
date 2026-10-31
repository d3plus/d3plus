let seed = 11;

const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const normal = () =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

const people = Array.from({length: 2000}, () => {
  const a = normal();
  const b = normal();
  return {
    "Height (cm)": Math.round((170 + 9 * a) * 10) / 10,
    "Weight (kg)": Math.round((72 + 11 * (0.7 * a + 0.71 * b)) * 10) / 10,
    Age: Math.round(40 + 6 * b + 8 * normal()),
  };
});

const config = {
  data: people,
  x: "Height (cm)",
  y: "Weight (kg)",
};
