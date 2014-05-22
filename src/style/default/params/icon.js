d3plus.style.default.icon = {
  "button" : {
    "accepted" : [ false , String ],
    "fallback" : false,
    "opacity"  : 1,
    "process"  : function ( value ) {

      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )

    },
    "rotate"   : 0,
    "value"    : false
  },
  "drop"   : {
    "accepted" : [ false , String ],
    "fallback" : "&#x276f;",
    "opacity"  : 1,
    "process"  : function ( value ) {

      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )

    },
    "rotate"   : 0,
    "value"    : "fa-angle-down"
  },
  "fontCheck": function ( value , fallback ) {

    if ( value === false
       || ( value.indexOf("fa-") === 0 && d3plus.font.awesome ) ) {
      return value
    }
    else {
      return fallback
    }

  },
  "select" : {
    "accepted" : [ false , String ],
    "fallback" : "&#x2713;",
    "opacity"  : 1,
    "process"  : function ( value ) {

      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )

    },
    "rotate"   : 0,
    "value"    : "fa-check"
  }
}
