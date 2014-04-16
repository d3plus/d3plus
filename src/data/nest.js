//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Nests data...
//-------------------------------------------------------------------
d3plus.data.nest = function(vars,flat_data,levels,grouped) {

  var nested_data = d3.nest(), group_data = [];

  var checks = ["active","temp","total"]

  levels.forEach(function(nest_key, i){

    nested_data
      .key(function(d){
        return d3plus.variable.value(vars,d,nest_key)
      })

    vars.axes.values.forEach(function(axis){
      if (d3plus.apps[vars.type.value].requirements && d3plus.apps[vars.type.value].requirements.indexOf(axis) >= 0 && vars[axis].value && vars[axis].scale.value == "continuous") {
        nested_data
          .key(function(d){
            return d3plus.variable.value(vars,d,vars[axis].value)
          })
      }
    })

    if (i == levels.length-1) {

      nested_data.rollup(function(leaves){

        to_return = {
          "d3plus": {
            "depth": i
          }
        }

        checks.forEach(function(c){
          var key = vars[c].value || c
          to_return[key] = d3.sum(leaves, function(d){
            if (vars[c].value) {
              var a = d3plus.variable.value(vars,d,vars[c].value)
              if (typeof a != "number") {
                var a = a ? 1 : 0
              }
            }
            else if (c == "total") {
              var a = 1
            }
            else {
              var a = 0
            }
            return a
          })
          to_return.d3plus[key] = to_return[key]
        })

        var nest_obj = d3plus.variable.value(vars,leaves[0],nest_key)
        to_return[nest_key] = nest_obj

        for (key in vars.data.keys) {
          if (((levels.indexOf(nest_key) >= 0 && levels.indexOf(key) <= levels.indexOf(nest_key)) || (vars.id.nesting.indexOf(nest_key) >= 0 && vars.id.nesting.indexOf(key) <= vars.id.nesting.indexOf(nest_key)))
            && key in leaves[0]
            && (!vars.active.value || key != vars.active.value) && key != "d3plus") {
            if (typeof vars.aggs.value[key] == "function") {
              to_return[key] = vars.aggs.value[key](leaves)
            }
            else if (typeof vars.aggs.value[key] == "string") {
              to_return[key] = d3[vars.aggs.value[key]](leaves, function(d){ return d[key]; })
            }
            else if ([vars.time.value,vars.icon].indexOf(key) >= 0 || (key == nest_key && !to_return[key]) || (vars.x.value == key && vars.x.scale.value == "continuous") || (vars.y.value == key && vars.y.scale.value == "continuous")) {
              to_return[key] = leaves[0][key];
            }
            else if (vars.data.keys[key] === "number" && vars.id.nesting.indexOf(key) < 0) {
              to_return[key] = d3.sum(leaves, function(d){ return d[key]; })
            }
            else if (key) {
              to_return[key] = leaves[0][key]
            }
          }
        }

        if (grouped) {
          group_data.push(to_return)
        }

        return to_return

      })
    }

  })

  rename_key_value = function(obj) {
    if (obj.values && obj.values.length) {
      obj.children = obj.values.map(function(obj) {
        return rename_key_value(obj);
      })
      delete obj.values
      return obj
    }
    else if(obj.values) {
      return obj.values
    }
    else {
      return obj;
    }
  }

  find_keys = function(obj,depth,keys) {
    if (obj.children) {
      if (vars.data.keys[levels[depth]] == "number") {
        obj.key = parseFloat(obj.key)
      }
      keys[levels[depth]] = obj.key
      delete obj.key
      for (k in keys) {
        obj[k] = keys[k]
      }
      depth++
      obj.children.forEach(function(c){
        find_keys(c,depth,keys)
      })
    }
  }

  nested_data = nested_data
    .entries(flat_data)
    .map(rename_key_value)
    .map(function(obj){
      find_keys(obj,0,{})
      return obj
    })

  if (grouped) {
    return group_data
  }

  return nested_data;

}
