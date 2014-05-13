//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
d3plus.variable.text = function(vars,obj,depth) {

  if (typeof depth != "number") var depth = vars.depth.value

  if (vars.text.array && typeof vars.text.array == "object") {
    if (vars.text.array[vars.id.nesting[depth]]) {
      var text_keys = vars.text.array[vars.id.nesting[depth]]
    }
    else {
      var text_keys = vars.text.array[d3.keys(vars.text.array)[0]]
    }
  }
  else {
    var text_keys = []
    if (vars.text.value) text_keys.push(vars.text.value)
    text_keys.push(vars.id.nesting[depth])
  }
  if (typeof text_keys == "string") {
    text_keys = [text_keys]
  }

  var names = []
  text_keys.forEach(function(t){
    var key =  vars.id.nesting[depth]
      , name = d3plus.variable.value(vars,obj,t,key)
    if (name) names.push(vars.format.value(name.toString()))
  })

  return names

}
