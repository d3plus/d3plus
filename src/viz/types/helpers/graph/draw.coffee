axes  = require "./includes/axes.coffee"
draw  = require "./includes/svg.coffee"
mouse = require "./includes/mouse.coffee"
plot  = require "./includes/plot.coffee"

module.exports = (vars, opts) ->
  opts = {} if opts is undefined
  axes vars, opts
  plot vars, opts
  draw vars, opts
  vars.mouse.viz = if opts.mouse is true then mouse else false
  return
