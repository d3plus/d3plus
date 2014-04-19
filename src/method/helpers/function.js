//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Get/set function for methods
//------------------------------------------------------------------------------
d3plus.method.function = function( key , vars ) {

  return function( user , callback ) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If no arguments have been passed, simply return the current object.
    //--------------------------------------------------------------------------
    if (!arguments.length) {
      return vars[key]
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
                           !(Object.keys(user)[0] in vars[key]) )


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

      if ("wiki" in vars) {
        
        var wiki = "methods" in vars.wiki ? vars.wiki.methods : vars.wiki
        d3plus.console.log(d3plus.repo+"wiki/"+wiki+"#"+key)

      }

    }

    return vars.self

  }

}
