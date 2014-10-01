var fetchValue = require("./value.js"),
    validObject = require("../../object/validate.coffee"),
    uniqueValues = require("../../util/uniques.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get array of available text values
//------------------------------------------------------------------------------
module.exports = function(vars,obj,depth) {

  if ( typeof depth !== "number" ) var depth = vars.depth.value

  var key = vars.id.nesting[depth]

  if ( vars.text.nesting && validObject(vars.text.nesting) ) {
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

  if (validObject(obj) && "d3plus" in obj && obj.d3plus.text) {
    names.push(obj.d3plus.text.toString())
    names.push(vars.format.value(obj.d3plus.text.toString(), undefined, vars))
  }
  else {

    var ids = validObject(obj) && key in obj ? obj[key] : fetchValue(vars, obj, key)
    if (!(ids instanceof Array)) ids = [ids]
    else if (validObject(ids[0])) {
      ids = uniqueValues(ids,key)
    }

    textKeys.forEach(function( t ){

      var name = []
      ids.forEach(function(i){
        var n = fetchValue(vars,i,t,key)
        if (n) {
          if (n instanceof Array && validObject(n[0])) {
            n = uniqueValues(n,t)
          }
          name = name.concat(n)
        }
      })

      if ( name.length ) {
        name = name.map(function(n){
          if (n instanceof Array) {
            return n.map(function(nn){
              return vars.format.value(nn.toString(),t, vars)
            })
          }
          else if (n) {
            return vars.format.value(n.toString(),t, vars)
          }
        })
        if (name.length === 1) name = name[0]
        names.push(name)
      }

    })

  }
  
  return names

}
