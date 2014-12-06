print = require("../../../core/console/print.coffee")

# Sets label opacity based on zoom
module.exports = (vars) ->

  print.time "determining label visibility" if vars.dev.value

  max_scale = vars.zoom.behavior.scaleExtent()[1]

  opacity = (text) ->
    text.attr "opacity", (d) ->
      d = scale: max_scale  unless d
      size = parseFloat(d3.select(this).attr("font-size"), 10)
      d.visible = size / d.scale * vars.zoom.scale >= 7
      if d.visible then 1 else 0

  if vars.draw.timing
    vars.g.viz.selectAll("text.d3plus_label")
      .transition().duration(vars.draw.timing)
      .call opacity

  else
    vars.g.viz.selectAll("text.d3plus_label")
      .call opacity

  print.timeEnd "determining label visibility" if vars.dev.value
