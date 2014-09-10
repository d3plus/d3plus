var fetchValue = require("./value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//------------------------------------------------------------------------------
module.exports = function( vars , id , level ) {

  if ( !level ) {
    var level = vars.id.value
  }

  if (typeof level === "number") {
    level = vars.id.nesting[level]
  }

  function getRandom( c ) {

    if ( d3plus.object.validate( c ) ) {
      c = c[ level ]
    }

    if (c instanceof Array) {
      c = c[0]
    }

    return d3plus.color.random( c, vars.color.scale.value )

  }

  if ( !vars.color.value ) {

    return getRandom( id )

  }
  else {

    function getColor(color) {

      if ( !color ) {

        if ( vars.color.value && typeof vars.color.valueScale === "function" ) {
          return vars.color.valueScale(0)
        }
        return getRandom( id )

      }
      else if ( !vars.color.valueScale ) {
        return d3plus.color.validate( color ) ? color : getRandom( color )
      }
      else {
        return vars.color.valueScale( color )
      }

    }

    var colors = []
    for ( var i = vars.id.nesting.indexOf(level) ; i >= 0 ; i-- ) {
      var colorLevel = vars.id.nesting[i]
      if (d3plus.object.validate(id)) {
        var o = !(colorLevel in id) ? fetchValue(vars,id,colorLevel) : id
          , value = fetchValue( vars , o , vars.color.value , colorLevel )
      }
      else {
        var value = id
      }

      if ( value !== undefined && value !== null ) {
        var color = getColor(value)
        if (colors.indexOf(color) < 0) colors.push(color)
      }

    }

    return colors.length === 1 ? colors[0] : vars.color.missing

  }

}
