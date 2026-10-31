const config = {
  nodes: [
    {id: "Ingest", x: 0, y: 1},
    {id: "Parse", x: 2, y: 0},
    {id: "Validate", x: 2, y: 2},
    {id: "Enrich", x: 4, y: 1},
    {id: "Store", x: 6, y: 0},
    {id: "Report", x: 6, y: 2},
  ],
  links: [
    {source: "Ingest", target: "Parse", step: "raw"},
    {source: "Ingest", target: "Validate", step: "schema"},
    {source: "Parse", target: "Enrich", step: "records"},
    {source: "Validate", target: "Enrich", step: "checked"},
    {source: "Enrich", target: "Store", step: "rows"},
    {source: "Enrich", target: "Report", step: "summary"},
  ],
  linkLabel: "step",
  linkLabelConfig: {rotate: "along"},
  arrows: true,
  sizeMax: 12,
};
