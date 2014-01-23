//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns the correct fill color for a node
//-------------------------------------------------------------------
d3plus.shape.color = function(d,vars) {
  
  var shape = d.d3plus ? d.d3plus.shapeType : vars.shape.value
  
  if (vars.shape.value == "line") {
    if (d.d3plus && d.d3plus.shapeType == "circle") {
      return d3plus.variable.color(vars,d)
    }
    else {
      return "none"
    }
  }
  else if (vars.shape.value == "area" || shape == "active") {
    return d3plus.variable.color(vars,d)
  }
  else if (shape == "temp") {
    return "url(#hatch"+d.d3plus.id+")"
  }

  if (d.d3plus.static) {
    return d3plus.color.lighter(d3plus.variable.color(vars,d));
  }
  
  var active = vars.active.key ? d3plus.variable.value(vars,d,vars.active.key) : d.d3plus.active,
      temp = vars.temp.key ? d3plus.variable.value(vars,d,vars.total.key) : d.d3plus.temp,
      total = vars.total.key ? d3plus.variable.value(vars,d,vars.total.key) : d.d3plus.total
    
  if ((!vars.active.key && !vars.temp.key) || (active && total && active == total) || (active && !total)) {
    return d3plus.variable.color(vars,d)
  }
  else if (vars.active.spotlight.value) {
    return "#eee"
  }
  else {
    return d3plus.color.lighter(d3plus.variable.color(vars,d));
  }
  
}
