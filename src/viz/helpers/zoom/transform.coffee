module.exports = (vars, timing) ->

  timing     = vars.timing.transitions if typeof timing isnt "number"
  translate  = "translate(" + vars.zoom.translate + ")"
  translate += "scale(" + vars.zoom.scale + ")"

  if timing
    vars.g.viz.transition().duration(timing).attr "transform", translate
  else
    vars.g.viz.attr "transform", translate
