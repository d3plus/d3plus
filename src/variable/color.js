//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//------------------------------------------------------------------------------
d3plus.variable.color = function(vars,id,level) {

  function get_random(c) {
    if (typeof c == "object") {
      c = c[vars.id.value]
    }
    return d3plus.color.random(c)
  }

  function validate_color(c) {
    if (typeof c == "string" && c.indexOf("#") == 0 && [4,7].indexOf(c.length) >= 0) return true
    else return false
  }

  if (!vars.color.value) {
    return get_random(id);
  }
  else {

    var color = d3plus.variable.value(vars,id,vars.color.value,level)

    if (!color) {
      if (typeof vars.color.scale == "function") {
        return vars.color.missing
      }
      return get_random(id)
    }
    else if (!vars.color.scale) {
      var true_color = validate_color(color)
      return true_color ? color : get_random(color)
    }
    else {
      return vars.color.scale(color)
    }

  }
}
