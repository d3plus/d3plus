d3plus.method.zoom = {
  "accepted": [ Boolean ],
  "behavior": d3.behavior.zoom().scaleExtent([ 1 , 1 ]),
  "click": {
    "accepted": [ Boolean ],
    "value": true
  },
  "direction": function() {

    var vars          = this.getVars()
      , max_depth     = vars.id.nesting.length-1
      , current_depth = vars.depth.value
      , restricted    = d3plus.visualization[vars.type.value].nesting === false

    if (restricted) {
      return 0
    }
    else if (current_depth < max_depth) {
      return 1
    }
    else if (current_depth == max_depth && (vars.small || !vars.html.value)) {
      return -1
    }

    return 0

  },
  "pan": {
    "accepted": [ Boolean ],
    "value": true
  },
  "scroll": {
    "accepted": [ Boolean ],
    "value": true,
    "deprecates": ["scroll_zoom"]
  },
  "touchEvent": function() {

    var vars     = this.getVars()
      , zoomed   = vars.zoom.scale > vars.zoom.behavior.scaleExtent()[0]
      , enabled  = d3plus.visualization[vars.type.value].zoom
                 && vars.zoom.value && vars.zoom.scroll.value
      , zoomable = d3.event.touches.length > 1 && enabled

    if (!zoomable && !zoomed) {
      d3.event.stopPropagation()
    }

  },
  "value": true
}
