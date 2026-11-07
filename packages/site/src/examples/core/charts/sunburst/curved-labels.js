const config = {
  data: [
    {area: "Frontend", module: "Components", file: "Table", size: 410},
    {area: "Frontend", module: "Components", file: "Modal", size: 240},
    {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
    {area: "Frontend", module: "Pages", file: "Settings", size: 180},
    {area: "Backend", module: "API", file: "Orders", size: 460},
    {area: "Backend", module: "API", file: "Users", size: 330},
    {area: "Backend", module: "Database", file: "Migrations", size: 380},
    {area: "Backend", module: "Database", file: "Models", size: 290},
    {area: "Docs", module: "Reference", file: "API Reference", size: 260},
  ],
  groupBy: ["area", "module", "file"],
  sum: "size",
  labelPosition: "auto",
};
