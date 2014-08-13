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
      var textKeys = vars.text.value
    }
  }
  else {
    var textKeys = []
    if (vars.text.value && depth === vars.depth.value) textKeys.push(vars.text.value)
    textKeys.push(key)
  }

  if ( !(textKeys instanceof Array) ) {
    textKeys = [ textKeys ]
  }

  var names = []

  if (d3plus.object.validate(obj) && "d3plus" in obj && obj.d3plus.text) {
    names.push(obj.d3plus.text.toString())
  }
  else {

    var ids = d3plus.object.validate(obj) && key in obj ? obj[key] : fetchValue(vars, obj, key)
    if (!(ids instanceof Array)) ids = [ids]
    else if (d3plus.object.validate(ids[0])) {
      ids = d3plus.util.uniques(ids,key)
    }

    textKeys.forEach(function( t ){

      var name = []
      ids.forEach(function(i){
        var n = fetchValue(vars,i,t,key)
        if (n) {
          if (n instanceof Array && d3plus.object.validate(n[0])) {
            n = d3plus.util.uniques(n,t)
          }
          name = name.concat(n)
        }
      })

      if ( name.length ) {
        name = name.map(function(n){
          if (n instanceof Array) {
            return n.map(function(nn){
              return vars.format.value(nn.toString(),t)
            })
          }
          else if (n) {
            return vars.format.value(n.toString(),t)
          }
        })
        if (name.length === 1) name = name[0]
        names.push(name)
      }

    })

  }

  return names

}
