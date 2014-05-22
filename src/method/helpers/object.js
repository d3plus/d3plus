//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Detects is we should set the object or check all keys of object.
//------------------------------------------------------------------------------
d3plus.method.object = function( vars , method , object , key , value ) {

  if ([ "accepted" , "getVars" ].indexOf(key) < 0) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine whether or not to just set the local variable or to dig into
    // the object passed looking for keys.
    //--------------------------------------------------------------------------
    var passingObject  = d3plus.object.validate(value)
      , approvedObject = passingObject && ( !("value" in value) &&
                         !(d3.keys(value)[0] in object[key]) )

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Set value of key.
    //--------------------------------------------------------------------------
    if ( value === null || !passingObject || approvedObject ) {

      if ( approvedObject ) {
        d3plus.method.set( vars , method , object[key] , "value" , value )
      }
      else {
        d3plus.method.set( vars , method , object , key , value )
      }

    }
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If it's an object, dig through it and set inner values.
    //--------------------------------------------------------------------------
    else if ( passingObject ) {

      for (d in value) {

        d3plus.method.object( vars , method , object[key] , d , value[d] )

      }

    }

  }

}
