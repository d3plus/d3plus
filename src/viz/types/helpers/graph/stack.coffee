fetchValue = require "../../../../core/fetch/value.js"

module.exports = (vars, data) ->

  flip        = vars.axes.height
  stackedAxis = vars.axes.stacked
  scale       = vars[stackedAxis].scale.value
  opposite    = if stackedAxis is "x" then "y" else "x"
  margin      = vars.axes.margin.top

  stack = d3.layout.stack()
    .values (d) -> d.values
    .x (d) -> d.d3plus.x
    .y (d) -> flip - vars.y.scale.viz fetchValue vars, d, vars.y.value
    .out (d, y0, y) ->

      if scale is "share"
        d.d3plus.y0 = (1 - y0) * flip
        d.d3plus.y  = d.d3plus.y0 - (y * flip)
      else
        d.d3plus.y0 = flip - y0
        d.d3plus.y  = d.d3plus.y0 - y

      d.d3plus.y  += margin
      d.d3plus.y0 += margin

  stack.offset(if scale is "share" then "expand" else "zero") data
