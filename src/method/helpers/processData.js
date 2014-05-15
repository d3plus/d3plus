//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Function to process data by url or element.
//--------------------------------------------------------------------------
d3plus.method.processData = function ( value ) {

  if ( typeof value !== "string" && !d3plus.util.d3selection( value ) ) {

    return value

  }
  else {

    var vars = this.getVars()
      , maybeURL = value.indexOf("/") >= 0

    if ( !maybeURL && d3plus.util.d3selection( value ) ) {

      this.element = value
      return d3plus.data.element( vars )

    }
    else {

      if ( !maybeURL && !d3.selectAll( value ).empty() ) {

        this.element = d3.selectAll( value )
        return d3plus.data.element( vars )

      }
      else {

        this.url = value
        return []

      }

    }

    return []

  }

}
