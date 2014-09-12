axes  = require "./includes/axes.coffee"
draw  = require "./includes/svg.coffee"
mouse = require "./includes/mouse.coffee"
plot  = require "./includes/plot.coffee"

module.exports = (vars) ->
  axes vars
  plot vars
  draw vars
  vars.mouse = mouse
  return
