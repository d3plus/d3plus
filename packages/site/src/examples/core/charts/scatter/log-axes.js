const animals = [
  ["Mouse", 0.023, 0.4],
  ["Rat", 0.28, 1.9],
  ["Guinea pig", 1.04, 5.5],
  ["Cat", 3.3, 25.6],
  ["Rhesus monkey", 6.8, 179],
  ["Dog", 10, 72],
  ["Sheep", 55.5, 175],
  ["Human", 62, 1320],
  ["Pig", 192, 180],
  ["Cow", 465, 423],
  ["Horse", 521, 655],
  ["Giraffe", 529, 680],
  ["Asian elephant", 2547, 4603],
  ["African elephant", 6654, 5712],
].map(([id, body, brain]) => ({
  id,
  "Body Mass (kg)": body,
  "Brain Mass (g)": brain,
}));

const config = {
  data: animals,
  groupBy: "id",
  x: "Body Mass (kg)",
  xConfig: {scale: "log", minorGrid: true},
  y: "Brain Mass (g)",
  yConfig: {scale: "log", minorGrid: true},
};
