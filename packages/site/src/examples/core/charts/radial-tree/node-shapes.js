const data = [
  ["Fruit", "Citrus", ["Orange", "Lemon", "Lime", "Grapefruit"]],
  ["Fruit", "Berries", ["Strawberry", "Blueberry", "Raspberry"]],
  ["Fruit", "Stone fruit", ["Peach", "Plum", "Cherry"]],
  ["Vegetables", "Roots", ["Carrot", "Beet", "Radish"]],
  ["Vegetables", "Greens", ["Spinach", "Kale", "Lettuce", "Chard"]],
].flatMap(([kind, family, items]) => items.map(item => ({kind, family, item})));

const config = {
  data,
  groupBy: ["kind", "family", "item"],
  shape: d => (d.kind === "Fruit" ? "Circle" : "Rect"),
  shapeConfig: {r: 6, width: 11, height: 11},
};
