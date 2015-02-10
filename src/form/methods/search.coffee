module.exports =
  accepted: ["auto", Boolean]
  process:  (value) ->
    @enabled = value if typeof value is "Boolean"
    value
  term:  ""
  value: "auto"
