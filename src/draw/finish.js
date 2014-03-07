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
        if (Object.keys(d3plus.public).indexOf(o) >= 0) {
          if (o == "changed" && obj[o]) obj[o] = false
          else if (obj[o] != null && typeof obj[o] == "object") {
            reset_change(obj[o])
          }
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
