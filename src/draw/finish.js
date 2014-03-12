//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finalize Visualization
//------------------------------------------------------------------------------
d3plus.draw.finish = function(vars) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Reset all "change" values to false
  //------------------------------------------------------------------------
  function reset_change(obj) {
    if (obj.changed) obj.changed = false
    else {
      for (o in obj) {
        if (obj[o] != null && typeof obj[o] == "object" && !(obj[o] instanceof Array)) {
          reset_change(obj[o])
        }
      }
    }
  }
  reset_change(vars)

  setTimeout(function(){
    vars.frozen = false
  },vars.style.timing.transitions)

  if (vars.internal_error) {
    d3plus.ui.message(vars,vars.internal_error)
    vars.internal_error = null
  }
  else {
    d3plus.ui.message(vars)
  }

}
