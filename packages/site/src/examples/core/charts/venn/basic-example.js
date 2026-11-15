// Each row is a region: one set's circle, or where several sets overlap.
// `size` counts the people in every one of the row's sets.
const languages = [
  {sets: ["Python"], size: 540},
  {sets: ["SQL"], size: 480},
  {sets: ["R"], size: 210},
  {sets: ["Python", "SQL"], size: 260},
  {sets: ["Python", "R"], size: 120},
  {sets: ["R", "SQL"], size: 95},
  {sets: ["Python", "R", "SQL"], size: 70},
];

const config = {
  data: languages,
};
