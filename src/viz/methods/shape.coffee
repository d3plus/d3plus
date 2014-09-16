module.exports =
  accepted:    ["circle", "donut", "line", "square", "area", "coordinates"]
  interpolate:
    accepted:   ["basis", "basis-open", "cardinal", "cardinal-open", "linear", "monotone", "step", "step-before", "step-after"]
    deprecates: "stack_type"
    value:      "linear"
  rendering:
    accepted: ["auto", "optimizeSpeed", "crispEdges", "geometricPrecision"]
    value:    "auto"
  value:       false
