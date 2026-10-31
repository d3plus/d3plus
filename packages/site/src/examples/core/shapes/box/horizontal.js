const config = {
  data: [
    {group: "A", v: 40},
    {group: "A", v: 55},
    {group: "A", v: 70},
    {group: "A", v: 85},
    {group: "A", v: 110},
    {group: "A", v: 140},
    {group: "B", v: 90},
    {group: "B", v: 120},
    {group: "B", v: 150},
    {group: "B", v: 175},
    {group: "B", v: 210},
    {group: "B", v: 240},
  ],
  orient: "horizontal",
  x: "v",
  y: d => (d.group === "A" ? 110 : 230),
};
