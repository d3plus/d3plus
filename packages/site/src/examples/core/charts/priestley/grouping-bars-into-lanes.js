const config = {
  data: [
    {parent: "Group 1", id: "alpha", start: 2004, end: 2007},
    {parent: "Group 2", id: "epsilon", start: 2007, end: 2012},
    {parent: "Group 1", id: "beta", start: 2005, end: 2010},
    {parent: "Group 1", id: "gamma", start: 2008, end: 2013},
    {parent: "Group 2", id: "delta", start: 2004, end: 2007},
  ],
  end: "end",
  groupBy: ["parent", "id"],
  shapeConfig: {
    fill: d => (d.parent === "Group 1" ? "firebrick" : "cornflowerblue"),
  },
  start: "start",
};
