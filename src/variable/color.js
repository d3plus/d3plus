//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Finds an object's color and returns random if it cannot be found
//------------------------------------------------------------------------------
d3plus.variable.color = function( vars , id , level ) {

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

    var color = d3plus.variable.value( vars , id , vars.color.value , level )

    if ( !color ) {

      if ( typeof vars.color.scale === "function" ) {
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
