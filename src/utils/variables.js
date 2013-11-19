//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//-------------------------------------------------------------------

d3plus.utils.variable = function(vars,id,variable,id_var) {
  
  if (!id_var) var id_var = vars.id
  
  function filter_array(arr) {
    return arr.filter(function(d){
      return d[id_var] == id
    })[0]
  }
  
  if (typeof id == "object") {
    if (typeof id[variable] != "undefined") return id[variable]
    else if (id.values) {
      id.values.forEach(function(d){
        if (typeof d[variable] != "undefined") return d[variable]
      })
    }
    var dat = id
    id = dat[id_var]
  }
  else {
    if (vars.app_data instanceof Array) {
      var dat = filter_array(vars.app_data)
      if (dat && typeof dat[variable] != "undefined") return dat[variable]
    }
    else if (vars.app_data) {
      var dat = vars.app_data[id]
      if (dat && typeof dat[variable] != "undefined") return dat[variable]
    }
  }
  
  if (vars.attrs instanceof Array) {
    var attr = filter_array(vars.attrs)
  }
  else if (vars.attrs[id_var]) {
    if (vars.attrs[id_var] instanceof Array) {
      var attr = filter_array(vars.attrs[id_var])
    }
    else {
      var attr = vars.attrs[id_var][id]
    }
  }
  else {
    var attr = vars.attrs[id]
  }
  
  if (attr && typeof attr[variable] != "undefined") return attr[variable]

  return null
  
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//-------------------------------------------------------------------

d3plus.utils.color = function(vars,id) {
  
  function get_random(c) {
    if (typeof c == "object") {
      c = vars.color ? d3plus.utils.variable(vars,c,vars.color) : c[vars.id]
    }
    return d3plus.utils.rand_color(c)
  }
  
  function validate_color(c) {
    if (c.indexOf("#") == 0 && [4,7].indexOf(c.length) >= 0) return true
    else return false
  }
  
  if (!id) {
    
    if (vars.app_data && vars.color) {

      if (vars.dev) console.group("%c[d3plus]%c Calculating Color Range","font-weight:bold","font-weight: normal")
      
      var data_range = []
      vars.color_domain = null
      
      if (vars.dev) console.time("get data range")
      
      if (vars.app_data instanceof Array) {
        vars.app_data.forEach(function(d){
          data_range.push(d3plus.utils.variable(vars,d,vars.color))
        })
      }
      else {
        d3.values(vars.app_data).forEach(function(d){
          data_range.push(d3plus.utils.variable(vars,d,vars.color))
        })
      }
      
      data_range = data_range.filter(function(d){
        return d;
      })
      
      if (vars.dev) console.timeEnd("get data range")
      
      if (vars.dev) console.time("create color scale")
      
      if (typeof data_range[0] == "number") {
        data_range.sort(function(a,b) {return a-b})
        vars.color_domain = [d3.quantile(data_range,0.1),d3.quantile(data_range,0.9)]
        var new_range = vars.color_range.slice(0)
        if (vars.color_domain[0] < 0 && vars.color_domain[1] > 0) {
          vars.color_domain.push(vars.color_domain[1])
          vars.color_domain[1] = 0
        }
        else if (vars.color_domain[1] > 0 || vars.color_domain[0] < 0) {
          new_range = vars.heat_map
          vars.color_domain = d3plus.utils.buckets(d3.extent(data_range),new_range.length)
        }
        
        vars.color_scale
          .domain(vars.color_domain)
          .range(new_range)
      
        if (vars.dev) console.timeEnd("create color scale")
        
      }
      
      if (vars.dev) console.groupEnd();
      
    }
  }
  else if (!vars.color) return get_random(id)
  else {
    var color = d3plus.utils.variable(vars,id,vars.color)
    
    if (!color && vars.color_domain instanceof Array) color = 0
    else if (!color) return get_random(id)
    
    if (typeof color == "string") {
      var true_color = validate_color(color)
      return true_color ? color : get_random(color)
    }
    else return vars.color_scale(color)
  }
}