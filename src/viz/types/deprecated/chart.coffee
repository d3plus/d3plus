print = require("../../../general/console.coffee")

chart = (vars) ->

  types =
    circle: "scatter"
    donut:  "scatter"
    line:   "line"
    square: "scatter"
    area:   "stacked"

  type = types[vars.shape.value]
  print.warning "The \"chart\" visualization type has been deprecated, please use \"" + type + "\""
  vars.self.type(type).draw()
  return

chart.shapes   = ["circle", "donut", "line", "square", "area"]
module.exports = chart
