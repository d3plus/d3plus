color = require "./color.coffee"

# Fill style for all shapes
module.exports = (nodes, vars) ->

  nodes
    .attr "fill", (d) ->

      if d.d3plus and d.d3plus.spline then "none" else color d, vars

    .style "stroke", (d) ->

      c = if d.values then color(d.values[0], vars) else color(d, vars)
      d3.rgb(c).darker 0.5

    .style "stroke-width", (d) ->

      mod = if d.d3plus.shape is "line" then 2 else 1
      vars.data.stroke.width * mod

    .attr "opacity", vars.data.opacity
    .attr "vector-effect", "non-scaling-stroke"
