//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets a method's value.
//------------------------------------------------------------------------------
d3plus.method.set = function( vars , method , object , key , value ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create reference text for console statements.
  //----------------------------------------------------------------------------
  if (key == "value" || !key) {

    var text = "\."+method+"()"

  }
  else {

    var of = vars.format.locale.value.dev.of
      , text = "\""+key+"\" "+of+" \."+method+"()"

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Find appropriate "accepted" list.
  //----------------------------------------------------------------------------
  if (key === "value" && object.accepted) {

    var accepted = object.accepted

  }
  else if ( d3plus.object.validate( object[key] ) && object[key].accepted ) {

    var accepted = object[key].accepted

  }
  else {

    var accepted = false

  }

  if ( typeof accepted === "function" ) {
    accepted = accepted( vars )
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the given value is allowed.
  //----------------------------------------------------------------------------
  var allowed = true
  if (accepted instanceof Array) {

    var constructor = [ null , undefined ].indexOf(value) >= 0
                    ? value : value.constructor

    allowed = accepted.indexOf(value) >= 0
              || accepted.indexOf(constructor) >= 0

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If value is not allowed, show an error message in the console.
  //----------------------------------------------------------------------------
  if (allowed === false) {

    if ( value !== undefined ) {

      var str = vars.format.locale.value.warning.accepted
        , recs = []
        , val = "\""+JSON.stringify(value)+"\""

      accepted.forEach(function(a){

        if (typeof a == "string") {
          recs.push("\""+a+"\"")
        }
        else {
          recs.push("\""+a.toString().split("()")[0].substring(9)+"\"")
        }

      })

      d3plus.console.warning(d3plus.util.format(str,val,text,recs.join(", ")))

    }

  }
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Otherwise, set the value!
  //----------------------------------------------------------------------------
  else {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If the method we are setting has a nested "value" key, change the
    // reference object and key to reflect that.
    //--------------------------------------------------------------------------
    if ( d3plus.object.validate( object[key] ) && "value" in object[key] ) {

      var parentKey = key
      object = object[key]
      key = "value"

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is a callback function, run it.
    //--------------------------------------------------------------------------
    if ( key === "value" ) {

      if ( "process" in object ) {

        value = d3plus.method.process( object , value )

      }

      if ( typeof object.callback === "function" && !object.url ) {

        var returnedValue = object.callback(value)
        if (returnedValue !== undefined) {
          value = returnedValue
        }

      }

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If value has not changed, show a comment in the console.
    //--------------------------------------------------------------------------
    if ( ( !(object[key] instanceof Array) && object[key] === value
         || ( object[key] && object[key] === value ) ) && value !== undefined ) {

      var str = vars.format.locale.value.dev.noChange
      if (vars.dev.value) d3plus.console.comment(d3plus.util.format(str,text))

    }
    else {

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Mark the method as being changed.
      //------------------------------------------------------------------------
      object.changed = true

      if ( "history" in vars && method !== "draw" ) {
        var copy = d3plus.util.copy(object)
        copy.method = method
        vars.history.chain.push(copy)
      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Before updating the value, store the previous one for reference.
      //------------------------------------------------------------------------
      object.previous = object[key]

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Set the variable!
      //------------------------------------------------------------------------
      if ( key === "value" && "nesting" in object ) {

        if ( method !== "id" ) {

          if ( typeof object.nesting !== "object" ) {
            object.nesting = {}
          }

          if ( typeof value == "string" ) {
            object.nesting[vars.id.value] = [value]
          }
          else if (value instanceof Array) {
            object.nesting[vars.id.value] = value
          }
          else {

            for (var id in value) {

              if ( typeof value[id] === "string" ) {
                value[id] = [value[id]]
              }

            }

            object.nesting = d3plus.util.merge( object.nesting , value )

            if ( !(vars.id.value in object.nesting) ) {
              object.nesting[vars.id.value] = value[d3.keys(value)[0]]
            }

          }

          object[key] = object.nesting[vars.id.value][0]

        }
        else {

          if ( value instanceof Array ) {

            object.nesting = value

            if ("depth" in vars && vars.depth.value < value.length) {
              object[key] = value[vars.depth.value]
            }
            else {
              object[key] = value[0]
              if ("depth" in vars) {
                vars.depth.value = 0
              }
            }

          }
          else {

            object[key] = value
            object.nesting = [value]
            if ("depth" in vars) {
              vars.depth.value = 0
            }

          }

        }

      }
      else if ( method === "depth" ) {

        if (value >= vars.id.nesting.length) {
          vars.depth.value = vars.id.nesting.length-1
        }
        else if (value < 0) {
          vars.depth.value = 0
        }
        else {
          vars.depth.value = value
        }

        vars.id.value = vars.id.nesting[vars.depth.value]

        if ( typeof vars.text.nesting === "object" ) {

          var n = vars.text.nesting[vars.id.value]
          if ( n ) {
            vars.text.nesting[vars.id.value] = typeof n == "string" ? [n] : n
            vars.text.value = n instanceof Array ? n[0] : n
          }

        }
      }
      else if ( typeof object[key] === "object" && typeof value === "object" ) {

        object[key] = d3plus.util.merge( object[key] , value )

      }
      else {

        object[key] = value

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Add method to global array if applicable.
      //------------------------------------------------------------------------
      if ( key === "value" && object.global === true ) {

        var hasValue = object[key].length > 0
          , k = parentKey || key

        if ( "k" in vars && ( ( hasValue && vars[k].indexOf(method) < 0 )
        || ( !hasValue && vars[k].indexOf(method) >= 0 ) ) ) {

          vars[k] = d3plus.array.update(vars[k],method)

        }

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Reset associated variables given if "value" is changed.
      //------------------------------------------------------------------------
      if (key == "value" && object.reset) {

        var reset = typeof object.reset == "string"
                  ? [ object.reset ] : object.reset

        reset.forEach(function(r){
          object[r] = false
        })

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Display console message, if applicable.
      //------------------------------------------------------------------------
      if ( ( vars.dev.value || key === "dev" )
      && ( object.changed || ("key" in object && object[key].changed) ) ) {

        var newVal = JSON.stringify(object[key])

        if (typeof object[key] !== "function" && newVal.length < 260) {

          var str = vars.format.locale.value.dev.setLong
          d3plus.console.log(d3plus.util.format(str,text,newVal))

        }
        else {

          var str = vars.format.locale.value.dev.set
          d3plus.console.log(d3plus.util.format(str,text))

        }

      }

    }

  }

}
