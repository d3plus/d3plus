//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets color range of data, if applicable
//-------------------------------------------------------------------

d3plus.data.color = function(vars) {
  
  if (vars.color.key && typeof vars.color.key == "object") {
    if (vars.color.key[vars.id.key]) {
      var color_id = vars.color.key[vars.id.key]
    }
    else {
      var color_id = vars.color.key[Object.keys(vars.color.key)[0]]
    }
  }
  else {
    var color_id = vars.color.key
  }
  
  if (vars.data.value && vars.color.key && (vars.color.changed || vars.time.changed || vars.depth.changed)) {
    
    if (vars.data.keys[color_id] == "number") {
      
      if (vars.dev.value) d3plus.console.group("Calculating Color Range")
    
      var data_range = []
      var data_domain = null
    
      if (vars.dev.value) d3plus.console.time("get data range")
      
      vars.data.pool.forEach(function(d){
        var val = parseFloat(d3plus.variable.value(vars,d,vars.color.key))
        if (val) data_range.push(val)
      })
    
      if (vars.dev.value) d3plus.console.timeEnd("get data range")
    
      if (vars.dev.value) d3plus.console.time("create color scale")
      
      data_range.sort(function(a,b) {return a-b})
      data_domain = [d3.quantile(data_range,0.1),d3.quantile(data_range,0.9)]
    
      var new_range = vars.style.color.range.slice(0)
      if (data_domain[0] < 0 && data_domain[1] > 0) {
        data_domain.push(data_domain[1])
        data_domain[1] = 0
      }
      else if (data_domain[1] > 0 || data_domain[0] < 0) {
        new_range = vars.style.color.heatmap
        data_domain = d3plus.utils.buckets(d3.extent(data_range),new_range.length)
      }
    
      vars.color_scale = d3.scale.sqrt()
        .domain(data_domain)
        .range(new_range)
        .interpolate(d3.interpolateRgb)
  
      if (vars.dev.value) d3plus.console.timeEnd("create color scale")
    
      if (vars.dev.value) d3plus.console.groupEnd();
      
    }
    else {
      vars.color_scale = null
    }
    
  }
  
}
