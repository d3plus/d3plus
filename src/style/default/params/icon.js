d3plus.style.default.icon = {
  "button": {
    "accepted": [ Boolean , String ],
    "fallback": false,
    "opacity": 1,
    "process": function ( value ) {
      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )
    },
    "rotate": 0,
    "value": false
  },
  "drop": {
    "accepted": [ Boolean , String ],
    "fallback": "&#x276f;",
    "opacity": 1,
    "process": function ( value ) {
      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )
    },
    "rotate": 0,
    "value": "fa-angle-down"
  },
  "fontCheck": function ( value , fallback ) {

    if ( typeof value === "string" && value.indexOf("fa-") === 0 ) {
      if ( d3plus.font.awesome ) {
        return value
      }
      else {
        return fallback
      }
    }
    else {
      return value
    }

  },
  "select": {
    "accepted": [ Boolean , String ],
    "fallback": "&#x2713;",
    "opacity": 1,
    "process": function ( value ) {
      var fallback = this.fallback
      return d3plus.style.default.icon.fontCheck( value , fallback )
    },
    "rotate": 0,
    "value": "fa-check"
  }
}
