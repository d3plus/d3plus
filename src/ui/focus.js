//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus tooltip, if applicable
//-------------------------------------------------------------------

d3plus.ui.focus = function(vars) {

  if (!vars.internal_error && vars.focus.value && !vars.small) {

    var data = vars.data.pool.filter(function(d){
      return d3plus.variable.value(vars,d,vars.id.key) == vars.focus.value
    })

    if (data.length >= 1) {
      data = data[0]
    }
    else {
      data = {}
      data[vars.id.key] = vars.focus.value
    }

    var offset = vars.style.labels.padding

    d3plus.tooltip.app({
      "anchor": "top left",
      "arrow": false,
      "data": data,
      "length": "long",
      "fullscreen": false,
      "id": vars.type.value+"_focus",
      "offset": 0,
      "vars": vars,
      "x": vars.width.value-vars.margin.right-offset,
      "y": vars.margin.top+offset,
      "width": vars.style.tooltip.large
    })

    if(!d3.select("div#d3plus_tooltip_id_"+vars.type.value+"_focus").empty()) {
      vars.app_width -= (vars.style.tooltip.large+offset*2)
    }

  }
  else {
    d3plus.tooltip.remove(vars.type.value+"_focus")
  }

}
