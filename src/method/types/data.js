d3plus.method.data = {
  "accepted": [ Array , Boolean , Function , String ],
  "callback": false,
  "large": 400,
  "process": function ( value ) {

    if ( typeof value === "boolean" ||
       ( value instanceof Array && !d3plus.util.d3selection(value) ) ) {

      return value

    }
    else {

      var vars = this.getVars()
        , maybeURL = value.indexOf("/") >= 0

      if ( !maybeURL && d3plus.util.d3selection( value ) ) {

        this.element = value
        return d3plus.data.element( vars )

      }
      else if ( typeof value === "string" ) {

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

  },
  "stream": false,
  "url": false,
  "value": false
}
