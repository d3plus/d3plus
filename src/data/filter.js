//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------
d3plus.data.filter = function(vars) {
  
  if (vars.check.indexOf("time") >= 0 && vars.data.filtered) {
    vars.data.filtered = {"all": vars.data.filtered.all}
  }
  
  if (vars.check.length > 1 || (vars.check.length == 1 && vars.check[0] != "time")) {
    
    if (vars.dev.value) d3plus.console.group("Filtering Data by Required Variables");
    var checking = vars.check.join(", ")
    if (vars.dev.value) d3plus.console.time(checking)
    
    var data = "value"
    vars.check.forEach(function(key){
      if (key != "time") {
        
        if (key == "xaxis") vars.x_range = null
        else if (key == "yaxis") vars.y_range = null
        
        vars.data.filtered = vars.data[data].filter(function(d){
          var variable = vars[key].value ? vars[key].value : vars[key].key
          var val = d3plus.variable.value(vars,d,variable)
          return val != null
        })
        data = "filtered"
        
      }
    })
    vars.data.filtered = {"all": vars.data.filtered}
    
    if (vars.dev.value) d3plus.console.timeEnd(checking)
    if (vars.dev.value) d3plus.console.groupEnd();
  }
  else if (!vars.data.filtered) {
    vars.data.filtered = {"all": vars.data.value}
  }
  
  if (vars.time.key && Object.keys(vars.data.filtered).length == 1) {
    
    if (vars.dev.value) d3plus.console.group("Disaggregating by Year")

    // Find available years
    vars.data.time = d3plus.utils.uniques(vars.data.filtered.all,vars.time.key)
    
    vars.data.time.sort()
    
    if (vars.data.time.length) {
      if (vars.dev.value) d3plus.console.time(vars.data.time.length+" years")
      vars.data.time.forEach(function(y){
        vars.data.filtered[y] = vars.data.filtered.all.filter(function(d){
          return d3plus.variable.value(vars,d,vars.time.key) == y;
        })
      })
      if (vars.dev.value) d3plus.console.timeEnd(vars.data.time.length+" years")
    }
    
    if (vars.dev.value) d3plus.console.groupEnd()
    
  }
    
}
