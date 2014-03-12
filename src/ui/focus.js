//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus tooltip, if applicable
//-------------------------------------------------------------------

d3plus.ui.focus = function(vars) {

  if (!vars.internal_error && vars.focus.value) {

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

    d3plus.tooltip.app({
      "anchor": "top right",
      "arrow": false,
      "data": data,
      "length": "long",
      "fullscreen": false,
      "id": vars.type.value+"_focus",
      "offset": 0,
      "vars": vars,
      "x": vars.width.value-vars.margin.right,
      "y": vars.margin.top,
      "width": vars.style.tooltip.width
    })

    vars.app_width -= vars.style.tooltip.width

  }
  else {
    d3plus.tooltip.remove(vars.type.value+"_focus")
  }

}
