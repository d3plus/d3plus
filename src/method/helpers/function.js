//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get/set function for methods
//------------------------------------------------------------------------------
d3plus.method.function = function( key , vars ) {

  return function( user , callback ) {

    if ( "accepted" in vars[key] && vars[key].accepted === false ) {

      if ( typeof vars[key].value === "function" ) {
        vars[key].value(vars)
      }

    }
    else {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If no arguments have been passed, simply return the current object.
      //------------------------------------------------------------------------
      if (!arguments.length) {
        return vars[key]
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Warn if the user is trying to use the old .style() method.
      //------------------------------------------------------------------------
      if ( key === "style" && typeof user === "object" ) {

        var str = vars.format.locale.value.warning.oldStyle
        d3plus.console.warning(str)
        d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods")

        return vars.self

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If defining a callback function, set it.
      //------------------------------------------------------------------------
      if (callback) {
        vars[key].callback = callback
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Determine whether or not to just set the local variable or to dig into
      // the object passed looking for keys.
      //------------------------------------------------------------------------
      var type = typeof user
        , approvedObject = user instanceof Array ||
                           ( type === "object" && !("value" in user) &&
                             !(Object.keys(user)[0] in vars[key]) )


      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set value of key.
      //------------------------------------------------------------------------
      if ( user === null || type !== "object" || approvedObject ) {

        d3plus.method.set( vars , key , vars[key] , "value" , user )

      }
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // If it's an object, dig through it and set inner values.
      //------------------------------------------------------------------------
      else if (type == "object") {

        d3plus.method.object( vars , key , vars , key , user )

      }
      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Otherwise, show error message.
      //------------------------------------------------------------------------
      else {

        var str = vars.format.locale.value.warning.format
        d3plus.console.warning(d3plus.util.format(str,key))
        d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods#"+key)

      }

    }

    return vars.self

  }

}
