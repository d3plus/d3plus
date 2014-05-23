d3plus.style.default.font = {
  "align"      : {
    "accepted" : [ "left" , "center" , "right" ],
    "process"  : function ( value ) {

      return d3plus.rtl ? value === "left" ? "right"
                        : value === "right" ? "left"
                        : value : value

    },
    "value"    : "left"
  },
  "color"      : "#444444",
  "decoration" : {
    "accepted" : [ "line-through" , "none" , "overline" , "underline" ],
    "value"    : "none"
  },
  "family"     : d3plus.style.fontFamily(d3plus.style.default.fontFamily),
  "secondary"  : {
    "align"      : {
      "accepted" : [ "left" , "center" , "right" ],
      "process"  : function ( value ) {

        return d3plus.rtl ? value === "left" ? "right"
                          : value === "right" ? "left"
                          : value : value

      },
      "value"    : "left"
    },
    "color"      : "#444444",
    "decoration" : {
      "accepted" : [ "line-through" , "none" , "overline" , "underline" ],
      "value"    : "none"
    },
    "family"     : d3plus.style.fontFamily(d3plus.style.default.fontFamily),
    "size"       : 12,
    "spacing"    : 0,
    "transform"  : {
      "accepted" : [ "capitalize" , "lowercase" , "none" , "uppercase" ],
      "value"    : "none"
    },
    "weight"     : 200
  },
  "size"       : 12,
  "spacing"    : 0,
  "transform"  : {
    "accepted" : [ "capitalize" , "lowercase" , "none" , "uppercase" ],
    "value"    : "none"
  },
  "weight"     : 200
}
