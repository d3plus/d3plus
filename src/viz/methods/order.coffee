module.exports =
  accepted:   [Boolean, Function, String]
  agg:
    accepted: [false, Function, "sum", "min", "max", "mean", "median"]
    value:    false
  deprecates: ["sort"]
  sort:
    accepted:   ["asc", "desc"]
    value:      "desc"
  value:    false
