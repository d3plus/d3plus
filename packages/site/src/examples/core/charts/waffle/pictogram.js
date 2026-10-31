const person = color =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="5" r="4" fill="${color}"/><path d="M4 23v-6.5a8 7 0 0 1 16 0V23z" fill="${color}"/></svg>`,
  )}`;

const config = {
  data: [
    {mode: "Drove", people: 14, color: "#1a6fb5"},
    {mode: "Transit", people: 5, color: "#e8833a"},
    {mode: "Biked", people: 3, color: "#3f9b4f"},
    {mode: "Walked", people: 2, color: "#8a5cc2"},
    {mode: "Remote", people: 6, color: "#9aa0a6"},
  ],
  groupBy: "mode",
  sum: "people",
  color: "color",
  icon: d => person(d.color),
  unit: 1,
  cellPadding: 4,
};
