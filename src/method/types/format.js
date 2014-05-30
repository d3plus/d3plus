d3plus.method.format = {
  "accepted"   : [ Function , String ],
  "deprecates" : [ "number_format" , "text_format" ],
  "locale"     : {
    "accepted" : function(){
      return d3.keys(d3plus.locale)
    },
    "process"  : function( value ) {

      var defaultLocale = "en"
        , returnObject  = d3plus.locale[defaultLocale]

      if ( value !== defaultLocale ) {
        returnObject = d3plus.util.merge( returnObject , d3plus.locale[value] )
      }

      return returnObject

    },
    "value"    : "en"
  },
  "number"     : d3plus.number.format,
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
  "text"       : d3plus.string.title,
  "value"      : function( value , key ) {

    if ( typeof value === "number" ) {
      return this.number( value , key )
    }
    if ( typeof value === "string" ) {
      return this.text( value , key )
    }
    else {
      return JSON.stringify(value)
    }

  }
}
