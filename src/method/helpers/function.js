//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get/set function for methods
//------------------------------------------------------------------------------
d3plus.method.function = function( key , vars ) {

  return function( user , callback ) {

    var accepted = key in vars && d3plus.object.validate(vars[key])
                   && "accepted" in vars[key] ? vars[key].accepted
                 : key in vars ? typeof vars[key] : null

    if ( typeof accepted === "function" ) {
      accepted = accepted( vars )
    }

    if ( accepted !== null && !(accepted instanceof Array) ) {
      accepted = [ accepted ]
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If no arguments have been passed, simply return the current object.
    //--------------------------------------------------------------------------
    if ( user === Object ) {
      return vars[key]
    }
    else if ( !arguments.length
              && ((accepted === null && !("value" in vars))
              || (accepted !== undefined && accepted.indexOf(undefined) < 0)) ) {
      if ("value" in vars[key]) {
        return vars[key].value
      }
      else {
        return vars[key]
      }
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Warn if the user is trying to use the old .style() method.
    //--------------------------------------------------------------------------
    if ( key === "style" && typeof user === "object" ) {

      var str = vars.format.locale.value.dev.oldStyle

      for ( var s in user ) {

        d3plus.console.warning(d3plus.util.format(str,s))
        d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods#"+s+"-obj")

        vars.self[s](user[s])

      }

      return vars.self

    }

    d3plus.method.object( vars , key , vars , key , user )

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If defining a callback function, set it.
    //--------------------------------------------------------------------------
    if ( typeof callback === "function" ) {
      vars[key].callback = callback
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If the method is not chainable, return the value associated with it.
    //--------------------------------------------------------------------------
    if (vars[key].chainable === false) {
      return vars[key].value
    }
    else {
      return vars.self
    }

  }

}
