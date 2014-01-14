//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a data object for the Tooltip
//-------------------------------------------------------------------

d3plus.tooltip.data = function(vars,id,length,extras) {

  if (!length) var length = "long"
  
  var extra_data = {}
  if (extras && typeof extras == "string") extras = [extras]
  else if (extras && typeof extras == "object") {
    extra_data = d3plus.utils.merge(extra_data,extras)
    var extras = []
    for (k in extra_data) {
      extras.push(k)
    }
  }
  else if (!extras) var extras = []
  
  var tooltip_highlights = []
  
  if (vars.tooltip.default instanceof Array) var a = vars.tooltip.default
  else if (vars.tooltip.default[length] && vars.tooltip.default[length] instanceof Array) var a = vars.tooltip.default[length]
  else if (vars.tooltip.default[length]) var a = d3plus.utils.merge({"":[]},vars.tooltip.default[length])
  else var a = vars.tooltip.default
  
  function format_key(key,group) {
    if (vars.attrs.default[group]) var id_var = group
    else var id_var = null
    
    if (group) group = vars.format(group)
    
    var value = extra_data[key] || d3plus.variable.value(vars,id,key,id_var)
    
    if (value !== false && value !== null) {
      var name = vars.format(key),
          h = tooltip_highlights.indexOf(key) >= 0
          
      var val = vars.format(value,key)
      
      var obj = {"name": name, "value": val, "highlight": h, "group": group}
      
      if (vars.descs[key]) obj.desc = vars.descs[key]
    
      if (val) tooltip_data.push(obj)
    }
    
  }
     
  var tooltip_data = []
  if (a instanceof Array) {
    
    extras.forEach(function(e){
      if (a.indexOf(e) < 0) a.push(e)
    })
    
    a.forEach(function(t){
      format_key(t)
    })
  
  }
  else {
    
    if (vars.id.nesting.length && vars.depth.default < vars.id.nesting.length-1) {
      var a = d3plus.utils.copy(a)
      vars.id.nesting.forEach(function(n,i){
        if (i > vars.depth.default && a[n]) delete a[n]
      })
    }
    
    if (vars.tooltip.default.long && typeof vars.tooltip.default.long == "object") {
      var placed = []
      for (group in vars.tooltip.default.long) {
        
        extras.forEach(function(e){
          if (vars.tooltip.default.long[group].indexOf(e) >= 0 && ((a[group] && a[group].indexOf(e) < 0) || !a[group])) {
            if (!a[group]) a[group] = []
            a[group].push(e)
            placed.push(e)
          }
          else if (a[group] && a[group].indexOf(e) >= 0) {
            placed.push(e)
          }
        })
      }
      extras.forEach(function(e){
        if (placed.indexOf(e) < 0) {
          if (!a[""]) a[""] = []
          a[""].push(e)
        }
      })
    }
    else {
      var present = []
      for (group in a) {
        extras.forEach(function(e){
          if (a[group] instanceof Array && a[group].indexOf(e) >= 0) {
            present.push(e)
          }
          else if (typeof a[group] == "string" && a[group] == e) {
            present.push(e)
          }
        })
      }
      if (present.length != extras.length) {
        if (!a[""]) a[""] = []
        extras.forEach(function(e){
          if (present.indexOf(e) < 0) {
            a[""].push(e)
          }
        })
      }
    }
    
    if (a[""]) {
      a[""].forEach(function(t){
        format_key(t,"")
      })
      delete a[""]
    }
    
    for (group in a) {
      if (a[group] instanceof Array) {
        a[group].forEach(function(t){
          format_key(t,group)
        })
      }
      else if (typeof a[group] == "string") {
        format_key(a[group],group)
      }
    }
    
  }
  
  return tooltip_data
  
}
