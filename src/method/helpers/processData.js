//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Function to process data by url or element.
//--------------------------------------------------------------------------
d3plus.method.processData = function ( value , self ) {

  if ( typeof value !== "string" && !d3plus.util.d3selection( value ) ) {

    return value

  }
  else {

    if ( self === undefined ) {
      var self = this
    }

    var vars = self.getVars()
      , maybeURL = value.indexOf("/") >= 0

    if ( !maybeURL && d3plus.util.d3selection( value ) ) {

      return value

    }
    else {

      if ( !maybeURL && !d3.selectAll( value ).empty() ) {

        return d3.selectAll( value )

      }
      else {

        self.url = value
        return []

      }

    }

    return []

  }

}
