var fetchValue = require("../../core/fetch/value.js")
  , fetchColor = require("../../core/fetch/color.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Returns the correct fill color for a node
//-------------------------------------------------------------------
d3plus.shape.color = function(d,vars) {

  var shape = d.d3plus ? d.d3plus.shapeType : vars.shape.value

  if (vars.shape.value == "line") {
    if (shape == "circle") {
      return fetchColor(vars,d)
    }
    else {
      return "none"
    }
  }
  else if (vars.shape.value == "area" || shape == "active") {
    return fetchColor(vars,d)
  }
  else if (shape == "temp") {
    return "url(#d3plus_hatch_"+d.d3plus.id+")"
  }
  else if (shape == "active") {
    return fetchColor(vars,d)
  }

  if (d.d3plus.static) {
    return d3plus.color.lighter(fetchColor(vars,d),.75);
  }

  var active = vars.active.value ? fetchValue(vars,d,vars.active.value) : d.d3plus.active,
      temp = vars.temp.value ? fetchValue(vars,d,vars.temp.value) : d.d3plus.temp,
      total = vars.total.value ? fetchValue(vars,d,vars.total.value) : d.d3plus.total

  if ((!vars.active.value && !vars.temp.value) || active === true || (active && total && active == total && !temp) || (active && !total)) {
    return fetchColor(vars,d)
  }
  else if (vars.active.spotlight.value) {
    return "#eee"
  }
  else {
    return d3plus.color.lighter(fetchColor(vars,d),.75);
  }

}
