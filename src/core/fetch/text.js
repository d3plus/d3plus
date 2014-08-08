var fetchValue = require("./value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
module.exports = function(vars,obj,depth) {

  if ( typeof depth !== "number" ) var depth = vars.depth.value

  var key = vars.id.nesting[depth]

  if ( vars.text.nesting && d3plus.object.validate(vars.text.nesting) ) {
    if ( vars.text.nesting[key] ) {
      var textKeys = vars.text.nesting[key]
    }
    else {
      var textKeys = vars.text.nesting[ d3.keys(vars.text.nesting)[0] ]
    }
  }
  else {
    var textKeys = []
    if (vars.text.value) textKeys.push(vars.text.value)
    textKeys.push(key)
  }

  if ( !(textKeys instanceof Array) ) {
    textKeys = [ textKeys ]
  }

  var names = []

  if (d3plus.object.validate(obj) && "d3plus" in obj && obj.d3plus.text) {
    names.push(obj.d3plus.text)
  }
  else {

    var ids = obj[key]

    if (!(ids instanceof Array)) ids = [ids]

    textKeys.forEach(function( t ){

      var name = []
      ids.forEach(function(i){
        name.push(fetchValue(vars,i,t,key))
      })

      if ( name ) {
        if ( !(name instanceof Array) ) {
          name = vars.format.value(name.toString(),t)
        }
        else {
          name.forEach(function(n){
            if (n) n = vars.format.value(n.toString(),t)
          })
        }
        names.push(name)
      }

    })

  }

  return names

}
