//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
d3plus.variable.text = function(vars,obj,depth) {

  if ( typeof depth !== "number" ) var depth = vars.depth.value

  var key = vars.id.nesting[depth]

  if ( vars.text.nesting && d3plus.object.validate(vars.text.nesting) ) {
    if ( vars.text.nesting[key] ) {
      var text_keys = vars.text.nesting[key]
    }
    else {
      var text_keys = vars.text.nesting[d3.keys(vars.text.nesting)[0]]
    }
  }
  else {
    var text_keys = []
    if (vars.text.value) text_keys.push(vars.text.value)
    text_keys.push(key)
  }

  if (typeof text_keys == "string") {
    text_keys = [text_keys]
  }

  var names = []
  text_keys.forEach(function(t){
    var name = d3plus.variable.value( vars , obj , t , key )
    if (name) names.push(vars.format.value(name.toString()))
  })

  return names

}
