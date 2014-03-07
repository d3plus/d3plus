//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Removes old tooltips
//------------------------------------------------------------------------------
d3plus.draw.tooltips = function(vars) {

  if (vars.type.previous && vars.type.value != vars.type.previous) {
    d3plus.tooltip.remove(vars.type.previous);
  }
  d3plus.tooltip.remove(vars.type.value);

}
