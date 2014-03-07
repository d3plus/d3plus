//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus tooltip, if applicable
//-------------------------------------------------------------------

d3plus.ui.focus = function(vars) {

  if (vars.focus.value) {
    var data = vars.data.pool.filter(function(d){
      return d3plus.variable.value(vars,d,vars.id.key) == vars.focus.value
    })
  }

  if (!vars.internal_error && data && data.length == 1) {
    console.log(data)
    // var d = vars.focus.tooltip.value,
    //     d = d.data ? d.data : d,
    //     depth = d.d3plus && "depth" in d.d3plus ? d.d3plus.depth : vars.depth.value;
    //
    // d3plus.tooltip.app({
    //   "anchor": "top right",
    //   "arrow": false,
    //   "data": d,
    //   "depth": depth,
    //   "length": "long",
    //   "fullscreen": false,
    //   "id": vars.type.value+"_focus",
    //   "vars": vars,
    //   "x": vars.width.value-vars.margin.right,
    //   "y": vars.margin.top
    // })
    //
    // vars.app_width -= vars.style.tooltip.width

  }

}
