//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Function to process data by url or element.
//--------------------------------------------------------------------------
d3plus.method.processData = function ( value , self ) {

  if ( typeof value !== "string" && !d3plus.util.d3selection( value ) ) {

    if ( value instanceof Array ) {
      return d3plus.util.copy(value)
    }
    else {
      return value
    }

  }
  else {

    if ( self === undefined ) {
      var self = this
    }

    var vars = self.getVars()
      , maybeURL = value.indexOf("/") >= 0

    if ( !maybeURL && d3plus.util.d3selection( value ) ) {

      self.element = value
      return d3plus.data.element( vars )

    }
    else {

      if ( !maybeURL && !d3.selectAll( value ).empty() ) {

        self.element = d3.selectAll( value )
        return d3plus.data.element( vars )

      }
      else {

        self.url = value
        return []

      }

    }

    return []

  }

}
