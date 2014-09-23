module.exports = (vars, event) ->

  zoom     = vars.zoom
  event    = d3.event unless event

  zoomed   = zoom.scale > zoom.behavior.scaleExtent()[0]
  enabled  = vars.types[vars.type.value].zoom and zoom.value and zoom.scroll.value
  zoomable = event.touches and event.touches.length > 1 and enabled

  event.stopPropagation() if not zoomable and not zoomed
  return
