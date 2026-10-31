const config = {
  nodes: [
    {id: "Plan"},
    {id: "Design"},
    {id: "Build"},
    {id: "Test"},
    {id: "Review"},
    {id: "Release"},
  ],
  links: [
    {source: "Plan", target: "Design"},
    {source: "Design", target: "Build"},
    {source: "Build", target: "Test"},
    {source: "Test", target: "Review"},
    {source: "Review", target: "Release"},
    {source: "Test", target: "Build"},
    {source: "Review", target: "Design"},
    {source: "Release", target: "Plan"},
  ],
  arcSide: "both",
  arrows: true,
  linkColor: "source",
};
