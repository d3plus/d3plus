//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create dummy methods to catch deprecates
//--------------------------------------------------------------------------
d3plus.method.init = function( vars , obj , method ) {

  if ( "process" in obj ) {
    d3plus.method.process( obj , obj.value )
  }

  for ( o in obj ) {

    if ( o === "deprecates" ) {

      var deps = obj[o] instanceof Array ? obj[o] : [obj[o]]

      deps.forEach(function(d){

        vars.self[d] = (function(dep,n) {

          return function(x) {

            var str = vars.format.locale.value.warning.deprecated
            dep = "\."+dep+"()"
            d3plus.console.warning(d3plus.util.format(str,dep,"\."+n+"()"))
            d3plus.console.log(d3plus.repo+"wiki/Visualization-Methods#"+n)
            return vars.self;

          }

        })(d,method)

      })

    }
    else if ( o === "global" ) {

      if ( !(method in vars) ) {
        vars[method] = []
      }

    }
    else if ( typeof obj[o] === "object" && obj[o] !== null
         && !(obj[o] instanceof Array) ) {

      d3plus.method.init( vars , obj[o] , o )

    }

  }

}
