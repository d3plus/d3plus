d3plus.style.default.ui = {
  "align"    : {
    "accepted" : [ "left" , "center" , "right" ],
    "process"  : function ( value ) {

      return d3plus.rtl ? value === "left" ? "right"
                        : value === "right" ? "left"
                        : value : value

    },
    "value"    : "center"
  },
  "border"   : 1,
  "color"    : {
    "primary"   : {
      "process" : function ( value ) {

        var vars = this.getVars()
          , primary = this.value
          , secondary = vars.ui.color.secondary.value

        if ( !secondary || secondary === d3.rgb(primary).darker(2).toString() ) {
          vars.ui.color.secondary.value = d3.rgb(value).darker(2).toString()
        }

        return value

      },
      "value"   : "#ffffff"
    },
    "secondary" : {
      "value" : false
    }
  },
  "display"  : {
    "acceped" : [ "block" , "inline-block" ],
    "value"   : "inline-block"
  },
  "font"     : {
    "align"      : "center",
    "color"      : "#444",
    "decoration" : {
      "accepted" : [ "line-through" , "none" , "overline" , "underline" ],
      "value"    : "none"
    },
    "family"     : d3plus.style.fontFamily(d3plus.style.default.fontFamily),
    "size": 11,
    "transform"  : {
      "accepted" : [ "capitalize" , "lowercase" , "none" , "uppercase" ],
      "value"    : "none"
    },
    "weight"     : 200
  },
  "margin"   : 5,
  "padding"  : 5,
  "position" : {
    "accepted" : [ "top" , "right" , "bottom" , "left" ],
    "value"    : "bottom"
  }
}
