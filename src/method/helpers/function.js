//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get/set function for methods
//------------------------------------------------------------------------------
d3plus.method.function = function( key , vars ) {

  return function( user , callback ) {

    var accepted = vars[key].accepted

    if ( typeof accepted === "function" ) {
      accepted = accepted( vars )
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If no arguments have been passed, simply return the current object.
    //--------------------------------------------------------------------------
    if ( user === Object ) {
      return vars[key]
    }
    else if ( !arguments.length
              && ((accepted === undefined && !("value" in vars))
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

      var str = vars.format.locale.value.warning.oldStyle

      for ( var s in user ) {

        d3plus.console.warning(d3plus.util.format(str,s))
        d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods#"+s+"-obj")

        vars.self[s](user[s])

      }

      return vars.self

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If defining a callback function, set it.
    //--------------------------------------------------------------------------
    if (callback) {
      vars[key].callback = callback
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine whether or not to just set the local variable or to dig into
    // the object passed looking for keys.
    //--------------------------------------------------------------------------
    var type = typeof user
      , approvedObject = user instanceof Array ||
                         ( type === "object" && !("value" in user) &&
                           !(d3.keys(user)[0] in vars[key]) )


    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set value of key.
    //--------------------------------------------------------------------------
    if ( user === null || type !== "object" || approvedObject ) {

      d3plus.method.set( vars , key , vars[key] , "value" , user )

    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it's an object, dig through it and set inner values.
    //--------------------------------------------------------------------------
    else if (type == "object") {

      d3plus.method.object( vars , key , vars , key , user )

    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Otherwise, show error message.
    //--------------------------------------------------------------------------
    else {

      var str = vars.format.locale.value.warning.format
      d3plus.console.warning(d3plus.util.format(str,key))
      d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods#"+key)

    }

    if (vars[key].chainable === false) {
      return vars[key].value
    }
    else {
      return vars.self
    }

  }

}
