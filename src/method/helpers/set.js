//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Sets a method's value.
//------------------------------------------------------------------------------
d3plus.method.set = function( vars , method , object , key , value ) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create reference text for console statements.
  //----------------------------------------------------------------------------
  if ( key === "value" || !key || key === method ) {

    var text = "\."+method+"()"

  }
  else {

    var of = vars.format.locale.value.dev.of
      , text = "\""+key+"\" "+of+" \."+method+"()"

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Find appropriate "accepted" list.
  //----------------------------------------------------------------------------
  if (key === "value" && "accepted" in object) {

    var accepted = object.accepted

  }
  else if ( d3plus.object.validate( object[key] ) && "accepted" in object[key] ) {

    var accepted = object[key].accepted

  }
  else {

    var accepted = null

  }

  if ( typeof accepted === "function" ) {
    accepted = accepted( vars )
  }

  if ( accepted !== null && !(accepted instanceof Array) ) {
    accepted = [ accepted ]
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Check to see if the given value is allowed.
  //----------------------------------------------------------------------------
  var allowed = true
  if (accepted instanceof Array) {

    var constructor = value === undefined
                    ? value : value.constructor

    allowed = accepted.indexOf(value) >= 0
              || accepted.indexOf(constructor) >= 0

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If value is not allowed, show an error message in the console.
  //----------------------------------------------------------------------------
  if (allowed === false) {

    if ( value !== undefined ) {

      var str = vars.format.locale.value.dev.accepted
        , recs = []
        , val = JSON.stringify(value)
        , and = vars.format.locale.value.ui.and

      if ( typeof value !== "string" ) {
        val = "\""+val+"\""
      }

      accepted.forEach(function(a){

        if ( typeof a === "string" ) {
          recs.push("\""+a+"\"")
        }
        else if ( typeof a === "function" ) {
          recs.push(a.toString().split("()")[0].substring(9))
        }
        else {
          recs.push(a.toString())
        }

      })

      recs = d3plus.string.list(recs,and)
      d3plus.console.warning( d3plus.string.format(str,val,text,recs) , method )

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

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is a process function, run it.
    //------------------------------------------------------------------------
    if ( key === "value" && "process" in object ) {

      value = d3plus.method.process( object , value )

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If value has not changed, show a comment in the console.
    //--------------------------------------------------------------------------
    if ( !(object[key] instanceof Array) && object[key] === value && value !== undefined ) {

      var str = vars.format.locale.value.dev.noChange
      if ( vars.dev.value ) d3plus.console.comment(d3plus.string.format(str,text))

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
      if ( "id" in vars && key === "value" && "nesting" in object ) {

        if ( method !== "id" ) {

          if ( typeof object.nesting !== "object" ) {
            object.nesting = {}
          }

          if ( d3plus.object.validate( value ) ) {

            for (var id in value) {

              if ( typeof value[id] === "string" ) {
                value[id] = [value[id]]
              }

            }

            object.nesting = d3plus.object.merge( object.nesting , value )

            if ( !(vars.id.value in object.nesting) ) {
              object.nesting[vars.id.value] = value[d3.keys(value)[0]]
            }

          }
          else if ( value instanceof Array ) {
            object.nesting[vars.id.value] = value
          }
          else {
            object.nesting[vars.id.value] = [ value ]
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
      else if ( d3plus.object.validate(object[key]) && d3plus.object.validate(value) ) {

        object[key] = d3plus.object.merge( object[key] , value )

      }
      else {

        object[key] = value

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Add method to data solo/mute array if applicable.
      //------------------------------------------------------------------------
      if ( key === "value" && object.global ) {

        var hasValue = object[key].length > 0
          , k = parentKey || key

        if ( k in vars && ( ( hasValue && vars.data[k].indexOf(method) < 0 )
        || ( !hasValue && vars.data[k].indexOf(method) >= 0 ) ) ) {

          vars.data[k] = d3plus.array.update(vars.data[k],method)

        }

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Add method to data filter array if applicable.
      //------------------------------------------------------------------------
      if ( key === "value" && object.dataFilter && vars.data
      && vars.data.filters.indexOf(method) < 0 ) {

        vars.data.filters.push( method )

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Reset associated variables given if "value" is changed.
      //------------------------------------------------------------------------
      if (key === "value" && object.reset) {

        var reset = typeof object.reset == "string"
                  ? [ object.reset ] : object.reset

        reset.forEach(function(r){
          object[r] = false
        })

      }

      //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Display console message, if applicable.
      //------------------------------------------------------------------------
      if ( ( vars.dev.value || key === "dev" ) && object.changed
           && object[key] !== undefined ) {

        var longArray = object[key] instanceof Array && object[key].length > 10
          , d3selection = d3plus.util.d3selection(object[key])
          , typeFunction = typeof object[key] === "function"

        var valString = !longArray && !d3selection && !typeFunction
                      ? typeof object[key] === "string" ? object[key]
                      : JSON.stringify(object[key]) : null

        if ( ( vars.dev.value || ( key === "dev" && user ) )
             && !vars.methodGroup && vars.methodGroup !== "wait" ) {
          vars.methodGroup = true
          d3plus.console.groupCollapsed("method behavior")
        }

        if ( valString !== null && valString.length < 260 ) {

          var str = vars.format.locale.value.dev.setLong
          d3plus.console.log(d3plus.string.format(str,text,"\""+valString+"\""))


        }
        else {

          var str = vars.format.locale.value.dev.set
          d3plus.console.log(d3plus.string.format(str,text))

        }

      }

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // If there is a callback function not associated with a URL, run it.
    //--------------------------------------------------------------------------
    if ( key === "value" && object.callback && !object.url ) {

      object.callback(value)

    }

  }

}
