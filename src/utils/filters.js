//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------

d3plus.utils.data_filter = function(vars,check_data) {
  
  // If both filter and solo exist, only check for solo
  if (vars.check.indexOf("filter") >= 0 && vars.check.indexOf("solo") >= 0) {
    vars.check.splice(vars.check.indexOf("filter"),1)
  }
  
  if (vars.check.indexOf(vars.year_var) >= 0) {
    vars.check.splice(vars.check.indexOf(vars.year_var),1)
    if (vars.data.filtered) vars.data.filtered = {"all": vars.data.filtered.all}
  }
  
  if (vars.check.indexOf(vars.active) >= 0) {
    vars.check.splice(vars.check.indexOf(vars.active),1)
    vars.data.active.all = null
    vars.data.inactive.all = null
  }
  
  if (vars.check.length) {
    if (vars.dev) console.log("%c[d3plus]%c Filtering Data","font-weight:bold","font-weight: normal")
    vars.data.filtered = {}
    vars.data.filtered.all = check_data.filter(function(d){
    
      var ret = true
      vars.check.forEach(function(key){
        if (ret) {
          if (key == "filter" || key == "solo") {
            ret = d3plus.utils.deep_filter(d)
            if (vars.nodes) {
              if (vars.dev) console.log("%c[d3plus]%c Filtering Nodes","font-weight:bold","font-weight: normal")
              vars.nodes_filtered = vars.nodes.filter(function(d){
                return d3plus.utils.deep_filter(d[vars.id])
              })
            }
            if (vars.links) {
              if (vars.dev) console.log("%c[d3plus]%c Filtering Connections","font-weight:bold","font-weight: normal")
              vars.links_filtered = vars.links.filter(function(d){
                var first_match = d3plus.utils.deep_filter(d.source),
                    second_match = d3plus.utils.deep_filter(d.target)
                return first_match && second_match
              })
              vars.connections = d3plus.utils.connections(vars,links)
            }
          }
          else if (key != vars.value || vars.type != "rings") {
            var value = d3plus.utils.variable(vars,d,key)
            if (!value) ret = false
          }
        }
      })
      vars.check = []
      return ret
    
    })
  }
  
  if (!vars.data.active) {
    vars.data.active = {}
    vars.data.inactive = {}
  }
  
  if (!vars.data.active.all) {
    vars.data.active.all = vars.data.filtered.all.filter(function(d){
      return vars.active ? d3plus.utils.variable(vars,d,vars.active) : true;
    })
    vars.data.inactive.all = vars.data.filtered.all.filter(function(d){
      return vars.active ? !d3plus.utils.variable(vars,d,vars.active) : false;
    })
  }
  
  if (vars.year_var && Object.keys(vars.data.filtered).length == 1) {
    
    if (vars.dev) console.log("%c[d3plus]%c Aggregating Years","font-weight:bold","font-weight: normal")

    // Find available years
    vars.data.years = d3plus.utils.uniques(vars.data.raw,vars.year_var)
    vars.data.years.sort()
    
    if (vars.data.years.length) {
      vars.data.years.forEach(function(y){
        vars.data.filtered[y] = vars.data.filtered.all.filter(function(d){
          return d3plus.utils.variable(vars,d,vars.year_var) == y;
        })
        vars.data.active[y] = vars.data.filtered[y].filter(function(d){
          return vars.active ? d3plus.utils.variable(vars,d,vars.active) : true;
        })
        vars.data.inactive[y] = vars.data.filtered[y].filter(function(d){
          return vars.active ? !d3plus.utils.variable(vars,d,vars.active) : false;
        })
      })
    }
    
  }
    
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Performs a deep filter based on filter/solo and nesting levels
//-------------------------------------------------------------------

d3plus.utils.deep_filter = function(d) {
  
  var id = d[vars.id],
      check = [id]
      
  if (vars.nesting.length) {
    vars.nesting.forEach(function(key){
      var obj = d3plus.utils.variable(vars,id,key)
      if (obj[vars.id]) {
        check.push(obj[vars.id])
      }
    })
  }
  
  var match = true
  if (id != vars.highlight || vars.type != "rings") {
    if (vars.solo.length) {
      match = false
      check.forEach(function(c){
        if (vars.solo.indexOf(c) >= 0) match = true
      })
    }
    else if (vars.filter.length) {
      match = true
      check.forEach(function(c){
        if (vars.filter.indexOf(c) >= 0) match = false
      })
    }
  }
  return match
}
