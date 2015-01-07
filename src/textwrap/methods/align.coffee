module.exports =
  accepted: [false, "start", "middle", "end", "left", "center", "right"]
  process: (value) ->
    css = ["left", "center", "right"].indexOf(value)
    value = @accepted[css + 1] if css >= 0
    value
  value: false
