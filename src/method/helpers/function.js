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

      if ( ( vars.dev.value || ( key === "dev" && user ) )
           && !vars.methodGroup && vars.methodGroup !== "wait" ) {
        vars.methodGroup = true
        d3plus.console.groupCollapsed("method behavior")
      }

      for ( var s in user ) {

        d3plus.console.warning( d3plus.string.format(str,"\""+s+"\"",s) , s )

        vars.self[s](user[s])

      }

      return vars.self

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set all font families and weights, if calling .font()
    //--------------------------------------------------------------------------
    if ( key === "font" && d3plus.object.validate(user)
         && "family" in user && typeof user.family === "string" ) {

      function checkFamily ( o ) {

        if ( d3plus.object.validate( o ) ) {

          if ( "family" in o ) {
            o.family.value = o.family.process( user.family )
          }
          else {

            for ( var m in o ) {
              checkFamily(o[m])
            }

          }

        }

      }

      checkFamily( vars )

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
