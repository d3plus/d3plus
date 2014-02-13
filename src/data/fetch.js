//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Fetches specific years of data
//-------------------------------------------------------------------

d3plus.data.fetch = function(vars,format,years) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The "format" has not been specified, use the current data type
  //----------------------------------------------------------------------------
  if (!format) {
    var format = vars.data.type
  }

  if (format == "object") {
    return_data = {};
  }
  else {
    return_data = [];
  }
  
  if (vars.dev.value) d3plus.console.group("Fetching \""+format+"\" data")
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If "years" have not been requested, determine the years using .time() 
  // solo and mute
  //----------------------------------------------------------------------------
  if (!years) {

    if (vars.time.solo.value.length) {
      var years = []
      vars.time.solo.value.forEach(function(y){
        if (typeof y == "function") {
          vars.data.time.forEach(function(t){
            if (y(t)) {
              years.push(t)
            }
          })
        }
        else {
          years.push(y)
        }
      })
    }
    else if (vars.time.mute.value.length) {
      var muted = []
      vars.time.mute.value.forEach(function(y){
        if (typeof y == "function") {
          vars.data.time.forEach(function(t){
            if (y(t)) {
              muted.push(t)
            }
          })
        }
        else {
          muted.push(y)
        }
      })
      var years = vars.data.time.filter(function(t){
        return muted.indexOf(t) < 0
      })
    }
    else {
      var years = ["all"]
    }
    
  }
  
  if (vars.dev.value) console.log("years: "+years.join(","))
  
  if (format == "restricted") {
    var data = vars.data.restricted
  }
  else if (format == "nested" && years.length > 1) {
    var data = vars.data.grouped[vars.id.nesting[vars.depth.value]]
  }
  else {
    var data = vars.data[format][vars.id.nesting[vars.depth.value]]
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If there is only 1 year needed, just grab it!
  //----------------------------------------------------------------------------
  if (years.length == 1) {
    return_data = data[years[0]]
  }
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Otherwise, we need to grab each year individually
  //----------------------------------------------------------------------------
  else {
    
    var missing = []
        
    years.forEach(function(y){

      if (data[y]) {
        
        if (format == "object") {
          for (k in data[y]) {
            if (!return_data[data[y][k][vars.id.key]]) {
              return_data[data[y][k][vars.id.key]] = []
            }
            return_data[data[y][k][vars.id.key]].push(data[y][k])
          }
        }
        else {
          return_data = return_data.concat(data[y])
        }
      }
      else {
        missing.push(y)
      }
        
    })
    
    if (return_data.length == 0 && missing.length) {
      vars.internal_error = "No Data Available for "+missing.join(", ")
      d3plus.console.warning(vars.internal_error)
    }
    else {
      vars.internal_error = null
    }
    
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Finally, we need to determine if the data needs to be merged together
  //----------------------------------------------------------------------------
  if (years.length > 1) {

    var separated = false
    vars.axes.values.forEach(function(a){
      if (vars[a].key == vars.time.key && vars[a].scale.value == "continuous") {
        separated = true
      }
    })
    
    if (!separated) {
      
      var nested = vars.id.nesting.slice(0,vars.depth.value+1)
      
      if (return_data instanceof Array) {
        return_data = d3plus.data.nest(vars,return_data,nested,format == "grouped")
      }
      else if (typeof return_data == "object") {
        for (k in return_data) {
          return_data[k] = d3plus.data.nest(vars,return_data[k],nested)[0]
        }
      }
  
    }
    
  }
  
  if (!return_data) {
    if (format == "object") {
      return_data = {};
    }
    else {
      return_data = [];
    }
  }
  
  if (vars.dev.value) d3plus.console.groupEnd()
  
  return return_data
  
}