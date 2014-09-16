module.exports = (vars, timing) ->

  timing    = vars.timing.transitions if typeof timing isnt "number"
  translate = vars.zoom.translate
  scale     = vars.zoom.scale

  if timing
    vars.g.viz.transition().duration(timing)
      .attr "transform", "translate(" + translate + ")scale(" + scale + ")"
  else
    vars.g.viz
      .attr "transform", "translate(" + translate + ")scale(" + scale + ")"

  return
