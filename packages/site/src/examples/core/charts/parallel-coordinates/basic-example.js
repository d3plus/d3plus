const cars = (() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const makes = {
    USA: ["AMC", "Buick", "Chevrolet", "Dodge", "Ford", "Plymouth"],
    Japan: ["Honda", "Mazda", "Toyota"],
    Europe: ["Fiat", "Renault", "Volkswagen"],
  };
  return Array.from({length: 48}, (_, i) => {
    const origin = ["USA", "Japan", "USA", "Europe"][i % 4];
    const cylinders = origin === "USA" ? [4, 6, 8][i % 3] : i % 5 ? 4 : 6;
    const weight = Math.round(250 + cylinders * 420 + random() * 600);
    const horsepower = Math.round(weight / 25 - 30 + random() * 30);
    return {
      name: makes[origin][i % makes[origin].length] + " '" + (70 + (i % 13)),
      origin,
      cylinders,
      horsepower,
      weight,
      acceleration: Math.round((23 - horsepower / 25 + random() * 3) * 10) / 10,
      mpg: Math.round((54 - weight / 100 + random() * 5) * 10) / 10,
    };
  });
})();

const config = {
  data: cars,
  groupBy: ["origin", "name"],
};
