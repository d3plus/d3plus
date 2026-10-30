const config = {
  data: [
    {id: "Wikipedia", value: 60, url: "https://www.wikipedia.org"},
    {id: "OpenStreetMap", value: 25, url: "https://www.openstreetmap.org"},
    {id: "Project Gutenberg", value: 10, url: "https://www.gutenberg.org"},
    {id: "Internet Archive", value: 30, url: "https://archive.org"},
  ],
  groupBy: "id",
  on: {
    "click.shape": d => window.open(d.url, "_blank", "noopener"),
  },
  sum: "value",
};
