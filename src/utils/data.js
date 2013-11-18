//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.utils.data = function(vars,datum) {
  
  // Initial data setup when the raw data has changed
  if (!vars.data || datum != vars.data.raw) {
    
    if (vars.dev) console.group("%c[d3plus]%c New Data Detected","font-weight:bold","font-weight: normal")
    
    vars.data = {}
    vars.data.raw = datum
    vars.data.filtered = null

    console.time("key analysis")
    vars.keys = {}
    datum.forEach(function(d){
      for (k in d) {
        if (!vars.keys[k] && d[k]) {
          vars.keys[k] = typeof d[k]
        }
      }
    })
    console.timeEnd("key analysis")
    
    if (vars.dev) console.groupEnd();
    
  }
  
  vars.data.type = d3plus.data[vars.type]
  
  // Filter data if it hasn't been filtered or variables have changed
  if (!vars.data.filtered || vars.check.length) {
    vars.data[vars.data.type] = null

    if (vars.check.indexOf(vars.unique_axis) >= 0) {
      vars.check.splice(vars.check.indexOf(vars.unique_axis),1)
    }
    
    d3plus.utils.data_filter(vars)
  }
  
  // create data for app type if it does not exist
  if (!vars.data[vars.data.type]) {
    
    vars.data[vars.data.type] = {}
    console.group("%c[d3plus]%c Formatting Data","font-weight:bold","font-weight: normal")
    
    vars.nesting.forEach(function(depth){
      
      console.time(depth)
      
      var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
      
      vars.data[vars.data.type][depth] = {}
      
      var check_types = ["filtered","active","inactive"]
      
      check_types.forEach(function(b){

        if (b in vars.data) {

          vars.data[vars.data.type][depth][b] = {}
        
          for (y in vars.data[b]) {
            if (vars.data.type == "nested") {
              vars.data[vars.data.type][depth][b][y] = d3plus.utils.nesting(vars,vars.data[b][y],level)
            }
            else if (vars.data.type == "grouped") {
              vars.data[vars.data.type][depth][b][y] = d3plus.utils.nesting(vars,vars.data[b][y],level,true)
            }
            else if (vars.data.type == "object") {
              vars.data[vars.data.type][depth][b][y] = {}
              vars.data[b][y].forEach(function(d){
                vars.data[vars.data.type][depth][b][y][d[vars.id]] = d;
              })
            }
            else {
              vars.data[vars.data.type][depth][b][y] = vars.data[b][y]
            }
          }
          
        }
        
      })
      
      console.timeEnd(depth)
      
    })
    
    console.groupEnd()
    
  }
  
  // get correct data for app
  vars.app_data == null
  var dtype = vars.active && vars.spotlight ? "active" : "filtered"
  
  if (vars.year instanceof Array) {
    var temp_data = []
    vars.year.forEach(function(y){
      temp_data = temp_data.concat(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][y])
    })
    vars.app_data = temp_data
  }
  else {
    vars.app_data = vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year]
  }
  
  if (vars.app_data.length == 0) {
    vars.app_data = null
  }
  
  // Get link connections if they have not been previously set
  if (!vars.connections && vars.links) {
    var links = vars.links_filtered || vars.links
    vars.connections = d3plus.utils.connections(vars,links)
  }
  
  // Set up axes
  if (["pie_scatter","stacked"].indexOf(vars.type) >= 0 && vars.app_data) {
    
    if (!vars.xaxis_range || !vars.static_axes) {
      if (vars.dev) console.log("%c[d3plus]%c Determining X Axis Domain","font-weight:bold","font-weight: normal")
      if (vars.xaxis_domain instanceof Array) {
        vars.xaxis_range = vars.xaxis_domain
        vars.app_data = vars.app_data.filter(function(d){
          var val = d3plus.utils.variable(vars,d,vars.xaxis)
          return val >= vars.xaxis_domain[0] && val <= vars.xaxis_domain[1]
        })
      }
      else if (!vars.static_axes) {
        vars.xaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year],function(d){
          return d3plus.utils.variable(vars,d,vars.xaxis)
        })
      }
      else {
        vars.xaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype].all,function(d){
          return d3plus.utils.variable(vars,d,vars.xaxis)
        })
      }
    }
    
    if (!vars.yaxis_range || !vars.static_axes) {
      if (vars.dev) console.log("%c[d3plus]%c Determining Y Axis Domain","font-weight:bold","font-weight: normal")
      if (vars.yaxis_domain instanceof Array) {
        vars.yaxis_range = vars.yaxis_domain
      }
      else if (!vars.static_axes) {
        vars.yaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype][vars.year],function(d){
          return d3plus.utils.variable(vars,d,vars.yaxis)
        }).reverse()
      }
      else {
        vars.yaxis_range = d3.extent(vars.data[vars.data.type][vars.nesting[vars.depth]][dtype].all,function(d){
          return d3plus.utils.variable(vars,d,vars.yaxis)
        }).reverse()
      }
    }
    
    if (vars.mirror_axis) {
      var domains = vars.yaxis_range.concat(vars.xaxis_range)
      vars.xaxis_range = d3.extent(domains)
      vars.yaxis_range = d3.extent(domains).reverse()
    }
    
    if (vars.xaxis_range[0] == vars.xaxis_range[1]) {
      vars.xaxis_range[0] -= 1
      vars.xaxis_range[1] += 1
    }
    if (vars.yaxis_range[0] == vars.yaxis_range[1]) {
      vars.yaxis_range[0] -= 1
      vars.yaxis_range[1] += 1
    }
  }
  else {
    vars.xaxis_range = [0,0]
    vars.yaxis_range = [0,0]
  }
  
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Filters the data based on vars.check
//-------------------------------------------------------------------

