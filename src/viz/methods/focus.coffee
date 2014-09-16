module.exports =
  accepted:   [false, Array, Function, Number, String]
  deprecates: "highlight"
  process:    (value) -> if value is false then [] else if value instanceof Array then value else [value]
  tooltip:
    accepted: [Boolean]
    value:    true
  value:      []
