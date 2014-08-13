var fetchValue = require("./value.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//------------------------------------------------------------------------------
module.exports = function( vars , id , level ) {

  if ( !level ) {
    var level = vars.id.value
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

    for ( var i = vars.id.nesting.indexOf(level) ; i >= 0 ; i-- ) {
      var o = !(vars.color.value in id) && id[level] instanceof Array ? id[level][0] : id
        , colorLevel = vars.id.nesting[i]
        , color = fetchValue( vars , o , vars.color.value , colorLevel )
      if ( color ) break
    }

    if ( !color ) {

      if ( vars.color.value || typeof vars.color.valueScale === "function" ) {
        return vars.color.missing
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

}
