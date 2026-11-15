const channels = [
  {sets: ["Email"], size: 300},
  {sets: ["Social"], size: 260},
  {sets: ["Search"], size: 180},
  {sets: ["Email", "Social"], size: 90},
  {sets: ["Email", "Search"], size: 60},
  {sets: ["Search", "Social"], size: 40},
  {sets: ["Email", "Search", "Social"], size: 20},
];

const palette = {Email: "#4c6ef5", Social: "#e64980", Search: "#20c997"};

const config = {
  data: channels,
  labelCounts: "inclusive",
  // Overlaps blend the colors of their sets.
  color: d => palette[d.sets[0]],
};
