//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Nests data...
//-------------------------------------------------------------------

d3plus.utils.nesting = function(vars,flat_data,levels,grouped) {
  
  var nested_data = d3.nest(), group_data = [];
  
  levels.forEach(function(nest_key, i){
    
    nested_data
      .key(function(d){ 
        return d3plus.utils.variable(vars,d,nest_key)
      })
      
    if (vars.unique_axis) {
      nested_data
        .key(function(d){ 
          return d3plus.utils.variable(vars,d,vars[vars.unique_axis+"axis"])
        })
    }
    
    if (i == levels.length-1) {
      nested_data.rollup(function(leaves){
        
        to_return = {
          "num_children": leaves.length,
          "num_children_active": d3.sum(leaves, function(d){ return d[vars.active]; })
        }
        
        var nest_obj = d3plus.utils.variable(vars,leaves[0],nest_key)
        to_return[nest_key] = nest_obj
        
        if (nest_obj.display_id) to_return.display_id = nest_obj.display_id;
        
        for (key in vars.keys) {
          if (vars.aggs[key]) {
            to_return[key] = d3[vars.aggs[key]](leaves, function(d){ return d[key]; })
          }
          else {
            if ([vars.year_var,vars.icon].indexOf(key) >= 0 || (key == nest_key && !to_return[key])) {
              to_return[key] = leaves[0][key];
            }
            else if (vars.keys[key] === "number" && key != nest_key) {
              to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
            }
            else if (key) {
              to_return[key] = leaves[0][key]
            }
          }
        }
        
        if (grouped) {
          levels.forEach(function(nk){
            to_return[nk] = leaves[0][nk]
          })
          group_data.push(to_return)
        }
        
        return to_return
        
      })
    }
  
  })
    
  rename_key_value = function(obj) { 
    if (obj.values && obj.values.length) { 
      var return_obj = {}
      return_obj.children = obj.values.map(function(obj) { 
        return rename_key_value(obj);
      })
      return return_obj
    } 
    else if(obj.values) { 
      return obj.values
    }
    else {
      return obj; 
    }
  }
  
  nested_data = nested_data
    .entries(flat_data)
    .map(rename_key_value)

  if (grouped) return group_data
  
  return nested_data;

}
