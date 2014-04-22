//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds a given variable by searching through the data and attrs
//------------------------------------------------------------------------------
d3plus.variable.value = function(vars,id,variable,id_var,agg) {

  if (!id_var) {
    if (variable && typeof variable == "object") {
      if (variable[vars.id.value]) {
        var id_var = vars.id.value
      }
      else {
        var id_var = d3.keys(variable)[0]
      }
      variable = variable[id_var]
    }
    else {
      var id_var = vars.id.value
    }
  }

  if (variable && typeof variable == "function") {
    return variable(id)
  }
  else if (variable == id_var) {
    if (typeof id == "object") {
      return id[variable]
    }
    else {
      return id
    }
  }

  function filter_array(arr) {
    return arr.filter(function(d){
      return d[id_var] == id
    })[0]
  }

  var value_array = []
  function check_children(obj) {
    if (obj.children) {
      obj.children.forEach(function(c){
        check_children(c)
      })
    }
    else if (obj[variable]) {
      value_array.push(obj[variable])
    }
  }

  if (typeof id == "object" && typeof id[variable] != "undefined") {
    return id[variable]
  }
  else if (typeof id == "object" && id.children) {

    if (!agg) {
      var agg = "sum"
      if (typeof vars.aggs.value == "string") {
        agg = vars.aggs.value
      }
      else if (vars.aggs.value[variable]) {
        agg = vars.aggs.value[variable]
      }
    }
    check_children(id)
    if (value_array.length) {
      if (typeof agg == "string") {
        return d3[agg](value_array)
      }
      else if (typeof agg == "function") {
        return agg(value_array)
      }
    }

    var dat = id
    id = dat[id_var]

  }
  else {

    if (typeof id == "object") {
      var dat = id
      id = id[id_var]
    }

    if (vars.data.app instanceof Array) {
      var dat = filter_array(vars.data.app)
    }

    if (dat && typeof dat[variable] != "undefined") return dat[variable]
  }

  if (vars.attrs.value instanceof Array) {
    var attr = filter_array(vars.attrs.value)
  }
  else if (vars.attrs.value[id_var]) {
    if (vars.attrs.value[id_var] instanceof Array) {
      var attr = filter_array(vars.attrs.value[id_var])
    }
    else {
      var attr = vars.attrs.value[id_var][id]
    }
  }
  else {
    var attr = vars.attrs.value[id]
  }

  if (attr && typeof attr[variable] != "undefined") return attr[variable]

  return null

}
