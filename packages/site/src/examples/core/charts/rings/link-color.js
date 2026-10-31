const config = {
  center: "alpha",
  nodes: [
    {id: "alpha", team: "Core"},
    {id: "beta", team: "Core"},
    {id: "gamma", team: "Data"},
    {id: "delta", team: "Data"},
    {id: "epsilon", team: "Web"},
    {id: "zeta", team: "Web"},
  ],
  links: [
    {source: "alpha", target: "beta", kind: "owns"},
    {source: "alpha", target: "gamma", kind: "calls"},
    {source: "beta", target: "delta", kind: "calls"},
    {source: "beta", target: "epsilon", kind: "owns"},
    {source: "gamma", target: "zeta", kind: "calls"},
  ],
  color: "team",
  linkColor: "source",
  linkLabel: "kind",
  arrows: true,
};
