//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns the correct fill color for a node
//-------------------------------------------------------------------
d3plus.shape.color = function(d,vars) {

  var shape = d.d3plus ? d.d3plus.shapeType : vars.shape.value

  if (vars.shape.value == "line") {
    if (shape == "circle") {
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
    return "url(#d3plus_hatch_"+d.d3plus.id+")"
  }
  else if (shape == "active") {
    return d3plus.variable.color(vars,d)
  }

  if (d.d3plus.static) {
    return d3plus.color.lighter(d3plus.variable.color(vars,d));
  }

  var active = vars.active.value ? d3plus.variable.value(vars,d,vars.active.value) : d.d3plus.active,
      temp = vars.temp.value ? d3plus.variable.value(vars,d,vars.temp.value) : d.d3plus.temp,
      total = vars.total.value ? d3plus.variable.value(vars,d,vars.total.value) : d.d3plus.total

  if ((!vars.active.value && !vars.temp.value) || active === true || (active && total && active == total && !temp) || (active && !total)) {
    return d3plus.variable.color(vars,d)
  }
  else if (vars.active.spotlight.value) {
    return "#eee"
  }
  else {
    return d3plus.color.lighter(d3plus.variable.color(vars,d),.4);
  }

}
