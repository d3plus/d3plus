labels    = require "./labels.coffee"
transform = require "./transform.coffee"

module.exports = (vars, b, timing) ->

  b = vars.zoom.bounds unless b
  timing = vars.timing.transitions if typeof timing isnt "number"

  vars.zoom.size =
    height: b[1][1] - b[0][1]
    width:  b[1][0] - b[0][0]

  type = vars.types[vars.type.value]
  fit = vars.coords.fit.value
  if fit is "auto" or type.requirements.indexOf("coords") < 0
    aspect = d3.max [
      vars.zoom.size.width/vars.width.viz,
      vars.zoom.size.height/vars.height.viz
    ]
  else
    aspect = vars.zoom.size[fit]/vars["app_"+fit]

  min = d3.min [vars.width.viz, vars.height.viz]
  padding = if type.zoom then vars.coords.padding*2 else 0
  scale = ((min-padding) / min) / aspect
  extent = vars.zoom.behavior.scaleExtent()

  if extent[0] is extent[1] or b is vars.zoom.bounds
    vars.zoom.behavior.scaleExtent [scale, scale*16]

  max_scale = vars.zoom.behavior.scaleExtent()[1]
  scale = max_scale if scale > max_scale
  vars.zoom.scale = scale

  translate = [
    vars.width.viz/2-(vars.zoom.size.width*scale)/2-(b[0][0]*scale),
    vars.height.viz/2-(vars.zoom.size.height*scale)/2-(b[0][1]*scale)
  ]

  vars.zoom.translate = translate
  vars.zoom.behavior.translate(translate).scale scale

  vars.zoom.size =
    height: vars.zoom.bounds[1][1] - vars.zoom.bounds[0][1]
    width:  vars.zoom.bounds[1][0] - vars.zoom.bounds[0][0]

  vars.zoom.reset = false

  labels(vars) if vars.labels.value or vars.labels.changed
  transform vars, timing
