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

    return d3plus.color.random( c )

  }

  if ( !vars.color.value ) {

    return getRandom( id )

  }
  else {

    for ( var i = vars.id.nesting.indexOf(level) ; i >= 0 ; i-- ) {
      var colorLevel = vars.id.nesting[i]
        , color = fetchValue( vars , id , vars.color.value , colorLevel )
      if ( color ) break
    }

    if ( !color ) {

      if ( vars.color.value || typeof vars.color.scale === "function" ) {
        return vars.color.missing
      }
      return getRandom( id )

    }
    else if ( !vars.color.scale ) {
      return d3plus.color.validate( color ) ? color : getRandom( color )
    }
    else {
      return vars.color.scale( color )
    }

  }

}
