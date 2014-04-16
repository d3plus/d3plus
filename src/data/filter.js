//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------
d3plus.data.filter = function(vars) {

  if (vars.check.indexOf("time") >= 0) {
    vars.check.splice(vars.check.indexOf("time"),1)
    if (vars.data.filtered) {
      vars.data.filtered = {"all": vars.data.filtered.all}
    }
  }

  if (!vars.filters) {
    vars.filters = vars.check.slice(0)
  }
  else {
    vars.check.forEach(function(k){
      if (!vars[k].value && vars.filters.indexOf(k) >= 0) {
        vars.filters.splice(vars.filters.indexOf(k),1)
      }
    })
  }

  if (vars.check.length >= 1) {

    if (vars.dev.value) d3plus.console.group("Filtering Data by Required Variables");
    var checking = vars.filters.join(", ")
    if (vars.dev.value) d3plus.console.time(checking)

    var data = "value"
    vars.filters.forEach(function(key){

      if (key == "xaxis") vars.x_range = null
      else if (key == "yaxis") vars.y_range = null

      vars.data.filtered = vars.data[data].filter(function(d){
        var val = d3plus.variable.value(vars,d,vars[key].value)
        if (key == "size") {
          return val > 0 ? true : false
        }
        else {
          return val != null
        }
      })
      data = "filtered"

    })

    vars.data.filtered = {"all": vars.data.filtered}

    if (vars.dev.value) d3plus.console.timeEnd(checking)
    if (vars.dev.value) d3plus.console.groupEnd();
  }
  else if (!vars.data.filtered) {
    vars.data.filtered = {"all": vars.data.value}
  }

  if (vars.time.value && Object.keys(vars.data.filtered).length == 1) {

    if (vars.dev.value) d3plus.console.group("Disaggregating by Year")

    // Find available years
    vars.data.time = d3plus.util.uniques(vars.data.filtered.all,vars.time.value)
    for (var i=0; i < vars.data.time.length; i++) {
      vars.data.time[i] = parseInt(vars.data.time[i])
    }
    vars.data.time = vars.data.time.filter(function(t){ return t; })
    vars.data.time.sort()

    if (vars.data.time.length) {
      if (vars.dev.value) d3plus.console.time(vars.data.time.length+" years")
      vars.data.time.forEach(function(y){
        vars.data.filtered[y] = vars.data.filtered.all.filter(function(d){
          return d3plus.variable.value(vars,d,vars.time.value) == y;
        })
      })
      if (vars.dev.value) d3plus.console.timeEnd(vars.data.time.length+" years")
    }

    if (vars.dev.value) d3plus.console.groupEnd()

  }

}
