//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create dummy methods to catch deprecates
//--------------------------------------------------------------------------
d3plus.method.depricates = function( vars , obj , method ) {

  for ( o in obj ) {

    if ( o == "deprecates" ) {

      var deps = obj[o] instanceof Array ? obj[o] : [obj[o]]

      deps.forEach(function(d){

        vars.self[d] = (function(dep,n) {

          return function(x) {

            var str = vars.format.locale.value.warning.deprecated
            dep = "\."+dep+"()"
            d3plus.console.warning(d3plus.util.format(str,dep,"\."+n+"()"))
            if ("wiki" in vars) {
              var wiki = "methods" in vars.wiki ? vars.wiki.methods : vars.wiki
              d3plus.console.log(d3plus.repo+"wiki/"+wiki+"#"+n)
            }
            return vars.self;

          }

        })(d,method)

      })

    }
    else if ( typeof obj[o] == "object" && obj[o] !== null
         && !(obj[o] instanceof Array) ) {

      d3plus.method.depricates( vars , obj[o] , o )

    }

  }

}