d3plus.utils.data_filter = function(vars) {
  
  if (vars.check.indexOf("filter") >= 0 && !vars.filter.length) {
    vars.check.splice(vars.check.indexOf("filter"),1)
  }
  if (vars.check.indexOf("solo") >= 0 && !vars.solo.length) {
    vars.check.splice(vars.check.indexOf("solo"),1)
  }
  
  // If both filter and solo exist, only check for solo
  if (vars.check.indexOf("filter") >= 0 && vars.check.indexOf("solo") >= 0) {
    vars.check.splice(vars.check.indexOf("filter"),1)
  }
  
  if (vars.check.indexOf("filter") >= 0 || vars.check.indexOf("solo") >= 0) {
    
    if (vars.nodes) {
      if (vars.dev) console.log("%c[d3plus]%c Filtering Nodes","font-weight:bold","font-weight: normal")
      vars.nodes_filtered = vars.nodes.filter(function(d){
        return d3plus.utils.deep_filter(vars,d[vars.id])
      })
    }
    
    if (vars.links) {
      if (vars.dev) console.log("%c[d3plus]%c Filtering Connections","font-weight:bold","font-weight: normal")
      vars.links_filtered = vars.links.filter(function(d){
        var first_match = d3plus.utils.deep_filter(vars,d.source),
            second_match = d3plus.utils.deep_filter(vars,d.target)
        return first_match && second_match
      })
      vars.connections = d3plus.utils.connections(vars,links)
    }
    
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
  
  d3plus.vars[vars.type].forEach(function(v){
    if (vars.check.indexOf(vars[v]) < 0) vars.check.unshift(vars[v])
  })
  
  if (vars.check.length) {
    if (vars.dev) console.group("%c[d3plus]%c Filtering Data","font-weight:bold","font-weight: normal");
    vars.data.filtered = {}
    var checking = vars.check.join(", ")
    if (vars.dev) console.time(checking)
    vars.data.filtered.all = vars.data.raw.filter(function(d){
      var ret = true
      vars.check.forEach(function(key){
        if (ret) {
          if (key == "filter" || key == "solo") {
            ret = d3plus.utils.deep_filter(vars,d)
          }
          else {
            if (key == vars["xaxis"]) vars.xaxis_range = null
            else if (key == vars["yaxis"]) vars.yaxis_range = null
            var value = d3plus.utils.variable(vars,d,key)
            if (value === null) ret = false
          }
        }
      })
      return ret
    
    })

    if (vars.dev) console.timeEnd(checking)
    vars.check = []
    if (vars.dev) console.groupEnd();
  }
  
  if (vars.active && !vars.data.active) {
    if (!vars.data.active) {
      vars.data.active = {}
      vars.data.inactive = {}
    }
    if (!vars.data.active.all) {
      vars.data.active.all = vars.data.filtered.all.filter(function(d){
        return d3plus.utils.variable(vars,d,vars.active)
      })
      vars.data.inactive.all = vars.data.filtered.all.filter(function(d){
        return d3plus.utils.variable(vars,d,vars.active)
      })
    }
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
        if (vars.active) {
          vars.data.active[y] = vars.data.filtered[y].filter(function(d){
            return d3plus.utils.variable(vars,d,vars.active)
          })
          vars.data.inactive[y] = vars.data.filtered[y].filter(function(d){
            return d3plus.utils.variable(vars,d,vars.active)
          })
        }
      })
    }
    
  }
    
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Performs a deep filter based on filter/solo and nesting levels
//-------------------------------------------------------------------

d3plus.utils.deep_filter = function(vars,d) {
  
  var id = d[vars.id],
      check = [id]
      
  if (vars.nesting.length) {
    vars.nesting.forEach(function(key){
      var obj = d3plus.utils.variable(vars,id,key)
      if (obj) {
        check.push(obj)
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
