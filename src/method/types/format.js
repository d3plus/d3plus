d3plus.method.format = {
  "accepted"   : [ Function , String ],
  "deprecates" : [ "number_format" , "text_format" ],
  "locale"     : {
    "accepted" : function(){
      return d3.keys(d3plus.locale)
    },
    "process"  : function( value ) {

      var defaultLocale = "en_US"
        , returnObject  = d3plus.locale[defaultLocale]

      if ( value !== defaultLocale ) {
        returnObject = d3plus.object.merge( returnObject , d3plus.locale[value] )
      }

      this.language = value

      return returnObject

    },
    "value"    : "en_US"
  },
  "number"     : {
    "accepted" : [ false , Function ],
    "value"    : false
  },
  "process"    : function( value ) {

    if ( typeof value === "string" ) {
      var vars = this.getVars()
      vars.self.format({"locale": value})
    }
    else if ( typeof value === "function" ) {
      return value
    }

    return this.value

  },
  "text"       : {
    "accepted" : [ false , Function ],
    "value"    : false
  },
  "value"      : function( value , key ) {

    var vars = this.getVars()

    if ( vars.time && vars.time.value && key === vars.time.value ) {
      var f = vars.time.format.value || vars.data.time.format
        , v = value.constructor === Date ? value : new Date(value)
      // console.log(d3.locale(vars.format.locale.value.format).timeFormat)
      // f = d3.locale(vars.format.locale.value.format).timeFormat
      return f( v )
    }
    else if ( typeof value === "number" ) {
      var f = this.number.value || d3plus.number.format
      return f( value , key )
    }
    else if ( typeof value === "string" ) {
      var f = this.text.value || d3plus.string.title
      return f( value , key )
    }
    else {
      return JSON.stringify(value)
    }

  }
}
