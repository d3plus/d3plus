// Every combination of five sets: Grünbaum's five ellipses give each one a
// region of its own.
const names = ["Ann", "Ben", "Cal", "Dee", "Eve"];
const rows = [];
for (let mask = 1; mask < 1 << names.length; mask++) {
  const sets = names.filter((_, k) => mask & (1 << k));
  rows.push({sets, size: Math.round(400 / 2 ** sets.length)});
}

const config = {
  data: rows,
  proportional: false,
};
