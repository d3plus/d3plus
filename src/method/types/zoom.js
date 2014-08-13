d3plus.method.zoom = {
  "accepted"   : [ Boolean ],
  "behavior"   : d3.behavior.zoom().scaleExtent([ 1 , 1 ]),
  "click"      : {
    "accepted" : [ Boolean ],
    "value"    : true
  },
  "direction"  : function( data ) {

    var vars          = this.getVars()
      , max_depth     = vars.id.nesting.length-1
      , current_depth = vars.depth.value
      , restricted    = vars.types[vars.type.value].nesting === false

    if (restricted) {
      return 0
    }
    else if ( data.d3plus.merged || current_depth < max_depth
              && ( !data || vars.id.nesting[vars.depth.value+1] in data ) ) {
      return 1
    }
    else if ( ( current_depth === max_depth || ( data && !(vars.id.nesting[vars.depth.value+1] in data) ) )
              && ( vars.small || !vars.tooltip.html.value ) ) {
      return -1
    }

    return 0

  },
  "pan"        : {
    "accepted" : [ Boolean ],
    "value"    : true
  },
  "scroll"     : {
    "accepted"   : [ Boolean ],
    "deprecates" : "scroll_zoom",
    "value"      : true
  },
  "touchEvent" : function() {

    var vars     = this.getVars()
      , zoomed   = vars.zoom.scale > vars.zoom.behavior.scaleExtent()[0]
      , enabled  = vars.types[vars.type.value].zoom
                 && vars.zoom.value && vars.zoom.scroll.value
      , zoomable = d3.event.touches.length > 1 && enabled

    if (!zoomable && !zoomed) {
      d3.event.stopPropagation()
    }

  },
  "value"      : true
}
