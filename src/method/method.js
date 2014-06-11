//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Global method shell.
//------------------------------------------------------------------------------
d3plus.method = function( vars , methods , styles ) {

  var methods   = methods || []
    , styles    = styles || []
    , initStyle = d3plus.style[ d3plus.method.style.value ]

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through each specified method and apply it to the object.
  //----------------------------------------------------------------------------
  methods.forEach(function(m) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Clone method defaults.
    //--------------------------------------------------------------------------
    if ( !(m in vars) ) {
      vars[m] = {}
    }

    vars[m] = d3plus.object.merge( d3plus.method[m] , vars[m] )

    if ( styles.indexOf(m) >= 0 ) {
      vars[m] = d3plus.object.merge( initStyle[m] , vars[m] )
      styles.splice(styles.indexOf(m),1)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Run initialization on all inner properties.
    //--------------------------------------------------------------------------
    d3plus.method.init( vars , vars[m] , m )

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create the main set/get function.
    //--------------------------------------------------------------------------
    vars.self[m] = (d3plus.method.function)( m , vars )

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Loop through remaining styles and create methods for them.
  //----------------------------------------------------------------------------
  styles.forEach(function(m){

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Clone style defaults.
    //--------------------------------------------------------------------------
    vars[m] = d3plus.object.merge( vars[m] || {} , initStyle[m] )

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Run initialization on all inner properties.
    //--------------------------------------------------------------------------
    d3plus.method.init( vars , vars[m] , m )

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create the main set/get function.
    //--------------------------------------------------------------------------
    vars.self[m] = (d3plus.method.function)( m , vars )

  })

}
