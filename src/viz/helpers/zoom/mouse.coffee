labels    = require "./labels.coffee"
transform = require "./transform.coffee"

module.exports = (vars) ->

  eventType = if d3.event.sourceEvent then d3.event.sourceEvent.type else null
  translate = d3.event.translate
  scale     = d3.event.scale
  limits    = vars.zoom.bounds
  xoffset   = (vars.width.viz - (vars.zoom.size.width * scale)) / 2
  xmin      = (if xoffset > 0 then xoffset else 0)
  xmax      = (if xoffset > 0 then vars.width.viz - xoffset else vars.width.viz)
  yoffset   = (vars.height.viz - (vars.zoom.size.height * scale)) / 2
  ymin      = (if yoffset > 0 then yoffset else 0)
  ymax      = (if yoffset > 0 then vars.height.viz - yoffset else vars.height.viz)

  # Auto center visualization
  if translate[0] + limits[0][0] * scale > xmin
    translate[0] = -limits[0][0] * scale + xmin
  else if translate[0] + limits[1][0] * scale < xmax
    translate[0] = xmax - (limits[1][0] * scale)

  if translate[1] + limits[0][1] * scale > ymin
    translate[1] = -limits[0][1] * scale + ymin
  else if translate[1] + limits[1][1] * scale < ymax
    translate[1] = ymax - (limits[1][1] * scale)

  vars.zoom.behavior.translate(translate).scale scale

  vars.zoom.translate = translate
  vars.zoom.scale     = scale

  if eventType is "wheel"
    delay = (if vars.draw.timing then 100 else 250)
    clearTimeout vars.zoom.wheel
    vars.zoom.wheel = setTimeout( ->
      labels vars
    , delay)
  else
    labels vars

  if eventType is "dblclick"
    transform vars, vars.timing.transitions
  else
    transform vars, 0
