//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Formats Raw Data
//-------------------------------------------------------------------

d3plus.utils.data = function(vars,datum) {
  
  var data_type = {
    "bubbles": "array",
    "geo_map": "object",
    "network": "object",
    "pie_scatter": "nested",
    "rings": "object",
    "stacked": "nested",
    "tree_map": "nested"
  }
  
  // Initial data setup when the raw data has changed
  if (datum != vars.data.raw) {
    
    if (vars.dev) console.log("%c[d3plus]%c New Data Detected","font-weight:bold","font-weight: normal")
    
    vars.data = {}
    vars.data.raw = datum
    vars.data.filtered = null

    vars.keys = {}
    datum.forEach(function(d){
      for (k in d) {
        if (!vars.keys[k] && d[k]) {
          vars.keys[k] = typeof d[k]
        }
      }
    })
    
  }

  // Filter data if it hasn't been filtered or variables have changed
  if (!vars.data.filtered || vars.check.length) {
    vars.data[data_type[vars.type]] = null
    d3plus.utils.data_filter(vars,vars.data.raw)
  }
  
  
  // create data for app type if it does not exist
  if (!vars.data[data_type[vars.type]]) {
    
    vars.data[data_type[vars.type]] = {}
      
    if (vars.dev && data_type[vars.type] == "nested") {
      console.log("%c[d3plus]%c Nesting Data","font-weight:bold","font-weight: normal")
    } 
    
    vars.nesting.forEach(function(depth){
      
      var level = vars.nesting.slice(0,vars.nesting.indexOf(depth)+1)
      
      vars.data[data_type[vars.type]][depth] = {
        "filtered": {}, 
        "active": {}, 
        "inactive": {}
      }
      
      for (b in vars.data[data_type[vars.type]][depth]) {
        
        for (y in vars.data[b]) {
          if (data_type[vars.type] == "nested") {
            vars.data[data_type[vars.type]][depth][b][y] = d3plus.utils.nesting(vars,vars.data[b][y],level)
          }
          else if (data_type[vars.type] == "object") {
            vars.data[data_type[vars.type]][depth][b][y] = {}
            vars.data[b][y].forEach(function(d){
              vars.data[data_type[vars.type]][depth][b][y][d[vars.id]] = d;
            })
          }
          else {
            vars.data[data_type[vars.type]][depth][b][y] = vars.data[b][y]
          }
        }
        
      }
      
    })
    
  }
  
  // get correct data for app
  vars.app_data == null
  var dtype = vars.active && vars.spotlight ? "active" : "filtered"
  
  if (vars.year instanceof Array) {
    // Need to implement multi-year aggregation
    vars.app_data = vars.data[data_type[vars.type]][vars.nesting[vars.depth]][dtype][vars.year]
  }
  else {
    vars.app_data = vars.data[data_type[vars.type]][vars.nesting[vars.depth]][dtype][vars.year]
  }
  
  if (vars.app_data.length == 0) {
    vars.app_data = null
  }
  
}
