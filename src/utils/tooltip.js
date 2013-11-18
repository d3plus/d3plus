//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a data object for the UI tooltip
//-------------------------------------------------------------------

d3plus.utils.tooltip = function(vars,id,length,extras) {

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
  extras.push(vars.value)
  if (["bubbles"].indexOf(vars.type) >= 0) {
    tooltip_highlights.push(vars.active)
    extras.push(vars.active)
    tooltip_highlights.push(vars.else_var)
    extras.push(vars.else_var)
    tooltip_highlights.push(vars.total)
    extras.push(vars.total)
  }
  else if (["stacked","pie_scatter"].indexOf(vars.type) >= 0) {
    tooltip_highlights.push(vars.xaxis)
    tooltip_highlights.push(vars.yaxis)
    extras.push(vars.xaxis)
    extras.push(vars.yaxis)
  }
  
  if (["stacked","pie_scatter","bubbles"].indexOf(vars.type) < 0) {
    tooltip_highlights.push(vars.value)
  }
  
  if (vars.tooltip instanceof Array) var a = vars.tooltip
  else if (vars.tooltip[length] && vars.tooltip[length] instanceof Array) var a = vars.tooltip[length]
  else if (vars.tooltip[length]) var a = d3plus.utils.merge({"":[]},vars.tooltip[length])
  else var a = vars.tooltip
  
  function format_key(key,group) {
    if (vars.attrs[group]) var id_var = group
    else var id_var = null
    
    if (group) group = vars.format(group)
    
    var value = extra_data[key] || d3plus.utils.variable(vars,id,key,id_var)
    
    if (value !== false) {
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
    if (vars.nesting.length && vars.depth < vars.nesting.length-1) {
      var a = d3plus.utils.merge({},a)
      vars.nesting.forEach(function(n,i){
        if (i > vars.depth && a[n]) delete a[n]
      })
    }
    if (vars.tooltip.long && typeof vars.tooltip.long == "object") {
      var placed = []
      for (group in vars.tooltip.long) {
        extras.forEach(function(e){
          if (vars.tooltip.long[group].indexOf(e) >= 0 && ((a[group] && a[group].indexOf(e) < 0) || !a[group])) {
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
          if (a[group].indexOf(e) >= 0) {
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
