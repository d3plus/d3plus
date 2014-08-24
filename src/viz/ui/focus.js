var fetchValue = require("../../core/fetch/value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus tooltip, if applicable
//-------------------------------------------------------------------
d3plus.ui.focus = function(vars) {

  if (!vars.internal_error && vars.focus.value.length === 1 && vars.focus.value.length && !vars.small && vars.focus.tooltip.value) {

    if ( vars.dev.value ) d3plus.console.time("drawing focus tooltip")

    var data = vars.data.pool.filter(function(d){
      return fetchValue(vars,d,vars.id.value) == vars.focus.value[0]
    })

    if (data.length >= 1) {
      data = data[0]
    }
    else {
      data = {}
      data[vars.id.value] = vars.focus.value[0]
    }

    var offset = vars.labels.padding

    d3plus.tooltip.app({
      "anchor": "top left",
      "arrow": false,
      "data": data,
      "length": "long",
      "fullscreen": false,
      "id": "visualization_focus",
      "maxheight": vars.height.viz-offset*2,
      "mouseevents": true,
      "offset": 0,
      "vars": vars,
      "x": vars.width.value-vars.margin.right-offset,
      "y": vars.margin.top+offset,
      "width": vars.tooltip.large
    })

    if(!d3.select("div#d3plus_tooltip_id_visualization_focus").empty()) {
      vars.width.viz -= (vars.tooltip.large+offset*2)
    }

    if ( vars.dev.value ) d3plus.console.timeEnd("drawing focus tooltip")

  }
  else {
    d3plus.tooltip.remove("visualization_focus")
  }

}
