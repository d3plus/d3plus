print = require("../../../core/console/print.coffee")

# Sets label opacity based on zoom
module.exports = (vars) ->

  print.time "determining label visibility" if vars.dev.value

  scale = vars.zoom.behavior.scaleExtent()

  opacity = (text) ->
    text.attr "opacity", (d) ->
      d = {} unless d
      size = parseFloat(d3.select(this).attr("font-size"), 10)
      d.visible = size * (vars.zoom.scale/scale[1]) >= 2
      if d.visible then 1 else 0

  if vars.draw.timing
    vars.g.viz.selectAll("text.d3plus_label")
      .transition().duration(vars.draw.timing)
      .call opacity

  else
    vars.g.viz.selectAll("text.d3plus_label")
      .call opacity

  print.timeEnd "determining label visibility" if vars.dev.value
