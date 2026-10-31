const config = {
  nodes: [
    {id: "Plan"},
    {id: "Design"},
    {id: "Build"},
    {id: "Test"},
    {id: "Release"},
  ],
  links: [
    {source: "Plan", target: "Design"},
    {source: "Design", target: "Build"},
    {source: "Build", target: "Test"},
    {source: "Test", target: "Release"},
    {source: "Plan", target: "Build"},
    {source: "Design", target: "Release"},
  ],
  arrows: true,
};
