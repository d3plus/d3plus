color = require "./color.coffee"
ie    = require "../../../client/ie.js"
value = require "../../../core/fetch/value.coffee"

# Fill style for all shapes
module.exports = (nodes, vars) ->

  nodes
    .attr "fill", (d) ->
      if d.d3plus and d.d3plus.spline then "none" else color d, vars
    .style "stroke", (d) ->
      if d.d3plus and d.d3plus.stroke
        d.d3plus.stroke
      else
        c = if d.values then color(d.values[0], vars) else color(d, vars, true)
        d3.rgb(c).darker 0.6
    .style "stroke-width", (d) ->
      return 0 if ie and vars.types[vars.type.value].zoom
      if d.d3plus.shape is "line" and vars.size.value
        d3.max value(vars, d, vars.size.value)
      else
        mod = if d.d3plus.shape is "line" then 2 else 1
        vars.data.stroke.width * mod
    .attr "opacity", vars.data.opacity
    .attr "vector-effect", "non-scaling-stroke"
